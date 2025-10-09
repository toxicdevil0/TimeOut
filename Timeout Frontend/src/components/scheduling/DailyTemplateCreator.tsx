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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock, Plus, Trash2, Copy, Calendar } from 'lucide-react';
import { TemplateEvent, DailyTemplate, useSchedule } from './ScheduleProvider';
import dayjs from 'dayjs';

interface DailyTemplateCreatorProps {
  open: boolean;
  onClose: () => void;
  editTemplate?: DailyTemplate | null;
}

export const DailyTemplateCreator: React.FC<DailyTemplateCreatorProps> = ({
  open,
  onClose,
  editTemplate
}) => {
  const { resources, addTemplate, updateTemplate } = useSchedule();
  
  // Template basic info
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateColor, setTemplateColor] = useState('#4A90E2');
  
  // Template events
  const [templateEvents, setTemplateEvents] = useState<TemplateEvent[]>([]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      if (editTemplate) {
        // Editing existing template
        setTemplateName(editTemplate.name);
        setTemplateDescription(editTemplate.description || '');
        setTemplateColor(editTemplate.color || '#4A90E2');
        setTemplateEvents([...editTemplate.events]);
      } else {
        // Creating new template
        setTemplateName('');
        setTemplateDescription('');
        setTemplateColor('#4A90E2');
        setTemplateEvents([]);
      }
    }
  }, [open, editTemplate]);

  // Add new event to template with smart time increment
  const addTemplateEvent = (duration: number = 60) => {
    // Find the latest end time from existing events
    let suggestedStartTime = '09:00';
    let suggestedEndTime = '10:00';
    
    if (templateEvents.length > 0) {
      // Sort events by start time to find the latest one
      const sortedEvents = [...templateEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const lastEvent = sortedEvents[sortedEvents.length - 1];
      
      // Set start time to last event's end time
      suggestedStartTime = lastEvent.endTime;
      
      // Calculate end time based on duration
      const startMoment = dayjs(`1970-01-01 ${suggestedStartTime}`);
      const endMoment = startMoment.add(duration, 'minute');
      suggestedEndTime = endMoment.format('HH:mm');
      
      // Ensure we don't go past 23:00
      if (endMoment.hour() >= 23) {
        suggestedEndTime = '23:00';
      }
    }

    const newEvent: TemplateEvent = {
      title: `Session ${templateEvents.length + 1}`,
      startTime: suggestedStartTime,
      endTime: suggestedEndTime,
      resourceId: 'study',
      type: 'study',
      bgColor: '#4A90E2',
      description: '',
      location: ''
    };
    setTemplateEvents(prev => [...prev, newEvent]);
  };

  // Remove event from template
  const removeTemplateEvent = (index: number) => {
    setTemplateEvents(prev => prev.filter((_, i) => i !== index));
  };

  // Update template event with smart time adjustments
  const updateTemplateEvent = (index: number, updates: Partial<TemplateEvent>, autoAdjustNext: boolean = false) => {
    setTemplateEvents(prev => {
      const updated = prev.map((event, i) => 
        i === index ? { ...event, ...updates } : event
      );
      
      // If we're updating the end time and autoAdjustNext is true, adjust the next event's start time
      if (autoAdjustNext && updates.endTime && index < updated.length - 1) {
        const nextEventIndex = index + 1;
        updated[nextEventIndex] = {
          ...updated[nextEventIndex],
          startTime: updates.endTime
        };
      }
      
      return updated;
    });
  };

  // Add quick break after event
  const addBreakAfter = (index: number) => {
    const currentEvent = templateEvents[index];
    const breakEvent: TemplateEvent = {
      title: 'Break',
      startTime: currentEvent.endTime,
      endTime: dayjs(`1970-01-01 ${currentEvent.endTime}`).add(15, 'minute').format('HH:mm'),
      resourceId: 'break',
      type: 'break',
      bgColor: '#10B981',
      description: 'Rest and recharge',
      location: ''
    };
    
    // Insert break after current event
    setTemplateEvents(prev => {
      const newEvents = [...prev];
      newEvents.splice(index + 1, 0, breakEvent);
      return newEvents;
    });
  };

  // Duplicate template event with smart positioning
  const duplicateTemplateEvent = (index: number) => {
    const eventToDuplicate = templateEvents[index];
    
    // Find the best position for the duplicate
    let startTime = eventToDuplicate.endTime;
    let endTime = dayjs(`1970-01-01 ${startTime}`).add(1, 'hour').format('HH:mm');
    
    // If there are events after this one, use the smart positioning
    if (index < templateEvents.length - 1) {
      startTime = dayjs(`1970-01-01 ${eventToDuplicate.endTime}`).add(15, 'minute').format('HH:mm');
      endTime = dayjs(`1970-01-01 ${startTime}`).add(1, 'hour').format('HH:mm');
    }
    
    const duplicatedEvent: TemplateEvent = {
      ...eventToDuplicate,
      title: `${eventToDuplicate.title} (Copy)`,
      startTime,
      endTime
    };
    
    setTemplateEvents(prev => [...prev, duplicatedEvent]);
  };

  // Save template
  const handleSave = () => {
    if (!templateName.trim() || templateEvents.length === 0) {
      return;
    }

    // Sort events by start time
    const sortedEvents = [...templateEvents].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );

    const templateData = {
      name: templateName.trim(),
      description: templateDescription.trim(),
      color: templateColor,
      events: sortedEvents
    };

    if (editTemplate) {
      updateTemplate(editTemplate.id, templateData);
    } else {
      addTemplate(templateData);
    }

    onClose();
  };

  // Get resource color and name
  const getResourceInfo = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return {
      name: resource?.name || 'Unknown',
      color: resource?.color || '#4A90E2'
    };
  };

  const canSave = templateName.trim() && templateEvents.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-full max-w-[95vw] max-h-[90vh] overflow-y-auto glass border-glass-border/50">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            {editTemplate ? 'Edit Daily Template' : 'Create Daily Template'}
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-2">
            Design a reusable daily schedule that can be applied to any day. 
            <span className="text-primary font-medium">Smart features:</span> Events auto-increment times, quick duration buttons, and break insertion.
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="templateName" className="text-sm font-medium">Template Name *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Study Day, Work Day, Weekend..."
                className="glass border-glass-border/50 h-11"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="templateColor" className="text-sm font-medium">Template Color</Label>
              <div className="flex gap-2">
                <Input
                  id="templateColor"
                  type="color"
                  value={templateColor}
                  onChange={(e) => setTemplateColor(e.target.value)}
                  className="w-16 h-11 glass border-glass-border/50 cursor-pointer"
                />
                <Input
                  value={templateColor}
                  onChange={(e) => setTemplateColor(e.target.value)}
                  placeholder="#4A90E2"
                  className="flex-1 glass border-glass-border/50 h-11"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="templateDescription" className="text-sm font-medium">Description</Label>
            <Input
              id="templateDescription"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              className="glass border-glass-border/50 h-11"
            />
          </div>

          {/* Template Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Schedule Events ({templateEvents.length})</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => addTemplateEvent(60)}
                  size="sm"
                  className="h-9"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
                <Button
                  onClick={() => addTemplateEvent(30)}
                  size="sm"
                  variant="outline"
                  className="h-9 glass border-glass-border/50"
                  title="Add 30-minute session"
                >
                  30m
                </Button>
                <Button
                  onClick={() => addTemplateEvent(120)}
                  size="sm"
                  variant="outline"
                  className="h-9 glass border-glass-border/50"
                  title="Add 2-hour session"
                >
                  2h
                </Button>
              </div>
            </div>

            {templateEvents.length === 0 ? (
              <Card className="glass border-glass-border/30">
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No events added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Event" to start building your template</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {templateEvents.map((event, index) => {
                  const resourceInfo = getResourceInfo(event.resourceId);
                  return (
                    <Card key={index} className="glass border-glass-border/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: event.bgColor || resourceInfo.color }}
                            />
                            <span className="text-sm font-medium">{event.title}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => addBreakAfter(index)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Add break after this event"
                            >
                              <Clock className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => duplicateTemplateEvent(index)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Duplicate this event"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => removeTemplateEvent(index)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Remove this event"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Title</Label>
                            <Input
                              value={event.title}
                              onChange={(e) => updateTemplateEvent(index, { title: e.target.value })}
                              className="h-9 text-sm glass border-glass-border/50"
                              placeholder="Event title"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Type</Label>
                            <Select 
                              value={event.resourceId} 
                              onValueChange={(value) => {
                                const resource = resources.find(r => r.id === value);
                                let type: TemplateEvent['type'] = 'study';
                                if (value === 'break') type = 'break';
                                else if (value === 'meeting') type = 'meeting';
                                else if (value === 'focus') type = 'focus';
                                
                                updateTemplateEvent(index, { 
                                  resourceId: value,
                                  type,
                                  bgColor: resource?.color || '#4A90E2'
                                });
                              }}
                            >
                              <SelectTrigger className="h-9 glass border-glass-border/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {resources.map(resource => (
                                  <SelectItem key={resource.id} value={resource.id}>
                                    {resource.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Start</Label>
                            <Input
                              type="time"
                              value={event.startTime}
                              onChange={(e) => updateTemplateEvent(index, { startTime: e.target.value })}
                              className="h-9 glass border-glass-border/50"
                              min="06:00"
                              max="23:00"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">End</Label>
                            <Input
                              type="time"
                              value={event.endTime}
                              onChange={(e) => updateTemplateEvent(index, { endTime: e.target.value })}
                              className="h-9 glass border-glass-border/50"
                              min="06:00"
                              max="23:59"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <Input
                              value={event.description || ''}
                              onChange={(e) => updateTemplateEvent(index, { description: e.target.value })}
                              className="h-9 text-sm glass border-glass-border/50"
                              placeholder="What will you work on?"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Location</Label>
                            <Input
                              value={event.location || ''}
                              onChange={(e) => updateTemplateEvent(index, { location: e.target.value })}
                              className="h-9 text-sm glass border-glass-border/50"
                              placeholder="Where will this happen?"
                            />
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {event.startTime} - {event.endTime} • {resourceInfo.name}
                          {event.description && ` • ${event.description}`}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
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
            {editTemplate ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};