import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit, Clock, Calendar } from 'lucide-react';
import { TimeoutEvent } from './ScheduleProvider';

interface EventManagementProps {
  event: TimeoutEvent | null;
  isOpen: boolean;
  mode: 'edit' | 'delete' | null;
  onClose: () => void;
  onSave: (event: TimeoutEvent) => void;
  onDelete: (eventId: string) => void;
}

export const EventManagement: React.FC<EventManagementProps> = ({
  event,
  isOpen,
  mode,
  onClose,
  onSave,
  onDelete
}) => {
  const [editForm, setEditForm] = useState<Partial<TimeoutEvent>>({});

  React.useEffect(() => {
    if (event && mode === 'edit') {
      setEditForm({
        title: event.title,
        type: event.type,
        description: event.description || '',
        location: event.location || ''
      });
    }
  }, [event, mode]);

  const handleSave = () => {
    if (event && editForm.title) {
      onSave({
        ...event,
        title: editForm.title,
        type: editForm.type || event.type,
        description: editForm.description,
        location: editForm.location
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (event) {
      onDelete(event.id);
      onClose();
    }
  };

  if (!event) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-glass-border/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <Edit className="h-4 w-4 text-primary" />
                Edit Session
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 text-destructive" />
                Delete Session
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Modify your session details below'
              : 'Are you sure you want to delete this session? This action cannot be undone.'
            }
          </DialogDescription>
        </DialogHeader>

        {mode === 'delete' ? (
          // Delete confirmation
          <div className="py-4">
            <Card className="glass border-glass-border/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: typeColors[event.type] }}
                  />
                  <div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {typeLabels[event.type]} • {new Date(event.start).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Edit form
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter session title"
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Session Type</Label>
              <Select 
                value={editForm.type} 
                onValueChange={(value) => setEditForm({ ...editForm, type: value as TimeoutEvent['type'] })}
              >
                <SelectTrigger className="glass">
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent className="glass">
                  <SelectItem value="study">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.study }} />
                      Study Session
                    </div>
                  </SelectItem>
                  <SelectItem value="break">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.break }} />
                      Break Time
                    </div>
                  </SelectItem>
                  <SelectItem value="meeting">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.meeting }} />
                      Group Meeting
                    </div>
                  </SelectItem>
                  <SelectItem value="focus">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColors.focus }} />
                      Deep Focus
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Add session description"
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={editForm.location || ''}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Add location"
                className="glass"
              />
            </div>

            {/* Session Info */}
            <Card className="glass border-glass-border/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.start).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="glass">
            Cancel
          </Button>
          {mode === 'edit' ? (
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          ) : (
            <Button onClick={handleDelete} variant="destructive">
              Delete Session
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};