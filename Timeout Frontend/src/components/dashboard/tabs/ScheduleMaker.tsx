import React from 'react';
import { ScheduleProvider } from '@/components/scheduling/ScheduleProvider';
import { EnhancedScheduler } from '@/components/scheduling/EnhancedScheduler';

export const ScheduleMaker = () => {
  return (
    <ScheduleProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Schedule Maker</h1>
            <p className="text-muted-foreground">
              Enhanced with drag-and-drop scheduling
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p className="text-sm text-muted-foreground">Current time</p>
          </div>
        </div>

        {/* Enhanced Scheduler */}
        <EnhancedScheduler />
      </div>
    </ScheduleProvider>
  );
};