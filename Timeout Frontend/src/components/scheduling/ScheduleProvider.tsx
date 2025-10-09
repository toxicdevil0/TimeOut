import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useScheduleSync, SyncStatus } from '@/hooks/useScheduleSync';

// Types for our scheduling system
export interface TimeoutEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  bgColor?: string;
  color?: string;
  type: 'study' | 'break' | 'meeting' | 'focus';
  description?: string;
  location?: string;
}

export interface ScheduleResource {
  id: string;
  name: string;
  color?: string;
}

// Template system for daily timetables
export interface DailyTemplate {
  id: string;
  name: string;
  description?: string;
  color?: string;
  events: TemplateEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateEvent {
  title: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  resourceId: string;
  type: 'study' | 'break' | 'meeting' | 'focus';
  description?: string;
  location?: string;
  bgColor?: string;
}

interface ScheduleContextType {
  events: TimeoutEvent[];
  resources: ScheduleResource[];
  selectedDate: Date;
  viewType: 'week' | 'day' | 'month';
  templates: DailyTemplate[];
  syncStatus: SyncStatus;
  isDataLoaded: boolean;
  addEvent: (event: Omit<TimeoutEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<TimeoutEvent>) => void;
  deleteEvent: (id: string) => void;
  setSelectedDate: (date: Date) => void;
  setViewType: (view: 'week' | 'day' | 'month') => void;
  // Template management
  addTemplate: (template: Omit<DailyTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<DailyTemplate>) => void;
  deleteTemplate: (id: string) => void;
  applyTemplate: (templateId: string, targetDate: Date, replaceExisting?: boolean) => void;
  applyTemplateToRange: (templateId: string, startDate: Date, endDate: Date, replaceExisting?: boolean) => void;
  // Data management
  refreshData: () => Promise<void>;
  saveAllData: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

interface ScheduleProviderProps {
  children: React.ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const { user } = useUser();
  const {
    syncStatus,
    loadUserSchedule,
    saveScheduleData,
    syncEvent,
    syncTemplate,
    markUnsavedChanges,
  } = useScheduleSync();

  // Local state - preserves existing functionality
  const [events, setEvents] = useState<TimeoutEvent[]>([]);
  const [templates, setTemplates] = useState<DailyTemplate[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [resources] = useState<ScheduleResource[]>([
    { id: 'study', name: 'Study Sessions', color: 'hsl(212, 86%, 64%)' },
    { id: 'break', name: 'Breaks', color: 'hsl(145, 63%, 42%)' },
    { id: 'meeting', name: 'Group Sessions', color: 'hsl(212, 86%, 74%)' },
    { id: 'focus', name: 'Deep Focus', color: 'hsl(262, 83%, 58%)' }
  ]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'day' | 'month'>('week');

  // Load user data when user is authenticated
  useEffect(() => {
    const loadData = async () => {
      if (user && !isDataLoaded) {
        console.log('📋 User authenticated, loading schedule data...');
        const data = await loadUserSchedule();
        
        if (data) {
          setEvents(data.events);
          setTemplates(data.templates);
          console.log('✅ Schedule data loaded from database');
        } else {
          // Keep empty arrays for new users
          console.log('📋 No existing data, starting fresh');
        }
        
        setIsDataLoaded(true);
      } else if (!user && isDataLoaded) {
        // User logged out, clear data
        console.log('🔄 User logged out, clearing local data');
        setEvents([]);
        setTemplates([]);
        setIsDataLoaded(false);
      }
    };

    loadData();
  }, [user, isDataLoaded, loadUserSchedule]);

  // Save data periodically (debounced)
  useEffect(() => {
    if (!user || !isDataLoaded || (!events.length && !templates.length)) {
      return;
    }

    const saveTimer = setTimeout(() => {
      if (syncStatus.hasUnsavedChanges) {
        console.log('💾 Auto-saving schedule data...');
        saveScheduleData(events, templates);
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [events, templates, user, isDataLoaded, syncStatus.hasUnsavedChanges, saveScheduleData]);

  const addEvent = useCallback((eventData: Omit<TimeoutEvent, 'id'>) => {
    const newEvent: TimeoutEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Update local state immediately (optimistic update)
    setEvents(prev => [...prev, newEvent]);
    
    // Mark as having unsaved changes
    markUnsavedChanges();
    
    // Sync with database if user is authenticated
    if (user && isDataLoaded) {
      syncEvent(newEvent, 'add').catch(error => {
        console.error('Failed to sync new event:', error);
        // Could add error handling UI here
      });
    }
  }, [user, isDataLoaded, syncEvent, markUnsavedChanges]);

  const updateEvent = useCallback((id: string, updates: Partial<TimeoutEvent>) => {
    let updatedEvent: TimeoutEvent | null = null;
    
    // Update local state immediately (optimistic update)
    setEvents(prev => prev.map(event => {
      if (event.id === id) {
        updatedEvent = { ...event, ...updates };
        return updatedEvent;
      }
      return event;
    }));
    
    // Mark as having unsaved changes
    markUnsavedChanges();
    
    // Sync with database if user is authenticated
    if (user && isDataLoaded && updatedEvent) {
      syncEvent(updatedEvent, 'update').catch(error => {
        console.error('Failed to sync updated event:', error);
      });
    }
  }, [user, isDataLoaded, syncEvent, markUnsavedChanges]);

  const deleteEvent = useCallback((id: string) => {
    let deletedEvent: TimeoutEvent | null = null;
    
    // Update local state immediately (optimistic update)
    setEvents(prev => {
      const eventToDelete = prev.find(event => event.id === id);
      if (eventToDelete) {
        deletedEvent = eventToDelete;
      }
      return prev.filter(event => event.id !== id);
    });
    
    // Mark as having unsaved changes
    markUnsavedChanges();
    
    // Sync with database if user is authenticated
    if (user && isDataLoaded && deletedEvent) {
      syncEvent(deletedEvent, 'delete').catch(error => {
        console.error('Failed to sync deleted event:', error);
      });
    }
  }, [user, isDataLoaded, syncEvent, markUnsavedChanges]);

  // Template management functions with database sync
  const addTemplate = useCallback((templateData: Omit<DailyTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: DailyTemplate = {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Update local state immediately (optimistic update)
    setTemplates(prev => [...prev, newTemplate]);
    
    // Mark as having unsaved changes
    markUnsavedChanges();
    
    // Sync with database if user is authenticated
    if (user && isDataLoaded) {
      syncTemplate(newTemplate, 'add').catch(error => {
        console.error('Failed to sync new template:', error);
      });
    }
  }, [user, isDataLoaded, syncTemplate, markUnsavedChanges]);

  const updateTemplate = useCallback((id: string, updates: Partial<DailyTemplate>) => {
    let updatedTemplate: DailyTemplate | null = null;
    
    // Update local state immediately (optimistic update)
    setTemplates(prev => prev.map(template => {
      if (template.id === id) {
        updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
        return updatedTemplate;
      }
      return template;
    }));
    
    // Mark as having unsaved changes
    markUnsavedChanges();
    
    // Sync with database if user is authenticated
    if (user && isDataLoaded && updatedTemplate) {
      syncTemplate(updatedTemplate, 'update').catch(error => {
        console.error('Failed to sync updated template:', error);
      });
    }
  }, [user, isDataLoaded, syncTemplate, markUnsavedChanges]);

  const deleteTemplate = useCallback((id: string) => {
    let deletedTemplate: DailyTemplate | null = null;
    
    // Update local state immediately (optimistic update)
    setTemplates(prev => {
      const templateToDelete = prev.find(template => template.id === id);
      if (templateToDelete) {
        deletedTemplate = templateToDelete;
      }
      return prev.filter(template => template.id !== id);
    });
    
    // Mark as having unsaved changes
    markUnsavedChanges();
    
    // Sync with database if user is authenticated
    if (user && isDataLoaded && deletedTemplate) {
      syncTemplate(deletedTemplate, 'delete').catch(error => {
        console.error('Failed to sync deleted template:', error);
      });
    }
  }, [user, isDataLoaded, syncTemplate, markUnsavedChanges]);

  const applyTemplate = useCallback((templateId: string, targetDate: Date, replaceExisting = false) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    // Remove existing events for the day if replacing
    if (replaceExisting) {
      setEvents(prev => prev.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() !== targetDate.toDateString();
      }));
    }

    // Create events from template
    const newEvents: TimeoutEvent[] = template.events.map(templateEvent => {
      const [startHour, startMin] = templateEvent.startTime.split(':').map(Number);
      const [endHour, endMin] = templateEvent.endTime.split(':').map(Number);

      const start = new Date(targetDate);
      start.setHours(startHour, startMin, 0, 0);

      const end = new Date(targetDate);
      end.setHours(endHour, endMin, 0, 0);

      return {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: templateEvent.title,
        start,
        end,
        resourceId: templateEvent.resourceId,
        type: templateEvent.type,
        bgColor: templateEvent.bgColor,
        description: templateEvent.description,
        location: templateEvent.location
      };
    });

    setEvents(prev => [...prev, ...newEvents]);
    
    // Mark as having unsaved changes and sync new events
    markUnsavedChanges();
    
    if (user && isDataLoaded) {
      // Sync all new events created from template
      newEvents.forEach(event => {
        syncEvent(event, 'add').catch(error => {
          console.error('Failed to sync template-generated event:', error);
        });
      });
    }
  }, [templates, user, isDataLoaded, syncEvent, markUnsavedChanges]);

  const applyTemplateToRange = useCallback((templateId: string, startDate: Date, endDate: Date, replaceExisting = false) => {
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      applyTemplate(templateId, new Date(currentDate), replaceExisting);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }, [applyTemplate]);

  // Data management functions
  const refreshData = useCallback(async () => {
    if (!user) {
      console.log('📋 No user authenticated, cannot refresh data');
      return;
    }

    console.log('🔄 Refreshing schedule data from database...');
    const data = await loadUserSchedule();
    
    if (data) {
      setEvents(data.events);
      setTemplates(data.templates);
      console.log('✅ Schedule data refreshed successfully');
    }
  }, [user, loadUserSchedule]);

  const saveAllData = useCallback(async () => {
    if (!user || !isDataLoaded) {
      console.log('📋 Cannot save: No user authenticated or data not loaded');
      return;
    }

    console.log('💾 Manually saving all schedule data...');
    await saveScheduleData(events, templates);
  }, [user, isDataLoaded, events, templates, saveScheduleData]);

  const value: ScheduleContextType = {
    events,
    resources,
    selectedDate,
    viewType,
    templates,
    syncStatus,
    isDataLoaded,
    addEvent,
    updateEvent,
    deleteEvent,
    setSelectedDate,
    setViewType,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    applyTemplateToRange,
    refreshData,
    saveAllData
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};