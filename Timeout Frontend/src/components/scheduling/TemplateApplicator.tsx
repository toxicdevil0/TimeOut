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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, AlertCircle, Zap } from 'lucide-react';
import { DailyTemplate, useSchedule } from './ScheduleProvider';
import dayjs from 'dayjs';

interface TemplateApplicatorProps {
  open: boolean;
  onClose: () => void;
  preselectedDate?: Date;
}

export const TemplateApplicator: React.FC<TemplateApplicatorProps> = ({
  open,
  onClose,
  preselectedDate
}) => {
  const { templates, applyTemplate, applyTemplateToRange, events } = useSchedule();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [applicationMode, setApplicationMode] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().add(6, 'day').format('YYYY-MM-DD'));
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedTemplateId('');
      setApplicationMode('single');
      setReplaceExisting(false);
      
      if (preselectedDate) {
        setSelectedDate(dayjs(preselectedDate).format('YYYY-MM-DD'));
        setStartDate(dayjs(preselectedDate).format('YYYY-MM-DD'));
        setEndDate(dayjs(preselectedDate).add(6, 'day').format('YYYY-MM-DD'));
      } else {
        setSelectedDate(dayjs().format('YYYY-MM-DD'));
        setStartDate(dayjs().format('YYYY-MM-DD'));
        setEndDate(dayjs().add(6, 'day').format('YYYY-MM-DD'));
      }
    }
  }, [open, preselectedDate]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Check for conflicts
  const getConflicts = () => {
    if (!selectedTemplate) return { hasConflicts: false, conflictCount: 0 };

    const targetDates = applicationMode === 'single' 
      ? [new Date(selectedDate)]
      : getDateRange(new Date(startDate), new Date(endDate));

    let conflictCount = 0;
    
    targetDates.forEach(date => {
      const dayEvents = events.filter(event => 
        dayjs(event.start).isSame(dayjs(date), 'day')
      );
      
      selectedTemplate.events.forEach(templateEvent => {
        const templateStart = dayjs(date).hour(parseInt(templateEvent.startTime.split(':')[0])).minute(parseInt(templateEvent.startTime.split(':')[1]));
        const templateEnd = dayjs(date).hour(parseInt(templateEvent.endTime.split(':')[0])).minute(parseInt(templateEvent.endTime.split(':')[1]));
        
        const hasConflict = dayEvents.some(event => {
          const eventStart = dayjs(event.start);
          const eventEnd = dayjs(event.end);
          return templateStart.isBefore(eventEnd) && templateEnd.isAfter(eventStart);
        });
        
        if (hasConflict) conflictCount++;
      });
    });

    return { hasConflicts: conflictCount > 0, conflictCount };
  };

  const getDateRange = (start: Date, end: Date) => {
    const dates = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const handleApply = () => {
    if (!selectedTemplate) return;

    try {
      if (applicationMode === 'single') {
        applyTemplate(selectedTemplateId, new Date(selectedDate), replaceExisting);
      } else {
        applyTemplateToRange(selectedTemplateId, new Date(startDate), new Date(endDate), replaceExisting);
      }
      
      console.log(`✅ Template "${selectedTemplate.name}" applied successfully`);
      onClose();
    } catch (error) {
      console.error('❌ Error applying template:', error);
    }
  };

  const conflicts = getConflicts();
  const canApply = selectedTemplateId && selectedTemplate;

  if (templates.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md glass border-glass-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              No Templates Available
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">You haven't created any daily templates yet.</p>
            <p className="text-xs text-muted-foreground">Create a template first to apply it to your schedule.</p>
          </div>

          <DialogFooter>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg w-full max-w-[90vw] glass border-glass-border/50">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <Zap className="w-5 h-5 text-primary" />
            Apply Daily Template
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-2">
            Choose a template and apply it to your schedule
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Template *</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="glass border-glass-border/50 h-11">
                <SelectValue placeholder="Choose a daily template..." />
              </SelectTrigger>
              <SelectContent className="glass border-glass-border/50">
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template.color || '#4A90E2' }}
                      />
                      <div>
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({template.events.length} events)
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <Card className="glass border-glass-border/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{selectedTemplate.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {selectedTemplate.events.length} events
                  </span>
                </div>
                
                {selectedTemplate.description && (
                  <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                )}

                <div className="space-y-2">
                  {selectedTemplate.events.slice(0, 3).map((event, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: event.bgColor }}
                      />
                      <span className="font-medium">{event.startTime} - {event.endTime}</span>
                      <span>{event.title}</span>
                    </div>
                  ))}
                  {selectedTemplate.events.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{selectedTemplate.events.length - 3} more events...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Application Mode</Label>
            <Select value={applicationMode} onValueChange={(value: 'single' | 'range') => setApplicationMode(value)}>
              <SelectTrigger className="glass border-glass-border/50 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Day</SelectItem>
                <SelectItem value="range">Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          {applicationMode === 'single' ? (
            <div className="space-y-3">
              <Label htmlFor="selectedDate" className="text-sm font-medium">Target Date</Label>
              <Input
                id="selectedDate"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="glass border-glass-border/50 h-11"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="glass border-glass-border/50 h-11"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="glass border-glass-border/50 h-11"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="replaceExisting"
                checked={replaceExisting}
                onCheckedChange={(checked) => setReplaceExisting(checked as boolean)}
              />
              <Label htmlFor="replaceExisting" className="text-sm">
                Replace existing events on target days
              </Label>
            </div>
          </div>

          {/* Conflict Warning */}
          {conflicts.hasConflicts && !replaceExisting && (
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    ⚠️ Scheduling Conflicts Detected
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    {conflicts.conflictCount} template event(s) will conflict with existing events.
                    Enable "Replace existing events" to resolve conflicts automatically.
                  </p>
                </div>
              </div>
            </div>
          )}
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
            onClick={handleApply}
            disabled={!canApply}
            className="min-w-[120px] h-11 px-6"
          >
            Apply Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};