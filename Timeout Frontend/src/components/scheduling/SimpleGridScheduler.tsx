import React, { useState, useCallback } from 'react';
import { useSchedule, TimeoutEvent } from './ScheduleProvider';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Clock, Trash2, Plus, Zap, Settings } from "lucide-react";
import dayjs from 'dayjs';
import { EventCreationDialog } from './EventCreationDialog';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { DailyTemplateCreator } from './DailyTemplateCreator';
import { TemplateApplicator } from './TemplateApplicator';

interface SimpleGridSchedulerProps {
  onEditEvent: (event: TimeoutEvent) => void;
}

export const SimpleGridScheduler: React.FC<SimpleGridSchedulerProps> = ({ onEditEvent }) => {
  const { events, resources, selectedDate, viewType, templates, addEvent, deleteEvent, setSelectedDate, setViewType } = useSchedule();
  
  // Dialog state
  const [showCreationDialog, setShowCreationDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEventForDelete, setSelectedEventForDelete] = useState<TimeoutEvent | null>(null);
  const [creationData, setCreationData] = useState<{
    date: Date;
    hour: number;
    resourceId: string;
    resourceName: string;
  } | null>(null);
  
  // Template dialog states
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [showTemplateApplicator, setShowTemplateApplicator] = useState(false);

  // Time slots from 8 AM to 10 PM (14 hours)
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = 8 + i;
    return {
      hour,
      label: `${hour}:00`,
      value: hour
    };
  });

  // Get week days based on selected date
  const getWeekDays = () => {
    const startOfWeek = dayjs(selectedDate).startOf('week');
    return Array.from({ length: 7 }, (_, i) => {
      const date = startOfWeek.add(i, 'day');
      return {
        date: date.toDate(),
        label: date.format('ddd'),
        fullLabel: date.format('MMM D'),
        dayNumber: date.format('D'),
        isToday: date.isSame(dayjs(), 'day')
      };
    });
  };

  const weekDays = getWeekDays();

  // Conflict detection and validation
  const checkTimeConflict = (date: Date, startHour: number, endHour: number, excludeEventId?: string) => {
    return events.some(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);
      const checkStart = dayjs(date).hour(startHour).minute(0);
      const checkEnd = dayjs(date).hour(endHour).minute(0);
      
      return eventStart.isSame(date, 'day') && (
        (checkStart.isBefore(eventEnd) && checkEnd.isAfter(eventStart))
      );
    });
  };

  const getMainTopicsCount = (date: Date) => {
    return events.filter(event => {
      const eventDate = dayjs(event.start);
      return eventDate.isSame(date, 'day') && 
             (event.type === 'study' || event.type === 'focus' || event.type === 'meeting');
    }).length;
  };

  const getConflictWarning = (date: Date, hour: number) => {
    const hasConflict = checkTimeConflict(date, hour, hour + 1);
    if (hasConflict) {
      return "⚠️ Time slot conflict: Another event is already scheduled at this time.";
    }
    return undefined;
  };

  const getDailyLimitWarning = (date: Date, eventType: 'study' | 'focus' | 'meeting' | 'break') => {
    if (eventType === 'break') return undefined; // Breaks don't count toward limit
    
    const mainTopicsCount = getMainTopicsCount(date);
    if (mainTopicsCount >= 4) {
      return "⚠️ Daily limit reached: You can only schedule 4 main topics per day (excluding breaks).";
    }
    return undefined;
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = viewType === 'day' 
      ? dayjs(selectedDate).subtract(1, 'day').toDate()
      : dayjs(selectedDate).subtract(1, 'week').toDate();
    setSelectedDate(newDate);
  };

  const goToNext = () => {
    const newDate = viewType === 'day'
      ? dayjs(selectedDate).add(1, 'day').toDate()
      : dayjs(selectedDate).add(1, 'week').toDate();
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Handle slot click to open creation dialog
  const handleSlotClick = (date: Date, hour: number, resourceId: string) => {
    console.log('🎯 Slot clicked:', { date: dayjs(date).format('YYYY-MM-DD'), hour, resourceId });
    
    const resource = resources.find(r => r.id === resourceId);
    const resourceName = resource?.name || 'Session';
    
    setCreationData({
      date,
      hour,
      resourceId,
      resourceName
    });
    setShowCreationDialog(true);
  };

  // Handle event creation from dialog
  const handleEventCreate = (eventData: Omit<TimeoutEvent, 'id'>) => {
    // Check for conflicts one more time before creating
    const startHour = dayjs(eventData.start).hour();
    const endHour = dayjs(eventData.end).hour();
    const hasConflict = checkTimeConflict(eventData.start, startHour, endHour);
    
    if (hasConflict) {
      console.warn('⚠️ Cannot create event: Time conflict detected');
      return;
    }

    // Check daily limit for main topics
    if (eventData.type !== 'break') {
      const mainTopicsCount = getMainTopicsCount(eventData.start);
      if (mainTopicsCount >= 4) {
        console.warn('⚠️ Cannot create event: Daily limit of 4 main topics reached');
        return;
      }
    }

    addEvent(eventData);
    console.log('✅ Event created:', eventData);
  };

  // Handle delete confirmation
  const handleDeleteClick = (event: TimeoutEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEventForDelete(event);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedEventForDelete) {
      deleteEvent(selectedEventForDelete.id);
      console.log('🗑️ Event deleted:', selectedEventForDelete.id);
    }
  };

  // Get events for a specific time slot
  const getEventsForSlot = (date: Date, hour: number, resourceId: string) => {
    return events.filter(event => {
      const eventStart = dayjs(event.start);
      const eventEnd = dayjs(event.end);
      const slotStart = dayjs(date).hour(hour);
      const slotEnd = dayjs(date).hour(hour + 1);
      
      return event.resourceId === resourceId &&
             eventStart.isSame(date, 'day') &&
             ((eventStart.hour() <= hour && eventEnd.hour() > hour) ||
              (eventStart.hour() === hour));
    });
  };

  const currentDateLabel = viewType === 'day' 
    ? dayjs(selectedDate).format('MMMM D, YYYY')
    : `${dayjs(selectedDate).startOf('week').format('MMM D')} - ${dayjs(selectedDate).endOf('week').format('MMM D, YYYY')}`;

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <Card className="glass border-glass-border/30">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  className="glass border-glass-border/50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  className="glass border-glass-border/50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="glass border-glass-border/50"
                >
                  Today
                </Button>
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {currentDateLabel}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Template Actions */}
              <div className="flex gap-2 mr-4 p-1 bg-glass/30 rounded-lg border border-glass-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateCreator(true)}
                  className="glass border-glass-border/50 h-9 hover:bg-primary/10 hover:border-primary/30"
                  title="Create or edit daily templates"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateApplicator(true)}
                  className="glass border-glass-border/50 h-9 hover:bg-primary/10 hover:border-primary/30"
                  title="Apply saved templates to days"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Apply Template
                </Button>
              </div>
              
              {/* View Type Buttons */}
              <div className="flex gap-1 bg-glass/50 p-1 rounded-md border border-glass-border/30">
                <Button
                  variant={viewType === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('day')}
                  className="h-8 px-3 text-xs"
                >
                  Day
                </Button>
                <Button
                  variant={viewType === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('week')}
                  className="h-8 px-3 text-xs"
                >
                  Week
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Grid */}
      <Card className="glass border-glass-border/30">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Resource Rows */}
              {resources.map((resource) => (
                <div key={resource.id} className="border-b border-glass-border/20 last:border-b-0">
                  {/* Resource Header */}
                  <div className="flex">
                    <div className="w-40 p-4 bg-glass/30 border-r border-glass-border/20 flex items-center">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: resource.color || '#4A90E2' }}
                        />
                        <span className="font-medium text-sm">{resource.name}</span>
                      </div>
                    </div>
                    
                    {/* Time Grid */}
                    <div className="flex-1 flex">
                      {viewType === 'week' ? (
                        // Week View - 7 days
                        weekDays.map((day) => (
                          <div key={day.date.getTime()} className="flex-1 border-r border-glass-border/10 last:border-r-0">
                            {/* Day Header */}
                            <div className={`p-2 text-center text-xs font-medium border-b border-glass-border/10 ${
                              day.isToday ? 'bg-primary/10 text-primary' : 'bg-glass/20'
                            }`}>
                              <div>{day.label}</div>
                              <div className="font-bold">{day.dayNumber}</div>
                            </div>
                            
                            {/* Time Slots for this day */}
                            <div className="grid grid-cols-4 gap-0">
                              {timeSlots.slice(0, 12).map((slot) => { // Show 12 hours in week view
                                const eventsInSlot = getEventsForSlot(day.date, slot.hour, resource.id);
                                return (
                                  <div
                                    key={`${day.date.getTime()}-${slot.hour}`}
                                    className={`h-12 border-r border-b border-glass-border/5 cursor-pointer relative transition-all duration-200 ${
                                      eventsInSlot.length === 0 
                                        ? 'hover:bg-primary/10 hover:border-primary/20' 
                                        : 'bg-glass/10'
                                    }`}
                                    onClick={() => eventsInSlot.length === 0 && handleSlotClick(day.date, slot.hour, resource.id)}
                                    title={eventsInSlot.length === 0 ? `Click to add event at ${slot.label} - ${day.fullLabel}` : `${slot.label} - ${day.fullLabel} (occupied)`}
                                  >
                                    {eventsInSlot.map((event) => (
                                      <div
                                        key={event.id}
                                        className="absolute inset-0 m-1 rounded-md text-xs text-white font-medium cursor-pointer group shadow-sm border border-white/20"
                                        style={{ backgroundColor: event.bgColor || resource.color || '#4A90E2' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditEvent(event);
                                        }}
                                        title={`${event.title} - Click to edit`}
                                      >
                                        <div className="flex flex-col h-full p-1.5 justify-center">
                                          <span className="truncate text-center text-xs font-semibold leading-tight">
                                            {event.title}
                                          </span>
                                          <span className="text-center text-[10px] opacity-90 leading-tight">
                                            {dayjs(event.start).format('HH:mm')}
                                          </span>
                                          <button
                                            onClick={(e) => handleDeleteClick(event, e)}
                                            className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500 rounded transition-all"
                                            title="Delete event"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        // Day View - Single day with all hours
                        <div className="flex-1">
                          <div className="grid grid-cols-7 gap-0">
                            {timeSlots.map((slot) => {
                              const eventsInSlot = getEventsForSlot(selectedDate, slot.hour, resource.id);
                              return (
                                <div key={slot.hour} className="relative">
                                  {/* Time Label */}
                                  {resource.id === resources[0].id && (
                                    <div className="absolute -top-6 left-0 right-0 text-xs text-center text-muted-foreground">
                                      {slot.label}
                                    </div>
                                  )}
                                  
                                  <div
                                    className={`h-16 border-r border-b border-glass-border/10 cursor-pointer relative transition-all duration-200 ${
                                      eventsInSlot.length === 0 
                                        ? 'hover:bg-primary/10 hover:border-primary/20 hover:shadow-sm' 
                                        : 'bg-glass/5'
                                    }`}
                                    onClick={() => eventsInSlot.length === 0 && handleSlotClick(selectedDate, slot.hour, resource.id)}
                                    title={eventsInSlot.length === 0 ? `Click to add event at ${slot.label}` : `${slot.label} (occupied)`}
                                  >
                                    {eventsInSlot.map((event) => (
                                      <div
                                        key={event.id}
                                        className="absolute inset-0 m-1.5 rounded-lg text-xs text-white font-medium cursor-pointer group shadow-md border border-white/20 transition-all hover:shadow-lg hover:scale-105"
                                        style={{ backgroundColor: event.bgColor || resource.color || '#4A90E2' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditEvent(event);
                                        }}
                                        title={`${event.title} - Click to edit`}
                                      >
                                        <div className="flex flex-col h-full p-2 justify-center relative">
                                          <span className="truncate text-center font-semibold leading-tight">
                                            {event.title}
                                          </span>
                                          <span className="text-center text-[10px] opacity-90 mt-1 leading-tight">
                                            {dayjs(event.start).format('HH:mm')} - {dayjs(event.end).format('HH:mm')}
                                          </span>
                                          <button
                                            onClick={(e) => handleDeleteClick(event, e)}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 rounded-full transition-all"
                                            title="Delete event"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass border-glass-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <div>
                <p className="text-sm font-medium">Total Sessions</p>
                <p className="text-xs text-muted-foreground">
                  {events.length} scheduled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-glass-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Study Time</p>
                <p className="text-xs text-muted-foreground">
                  {events.filter(e => e.type === 'study').length} sessions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-glass-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">This Week</p>
                <p className="text-xs text-muted-foreground">
                  {events.filter(e => dayjs(e.start).isSame(selectedDate, 'week')).length} events
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-glass-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Settings className="w-4 h-4 text-primary" />
                {templates.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                    {templates.length}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Templates</p>
                <p className="text-xs text-muted-foreground">
                  {templates.length === 0 ? 'None created yet' : `${templates.length} ready to use`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Creation Dialog */}
      {creationData && (
        <EventCreationDialog
          open={showCreationDialog}
          onClose={() => {
            setShowCreationDialog(false);
            setCreationData(null);
          }}
          onSave={handleEventCreate}
          suggestedDate={creationData.date}
          suggestedHour={creationData.hour}
          resourceId={creationData.resourceId}
          resourceName={creationData.resourceName}
          conflictWarning={getConflictWarning(creationData.date, creationData.hour)}
          dailyLimitWarning={getDailyLimitWarning(creationData.date, 'study')} // Default to study type for warning
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedEventForDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        event={selectedEventForDelete}
      />

      {/* Template Creator Dialog */}
      <DailyTemplateCreator
        open={showTemplateCreator}
        onClose={() => setShowTemplateCreator(false)}
      />

      {/* Template Applicator Dialog */}
      <TemplateApplicator
        open={showTemplateApplicator}
        onClose={() => setShowTemplateApplicator(false)}
        preselectedDate={selectedDate}
      />
    </div>
  );
};