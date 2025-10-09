import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from 'lucide-react';
import { TimeoutEvent } from './ScheduleProvider';
import dayjs from 'dayjs';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  event: TimeoutEvent | null;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  event
}) => {
  if (!event) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const eventDate = dayjs(event.start).format('dddd, MMMM D');
  const eventTime = `${dayjs(event.start).format('h:mm A')} - ${dayjs(event.end).format('h:mm A')}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass border-glass-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Schedule
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this scheduled session? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 rounded-md bg-muted/50 border border-muted-foreground/20">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{event.title}</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📅 {eventDate}</p>
                <p>⏰ {eventTime}</p>
                {event.description && event.description !== 'No description' && (
                  <p>📝 {event.description}</p>
                )}
                {event.location && (
                  <p>📍 {event.location}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="glass border-glass-border/50">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            className="min-w-[80px]"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};