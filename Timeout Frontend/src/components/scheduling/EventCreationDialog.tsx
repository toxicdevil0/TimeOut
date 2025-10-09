import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { TimeoutEvent } from './ScheduleProvider';
import dayjs from 'dayjs';

interface EventCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<TimeoutEvent, 'id'>) => void;
  suggestedDate: Date;
  suggestedHour: number;
  resourceId: string;
  resourceName: string;
  conflictWarning?: string;
  dailyLimitWarning?: string;
}

export const EventCreationDialog: React.FC<EventCreationDialogProps> = ({
  open,
  onClose,
  onSave,
  suggestedDate,
  suggestedHour,
  resourceId,
  resourceName,
  conflictWarning,
  dailyLimitWarning
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<TimeoutEvent['type']>('study');
  const [startTime, setStartTime] = useState(`${suggestedHour.toString().padStart(2, '0')}:00`);
  const [endTime, setEndTime] = useState(`${(suggestedHour + 1).toString().padStart(2, '0')}:00`);
  const [location, setLocation] = useState('');

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setLocation('');
      setStartTime(`${suggestedHour.toString().padStart(2, '0')}:00`);
      setEndTime(`${(suggestedHour + 1).toString().padStart(2, '0')}:00`);
      
      // Set default type based on resource
      const resourceLower = resourceName.toLowerCase();
      if (resourceLower.includes('break')) {
        setEventType('break');
        setTitle('Break Time');
      } else if (resourceLower.includes('group') || resourceLower.includes('meeting')) {
        setEventType('meeting');
        setTitle('Group Session');
      } else if (resourceLower.includes('focus')) {
        setEventType('focus');
        setTitle('Focus Session');
      } else {
        setEventType('study');
        setTitle('Study Session');
      }
    }
  }, [open, suggestedHour, resourceName]);

  const handleSave = () => {
    if (!title.trim()) {
      console.warn('⚠️ Cannot save: Title is required');
      return; // Don't save if title is empty
    }

    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    // Create start and end dates
    const start = dayjs(suggestedDate)
      .hour(startHour)
      .minute(startMin)
      .second(0)
      .toDate();

    const end = dayjs(suggestedDate)
      .hour(endHour)
      .minute(endMin)
      .second(0)
      .toDate();

    // Validate times
    if (end <= start) {
      console.warn('⚠️ Cannot save: End time must be after start time');
      return; // End time must be after start time
    }

    // Determine color based on type
    let bgColor = '#4A90E2'; // Default blue
    switch (eventType) {
      case 'break':
        bgColor = '#10B981'; // Green
        break;
      case 'meeting':
        bgColor = '#8B5CF6'; // Purple
        break;
      case 'focus':
        bgColor = '#F59E0B'; // Orange
        break;
      case 'study':
      default:
        bgColor = '#4A90E2'; // Blue
        break;
    }

    const eventData: Omit<TimeoutEvent, 'id'> = {
      title: title.trim(),
      description: description.trim() || 'No description',
      location: location.trim(),
      start,
      end,
      resourceId,
      type: eventType,
      bgColor
    };

    onSave(eventData);
    onClose();
  };

  const dateLabel = dayjs(suggestedDate).format('dddd, MMMM D, YYYY');
  const hasWarnings = conflictWarning || dailyLimitWarning;
  
  // Time validation
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const timeError = endMinutes <= startMinutes ? 'End time must be after start time' : null;
  const canSave = title.trim() && !timeError;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-full max-w-[90vw] glass border-glass-border/50">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Create New Schedule
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-2 pl-8">
            📅 {dateLabel} • 📍 {resourceName}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warnings */}
          {hasWarnings && (
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  {conflictWarning && <p className="text-yellow-800 dark:text-yellow-200 font-medium">{conflictWarning}</p>}
                  {dailyLimitWarning && <p className="text-yellow-800 dark:text-yellow-200 font-medium">{dailyLimitWarning}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium">Session Name *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter session name..."
              className="glass border-glass-border/50 h-11"
            />
          </div>

          {/* Event Type */}
          <div className="space-y-3">
            <Label htmlFor="type" className="text-sm font-medium">Session Type</Label>
            <Select value={eventType} onValueChange={(value: TimeoutEvent['type']) => setEventType(value)}>
              <SelectTrigger className="glass border-glass-border/50 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-glass-border/50">
                <SelectItem value="study">📚 Study Session</SelectItem>
                <SelectItem value="focus">🎯 Deep Focus</SelectItem>
                <SelectItem value="meeting">👥 Group Meeting</SelectItem>
                <SelectItem value="break">☕ Break Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time Range</Label>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs text-muted-foreground">Start Time</Label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-10 glass border-glass-border/50 h-11"
                    min="08:00"
                    max="22:00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-xs text-muted-foreground">End Time</Label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-10 glass border-glass-border/50 h-11"
                    min="08:00"
                    max="22:00"
                  />
                </div>
              </div>
            </div>
            {timeError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {timeError}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you work on?"
              className="glass border-glass-border/50 h-11"
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label htmlFor="location" className="text-sm font-medium">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where will this take place?"
              className="glass border-glass-border/50 h-11"
            />
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="glass border-glass-border/50 h-11 px-6"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!canSave}
            className="min-w-[120px] h-11 px-6"
          >
            Create Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};