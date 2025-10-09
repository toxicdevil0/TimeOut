import React, { useState } from 'react';
import { Scheduler, SchedulerData, ViewType } from 'react-big-schedule';
import 'react-big-schedule/dist/css/style.css';
import dayjs from 'dayjs';

const SimpleSchedulerTest = () => {
  // Create a basic scheduler data instance
  const [schedulerData, setSchedulerData] = useState(() => {
    const scheduler = new SchedulerData(
      dayjs().format('YYYY-MM-DD'),
      ViewType.Week,
      false,
      false,
      {
        schedulerWidth: '100%' as `${number}%`,
        besidesWidth: 200,
        schedulerMaxHeight: 500,
        tableHeaderHeight: 40,
        dayResourceTableWidth: 160,
        weekResourceTableWidth: 160,
        monthResourceTableWidth: 160,
        dayCellWidth: 60,
        monthCellWidth: 100,
        dayStartFrom: 8,
        dayStopTo: 22,
        defaultEventBgColor: '#4A90E2',
        startResizable: true,
        endResizable: true,
        movable: true,
        creatable: true,
        crossResourceMove: true,
        checkConflict: false,
        eventItemHeight: 24,
        eventItemLineHeight: 22,
        dayMaxEvents: 99
      }
    );
    
    // Add basic resources
    scheduler.setResources([
      { id: 'r1', name: 'Study Sessions' },
      { id: 'r2', name: 'Breaks' },
      { id: 'r3', name: 'Meetings' }
    ]);
    
    // Add a simple event
    scheduler.setEvents([
      {
        id: 1,
        title: 'Test Study Session',
        start: dayjs().hour(9).minute(0).format('YYYY-MM-DD HH:mm:ss'),
        end: dayjs().hour(11).minute(0).format('YYYY-MM-DD HH:mm:ss'),
        resourceId: 'r1',
        bgColor: '#4A90E2'
      }
    ]);
    
    return scheduler;
  });

  const prevClick = (schedulerData: SchedulerData) => {
    schedulerData.prev();
    setSchedulerData(schedulerData);
  };

  const nextClick = (schedulerData: SchedulerData) => {
    schedulerData.next();
    setSchedulerData(schedulerData);
  };

  const onSelectDate = (schedulerData: SchedulerData, date: string) => {
    schedulerData.setDate(date);
    setSchedulerData(schedulerData);
  };

  const onViewChange = (schedulerData: SchedulerData, view: any) => {
    schedulerData.setViewType(view.viewType, view.showAgenda, view.isEventPerspective);
    setSchedulerData(schedulerData);
  };

  return (
    <div style={{ height: '600px', padding: '20px' }}>
      <h2>Simple Scheduler Test</h2>
      <Scheduler
        schedulerData={schedulerData}
        prevClick={prevClick}
        nextClick={nextClick}
        onSelectDate={onSelectDate}
        onViewChange={onViewChange}
      />
    </div>
  );
};

export default SimpleSchedulerTest;