import { useState } from "react";
import { LiveClassPanel } from "./LiveClassPanel";

// Define the student type
interface Student {
  id: string;
  name: string;
  isFocused: boolean;
  hasJoined: boolean;
}

// Define the class type
interface LiveClass {
  id: string;
  name: string;
  subject: string;
  status: "live" | "ended";
}

// Mock data for demonstration
const mockStudents: Student[] = [
  { id: "1", name: "Alice Johnson", isFocused: true, hasJoined: true },
  { id: "2", name: "Bob Smith", isFocused: false, hasJoined: true },
  { id: "3", name: "Charlie Brown", isFocused: true, hasJoined: true },
  { id: "4", name: "Diana Prince", isFocused: true, hasJoined: true },
  { id: "5", name: "Edward Norton", isFocused: false, hasJoined: true },
  { id: "6", name: "Fiona Gallagher", isFocused: true, hasJoined: true },
];

const mockClass: LiveClass = {
  id: "class-1",
  name: "Advanced Physics",
  subject: "Physics",
  status: "live"
};

// Mock functions - in a real app, these would connect to Firebase
const startClass = (classId: string) => {
  console.log(`Starting class ${classId}`);
  // In a real implementation, this would call a Firebase function
};

const endClass = (classId: string) => {
  console.log(`Ending class ${classId}`);
  // In a real implementation, this would call a Firebase function
};

export const LiveClassDemo = () => {
  const [classData, setClassData] = useState<LiveClass>(mockClass);
  const [students] = useState<Student[]>(mockStudents);

  const handleStartClass = (classId: string) => {
    startClass(classId);
    setClassData({ ...classData, status: "live" });
  };

  const handleEndClass = (classId: string) => {
    endClass(classId);
    setClassData({ ...classData, status: "ended" });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Live Class Demo</h1>
      <LiveClassPanel
        classData={classData}
        students={students}
        onStartClass={handleStartClass}
        onEndClass={handleEndClass}
      />
    </div>
  );
};