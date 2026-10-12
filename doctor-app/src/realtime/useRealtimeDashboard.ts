import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboardData, DashboardData } from '../api/dashboard';
import { realtimeManager, RealtimeEventPayload } from './subscriptionManager';

const POLLING_INTERVAL_MS = 15000; // Sensible 15-second refresh interval

export interface UseRealtimeDashboardReturn {
  patients: DashboardData['patients'];
  assessments: DashboardData['assessments'];
  stats: DashboardData['stats'];
  loading: boolean;
  refreshing: boolean;
  lastSyncTime: Date | null;
  syncStatusText: string;
  isLive: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRealtimeDashboard(enabled: boolean = true): UseRealtimeDashboardReturn {
  const [data, setData] = useState<DashboardData>({
    doctor: null,
    patients: [],
    assessments: [],
    stats: {
      totalPatients: 0,
      pendingReviews: 0,
      validatedAssessments: 0,
      urgentOrHighRisk: 0,
    },
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatusText, setSyncStatusText] = useState<string>('Connecting...');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isMountedRef.current) return;
    if (!isSilent) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const res = await getDashboardData();
      if (!isMountedRef.current) return;
      setData(res);
      const now = new Date();
      setLastSyncTime(now);
      setIsLive(true);
      setSyncStatusText('Live');
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn('[useRealtimeDashboard] Fetch error:', err?.message);
      setError(err?.message || 'Error loading dashboard data');
      setIsLive(false);
      setSyncStatusText('Offline');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Update sync status text over time (e.g. "Synced just now", "Synced 1m ago")
  useEffect(() => {
    if (!lastSyncTime) return;
    const interval = setInterval(() => {
      if (!lastSyncTime) return;
      const elapsedSec = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
      if (elapsedSec < 30) {
        setSyncStatusText('Live');
      } else if (elapsedSec < 60) {
        setSyncStatusText('Synced just now');
      } else {
        const mins = Math.floor(elapsedSec / 60);
        setSyncStatusText(`Synced ${mins}m ago`);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Main lifecycle: initial fetch + realtime event subscription + periodic fallback polling
  useEffect(() => {
    isMountedRef.current = true;
    if (!enabled) return;

    fetchData(false);

    // Connect cross-device SSE stream
    realtimeManager.ensureStreamConnected().catch(err => {
      console.warn('[useRealtimeDashboard] Stream connect note:', err);
    });

    // Subscribe to internal realtime events
    const unsubscribe = realtimeManager.subscribe((event: RealtimeEventPayload) => {
      console.log(`[useRealtimeDashboard] Received event: ${event.type}`);
      fetchData(true);
    });

    // Periodic fallback polling
    const timer = setInterval(() => {
      fetchData(true);
    }, POLLING_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      unsubscribe();
      clearInterval(timer);
    };
  }, [enabled, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  return {
    patients: data.patients,
    assessments: data.assessments,
    stats: data.stats,
    loading,
    refreshing,
    lastSyncTime,
    syncStatusText,
    isLive,
    error,
    refresh,
  };
}
