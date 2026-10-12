import { getBaseUrl } from '../api/client';
import { getFreshIdToken } from '../services/firebaseAuth';

export type RealtimeEventType =
  | 'PATIENT_REGISTERED'
  | 'ASSESSMENT_CREATED'
  | 'ASSESSMENT_SUBMITTED'
  | 'ASSESSMENT_VALIDATED'
  | 'ASSESSMENT_REASSESSMENT'
  | 'DATA_REFRESHED'
  | 'CONNECTED';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  payload?: any;
  timestamp: Date;
}

export type RealtimeListener = (event: RealtimeEventPayload) => void;

class RealtimeSubscriptionManager {
  private listeners: Set<RealtimeListener> = new Set();
  private xhr: XMLHttpRequest | null = null;
  private reconnectTimer: any = null;
  private isConnecting: boolean = false;
  private shouldStayConnected: boolean = false;

  /**
   * Subscribe to realtime clinical events.
   * Returns an unsubscribe cleanup function.
   */
  subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatches a realtime event to all active subscribers.
   */
  emit(type: RealtimeEventType, payload?: any): void {
    const event: RealtimeEventPayload = {
      type,
      payload,
      timestamp: new Date(),
    };
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.warn('[RealtimeManager] Listener error:', err);
      }
    });
  }

  /**
   * Connect to backend SSE stream for cross-device events
   */
  async ensureStreamConnected(): Promise<void> {
    this.shouldStayConnected = true;
    if (this.xhr || this.isConnecting) return;

    this.isConnecting = true;
    try {
      const token = await getFreshIdToken();
      if (!token) {
        this.isConnecting = false;
        return;
      }

      const baseUrl = await getBaseUrl();
      const streamUrl = `${baseUrl}/realtime/stream?token=${encodeURIComponent(token)}`;

      const xhr = new XMLHttpRequest();
      this.xhr = xhr;

      let seenIndex = 0;
      xhr.open('GET', streamUrl);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onprogress = () => {
        const text = xhr.responseText;
        const newText = text.substring(seenIndex);
        seenIndex = text.length;

        const lines = newText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6).trim();
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.type) {
                  this.emit(parsed.type as RealtimeEventType, parsed);
                }
              } catch (_) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      };

      xhr.onloadend = () => {
        this.xhr = null;
        this.isConnecting = false;
        if (this.shouldStayConnected) {
          this.scheduleReconnect();
        }
      };

      xhr.onerror = () => {
        this.xhr = null;
        this.isConnecting = false;
        if (this.shouldStayConnected) {
          this.scheduleReconnect();
        }
      };

      xhr.send();
    } catch (err) {
      console.warn('[RealtimeManager] Stream connection error:', err);
      this.xhr = null;
      this.isConnecting = false;
      if (this.shouldStayConnected) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldStayConnected) {
        this.ensureStreamConnected();
      }
    }, 5000);
  }

  disconnectStream(): void {
    this.shouldStayConnected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.xhr) {
      try {
        this.xhr.abort();
      } catch (_) {}
      this.xhr = null;
    }
    this.isConnecting = false;
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

export const realtimeManager = new RealtimeSubscriptionManager();
