import { useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  saveUserSchedule, 
  getUserSchedule, 
  updateUserEvent, 
  updateUserTemplate 
} from '@/config/firebase';
import { TimeoutEvent, DailyTemplate } from '@/components/scheduling/ScheduleProvider';

export interface SyncStatus {
  isLoading: boolean;
  lastSyncAt: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
}

export interface ScheduleSyncHook {
  syncStatus: SyncStatus;
  loadUserSchedule: () => Promise<{
    events: TimeoutEvent[];
    templates: DailyTemplate[];
  } | null>;
  saveScheduleData: (events: TimeoutEvent[], templates: DailyTemplate[]) => Promise<boolean>;
  syncEvent: (event: TimeoutEvent, action: 'add' | 'update' | 'delete') => Promise<boolean>;
  syncTemplate: (template: DailyTemplate, action: 'add' | 'update' | 'delete') => Promise<boolean>;
  markUnsavedChanges: () => void;
  clearUnsavedChanges: () => void;
}

export const useScheduleSync = (): ScheduleSyncHook => {
  const { user } = useUser();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    lastSyncAt: null,
    error: null,
    hasUnsavedChanges: false,
  });

  // Debounce timer for auto-save
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = (loading: boolean) => {
    setSyncStatus(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setSyncStatus(prev => ({ ...prev, error }));
  };

  const setLastSync = () => {
    setSyncStatus(prev => ({ 
      ...prev, 
      lastSyncAt: new Date(),
      hasUnsavedChanges: false,
      error: null 
    }));
  };

  const markUnsavedChanges = useCallback(() => {
    setSyncStatus(prev => ({ ...prev, hasUnsavedChanges: true }));
  }, []);

  const clearUnsavedChanges = useCallback(() => {
    setSyncStatus(prev => ({ ...prev, hasUnsavedChanges: false }));
  }, []);

  const loadUserSchedule = useCallback(async () => {
    if (!user) {
      console.log('📋 No user authenticated, skipping schedule load');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📋 Loading user schedule from database...');
      const result = await getUserSchedule();
      
      const data = result.data as any;
      if (data?.success && data?.scheduleData) {
        const { events, templates } = data.scheduleData;
        
        // Convert backend data to frontend format
        const formattedEvents: TimeoutEvent[] = events.map((event: any) => ({
          ...event,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
        }));

        const formattedTemplates: DailyTemplate[] = templates.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt),
        }));

        setLastSync();
        console.log('✅ Schedule loaded successfully:', {
          events: formattedEvents.length,
          templates: formattedTemplates.length
        });

        return {
          events: formattedEvents,
          templates: formattedTemplates,
        };
      }

      // Return empty data if no schedule found
      console.log('📋 No schedule data found, returning empty');
      setLastSync();
      return {
        events: [],
        templates: [],
      };

    } catch (error) {
      console.error('❌ Failed to load user schedule:', error);
      setError('Failed to load schedule data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveScheduleData = useCallback(async (events: TimeoutEvent[], templates: DailyTemplate[]) => {
    if (!user) {
      console.log('📋 No user authenticated, skipping save');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert frontend data to backend format
      const backendEvents = events.map(event => ({
        ...event,
        startTime: event.start,
        endTime: event.end,
      }));

      console.log('💾 Saving schedule data to database...', {
        events: backendEvents.length,
        templates: templates.length
      });

      const result = await saveUserSchedule({
        events: backendEvents,
        templates: templates,
      });

      if ((result.data as any)?.success) {
        setLastSync();
        console.log('✅ Schedule data saved successfully');
        return true;
      }

      throw new Error('Save operation failed');
    } catch (error) {
      console.error('❌ Failed to save schedule data:', error);
      setError('Failed to save schedule data');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const syncEvent = useCallback(async (event: TimeoutEvent, action: 'add' | 'update' | 'delete') => {
    if (!user) {
      console.log('📋 No user authenticated, skipping event sync');
      return false;
    }

    try {
      setError(null);

      const backendEvent = {
        ...event,
        startTime: event.start,
        endTime: event.end,
      };

      console.log(`💾 Syncing event (${action}):`, event.title);

      const result = await updateUserEvent({
        event: backendEvent,
        action,
      });

      if ((result.data as any)?.success) {
        console.log(`✅ Event ${action}ed successfully`);
        return true;
      }

      throw new Error(`Event ${action} failed`);
    } catch (error) {
      console.error(`❌ Failed to ${action} event:`, error);
      setError(`Failed to ${action} event`);
      return false;
    }
  }, [user]);

  const syncTemplate = useCallback(async (template: DailyTemplate, action: 'add' | 'update' | 'delete') => {
    if (!user) {
      console.log('📋 No user authenticated, skipping template sync');
      return false;
    }

    try {
      setError(null);

      console.log(`💾 Syncing template (${action}):`, template.name);

      const result = await updateUserTemplate({
        template,
        action,
      });

      if ((result.data as any)?.success) {
        console.log(`✅ Template ${action}ed successfully`);
        return true;
      }

      throw new Error(`Template ${action} failed`);
    } catch (error) {
      console.error(`❌ Failed to ${action} template:`, error);
      setError(`Failed to ${action} template`);
      return false;
    }
  }, [user]);

  return {
    syncStatus,
    loadUserSchedule,
    saveScheduleData,
    syncEvent,
    syncTemplate,
    markUnsavedChanges,
    clearUnsavedChanges,
  };
};