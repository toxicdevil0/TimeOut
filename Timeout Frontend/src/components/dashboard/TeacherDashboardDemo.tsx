import { TeacherDashboard } from "./TeacherDashboard";
import { MainLayout } from "../layout/MainLayout";
import { useState } from "react";

export const TeacherDashboardDemo = () => {
  const [currentView, setCurrentView] = useState("classes");

  return (
    <MainLayout currentView={currentView} onViewChange={setCurrentView}>
      <TeacherDashboard />
    </MainLayout>
  );
};