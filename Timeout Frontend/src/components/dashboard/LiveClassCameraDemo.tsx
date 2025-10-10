import { useState } from "react";
import { LiveClassPanel } from "./LiveClassPanel";

// Mock hook for live students - in a real app, this would connect to Firebase
const useLiveStudents = (classId: string) => {
  const mockStudents = [
    {
      id: '1',
      name: 'Alice Johnson',
      isActive: true,
      isInFocus: true,
      joinedAt: new Date(Date.now() - 300000), // 5 minutes ago
      hasCameraEnabled: true,
    },
    {
      id: '2',
      name: 'Bob Smith',
      isActive: true,
      isInFocus: false,
      joinedAt: new Date(Date.now() - 600000), // 10 minutes ago
      hasCameraEnabled: false,
    },
    {
      id: '3',
      name: 'Carol Davis',
      isActive: false,
      isInFocus: false,
      joinedAt: new Date(Date.now() - 900000), // 15 minutes ago
      hasCameraEnabled: true,
    },
    {
      id: '4',
      name: 'David Wilson',
      isActive: true,
      isInFocus: true,
      joinedAt: new Date(Date.now() - 180000), // 3 minutes ago
      hasCameraEnabled: true,
    },
  ];

  return {
    students: mockStudents,
    isLoading: false,
    error: null,
  };
};

// Mock functions for live class controls
const startClass = async (classId: string) => {
  console.log(`Starting class ${classId}`);
};

const endClass = async (classId: string) => {
  console.log(`Ending class ${classId}`);
};

const pauseClass = async (classId: string) => {
  console.log(`Pausing class ${classId}`);
};

const resumeClass = async (classId: string) => {
  console.log(`Resuming class ${classId}`);
};

const toggleAudio = async (classId: string) => {
  console.log(`Toggling audio for class ${classId}`);
};

const toggleVideo = async (classId: string) => {
  console.log(`Toggling video for class ${classId}`);
};

const enableStudentCamera = async (classId: string, studentId: string) => {
  console.log(`Enabling camera for student ${studentId} in class ${classId}`);
};

const disableStudentCamera = async (classId: string, studentId: string) => {
  console.log(`Disabling camera for student ${studentId} in class ${classId}`);
};

export const LiveClassCameraDemo = () => {
  const [userType, setUserType] = useState<'teacher' | 'student'>('teacher');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Class Camera Demo</h1>
        <p className="text-muted-foreground">Demonstrating camera integration for both teachers and students</p>
      </div>
      
      <div className="flex gap-4">
        <button 
          className={`px-4 py-2 rounded-lg ${userType === "teacher" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setUserType("teacher")}
        >
          Teacher View
        </button>
        <button 
          className={`px-4 py-2 rounded-lg ${userType === "student" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setUserType("student")}
        >
          Student View
        </button>
      </div>
      
      <LiveClassPanel
        classId="demo-class"
        className="Demo Mathematics Class"
        classSubject="Mathematics"
        userType={userType}
        useLiveStudents={useLiveStudents}
        startClass={startClass}
        endClass={endClass}
        pauseClass={pauseClass}
        resumeClass={resumeClass}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        enableStudentCamera={enableStudentCamera}
        disableStudentCamera={disableStudentCamera}
      />
    </div>
  );
};