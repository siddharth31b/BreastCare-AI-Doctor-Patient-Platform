const supabase = require('../config/supabase');

const isTestMode =
  process.env.NODE_ENV === 'test' ||
  process.argv.some(a => a.includes('test')) ||
  process.execArgv.some(a => a.includes('--test'));

class RealtimeBridge {
  constructor() {
    /**
     * Active SSE client connections:
     * Set of { id: string, userId: string, role: string, res: Response, req: Request }
     */
    this.clients = new Set();
    this.keepaliveInterval = null;
    if (!isTestMode) {
      this.initSupabaseRealtime();
      this.startKeepalive();
    }
  }

  /**
   * Initializes Supabase Realtime channel to capture database-level PostgreSQL changes.
   */
  initSupabaseRealtime() {
    if (!supabase || process.env.NODE_ENV === 'test') {
      console.log('[RealtimeBridge] Operating in test/direct event mode.');
      return;
    }

    try {
      this.channel = supabase.channel('supabase-clinical-realtime');

      this.channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'assessments' },
          (payload) => {
            const eventType =
              payload.eventType === 'INSERT'
                ? 'ASSESSMENT_CREATED'
                : payload.new?.status === 'DOCTOR_VALIDATED'
                ? 'ASSESSMENT_VALIDATED'
                : payload.new?.status === 'REASSESSMENT_REQUESTED'
                ? 'ASSESSMENT_REASSESSMENT'
                : 'ASSESSMENT_SUBMITTED';

            this.broadcast({
              type: eventType,
              table: 'assessments',
              eventType: payload.eventType,
              doctorId: payload.new?.doctor_id || payload.old?.doctor_id || null,
              assessmentId: payload.new?.id || payload.old?.id || null,
              status: payload.new?.status || null,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'patients' },
          (payload) => {
            this.broadcast({
              type: 'PATIENT_REGISTERED',
              table: 'patients',
              eventType: payload.eventType,
              patientId: payload.new?.id || null,
              timestamp: new Date().toISOString(),
            });
          }
        )
        .subscribe((status) => {
          console.log('[RealtimeBridge] Supabase Realtime connection status:', status);
        });
    } catch (err) {
      console.warn('[RealtimeBridge] Error subscribing to Supabase Realtime:', err.message);
    }
  }

  /**
   * Registers a new connected SSE client
   */
  addClient(client) {
    this.clients.add(client);
    console.log(`[RealtimeBridge] Client connected (${client.role}: ${client.userId}). Total active: ${this.clients.size}`);

    client.req.on('close', () => {
      this.clients.delete(client);
      console.log(`[RealtimeBridge] Client disconnected (${client.userId}). Remaining: ${this.clients.size}`);
    });
  }

  /**
   * Broadcasts an event to connected clients respecting RBAC isolation
   */
  broadcast(event) {
    const dataString = `data: ${JSON.stringify(event)}\n\n`;

    for (const client of this.clients) {
      try {
        // Isolation check: Doctors only receive events for their assigned doctor_id (or global patient notifications)
        if (client.role === 'DOCTOR' && event.doctorId && client.userId !== event.doctorId) {
          continue;
        }

        client.res.write(dataString);
      } catch (err) {
        console.warn('[RealtimeBridge] Failed writing to client socket:', err.message);
        this.clients.delete(client);
      }
    }
  }

  /**
   * Dispatches explicit clinical event triggered after backend database persistence confirms success
   */
  notifyClinicalEvent(type, data = {}) {
    this.broadcast({
      type,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Periodic SSE heartbeat to keep persistent TCP connection alive through proxies
   */
  startKeepalive() {
    this.keepaliveInterval = setInterval(() => {
      for (const client of this.clients) {
        try {
          client.res.write(': keepalive\n\n');
        } catch (_) {
          this.clients.delete(client);
        }
      }
    }, 25000);

    if (this.keepaliveInterval && this.keepaliveInterval.unref) {
      this.keepaliveInterval.unref();
    }
  }

  cleanup() {
    if (this.keepaliveInterval) clearInterval(this.keepaliveInterval);
    if (this.channel) this.channel.unsubscribe();
    this.clients.clear();
  }
}

module.exports = new RealtimeBridge();
