import React from 'react';
import { Edit, Trash2, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TimeoutEvent } from './ScheduleProvider';

interface EventContextMenuProps {
  event: TimeoutEvent;
  position: { x: number; y: number };
  isVisible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const EventContextMenu: React.FC<EventContextMenuProps> = ({
  event,
  position,
  isVisible,
  onEdit,
  onDelete,
  onClose
}) => {
  if (!isVisible) return null;

  const typeColors = {
    study: 'hsl(212, 86%, 64%)',
    break: 'hsl(145, 63%, 42%)',
    meeting: 'hsl(212, 86%, 74%)',
    focus: 'hsl(262, 83%, 58%)'
  };

  const typeLabels = {
    study: 'Study Session',
    break: 'Break Time',
    meeting: 'Group Meeting',
    focus: 'Deep Focus'
  };

  return (
    <>
      {/* Invisible overlay to detect clicks outside */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Context menu */}
      <Card 
        className="fixed z-50 glass border-glass-border/30 shadow-lg min-w-[200px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <CardContent className="p-0">
          {/* Event info header */}
          <div className="p-3 border-b border-glass-border/20">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: typeColors[event.type] }}
              />
              <span className="font-medium text-sm">{event.title}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                {typeLabels[event.type]}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 glass hover:bg-primary/10"
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              <Edit className="h-3 w-3" />
              Edit Session
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 glass hover:bg-destructive/10 text-destructive hover:text-destructive"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <Trash2 className="h-3 w-3" />
              Delete Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};