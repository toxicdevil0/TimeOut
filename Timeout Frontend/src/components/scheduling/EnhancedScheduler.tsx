import React, { useState, useCallback } from 'react';
import { useSchedule, TimeoutEvent } from './ScheduleProvider';
import { EventManagement } from './EventManagement';
import { SimpleGridScheduler } from './SimpleGridScheduler';

export const EnhancedScheduler: React.FC = () => {
  // Event management state
  const [selectedEvent, setSelectedEvent] = useState<TimeoutEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const { updateEvent, deleteEvent } = useSchedule();

  // Event management functions
  const handleEditEvent = useCallback((event: TimeoutEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  }, []);

  const handleSaveEvent = useCallback((eventData: Partial<TimeoutEvent>) => {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, eventData);
      setShowEventDialog(false);
      setSelectedEvent(null);
    }
  }, [selectedEvent, updateEvent]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    deleteEvent(eventId);
    setShowEventDialog(false);
    setSelectedEvent(null);
  }, [deleteEvent]);

  const handleCloseDialog = useCallback(() => {
    setShowEventDialog(false);
    setSelectedEvent(null);
  }, []);

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Simple Grid Scheduler - Our custom implementation */}
      <SimpleGridScheduler onEditEvent={handleEditEvent} />

      {/* Event Management Dialog - Keep this working feature */}
      <EventManagement
        event={selectedEvent}
        isOpen={showEventDialog}
        mode={selectedEvent ? 'edit' : null}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onClose={handleCloseDialog}
      />
    </div>
  );
};