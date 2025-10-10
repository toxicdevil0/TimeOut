import { useState } from "react";
import { LiveClassPanel } from "./LiveClassPanel";

// Define TypeScript interfaces
interface Student {
  id: string;
  name: string;
  isActive: boolean;
  isInFocus: boolean;
  joinedAt: Date;
}

// Mock hook implementation - in a real app, this would connect to Firebase
const useLiveStudents = (classId: string) => {
  // Different mock data based on classId
  const mockStudents: Record<string, Student[]> = {
    "math-101": [
      {
        id: '1',
        name: 'Alice Johnson',
        isActive: true,
        isInFocus: true,
        joinedAt: new Date(Date.now() - 300000), // 5 minutes ago
      },
      {
        id: '2',
        name: 'Bob Smith',
        isActive: true,
        isInFocus: false,
        joinedAt: new Date(Date.now() - 600000), // 10 minutes ago
      },
      {
        id: '3',
        name: 'Carol Davis',
        isActive: false,
        isInFocus: false,
        joinedAt: new Date(Date.now() - 900000), // 15 minutes ago
      },
    ],
    "physics-201": [
      {
        id: '4',
        name: 'David Wilson',
        isActive: true,
        isInFocus: true,
        joinedAt: new Date(Date.now() - 180000), // 3 minutes ago
      },
      {
        id: '5',
        name: 'Eva Brown',
        isActive: true,
        isInFocus: true,
        joinedAt: new Date(Date.now() - 240000), // 4 minutes ago
      },
      {
        id: '6',
        name: 'Frank Miller',
        isActive: true,
        isInFocus: false,
        joinedAt: new Date(Date.now() - 420000), // 7 minutes ago
      },
      {
        id: '7',
        name: 'Grace Lee',
        isActive: false,
        isInFocus: false,
        joinedAt: new Date(Date.now() - 600000), // 10 minutes ago
      },
    ]
  };

  return {
    students: mockStudents[classId] || [],
    isLoading: false,
    error: null,
  };
};

// Mock functions - in a real app, these would connect to Firebase
const startClass = async (classId: string) => {
  console.log(`Starting class ${classId}`);
  // In real implementation, this would call a Firebase function
};

const endClass = async (classId: string) => {
  console.log(`Ending class ${classId}`);
  // In real implementation, this would call a Firebase function
};

const pauseClass = async (classId: string) => {
  console.log(`Pausing class ${classId}`);
  // In real implementation, this would call a Firebase function
};

const resumeClass = async (classId: string) => {
  console.log(`Resuming class ${classId}`);
  // In real implementation, this would call a Firebase function
};

const toggleAudio = async (classId: string) => {
  console.log(`Toggling audio for class ${classId}`);
  // In real implementation, this would call a Firebase function
};

const toggleVideo = async (classId: string) => {
  console.log(`Toggling video for class ${classId}`);
  // In real implementation, this would call a Firebase function
};

// Example of additional custom functions you might want to add
const customFunction1 = async (classId: string) => {
  console.log(`Custom function 1 for class ${classId}`);
};

const customFunction2 = async (classId: string) => {
  console.log(`Custom function 2 for class ${classId}`);
};

export const LiveClassPanelDemo = () => {
  const [selectedClass, setSelectedClass] = useState("math-101");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Class Panel Demo</h1>
        <p className="text-muted-foreground">Real-time view of students in session with all controls</p>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <button 
          className={`px-4 py-2 rounded-lg ${selectedClass === "math-101" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setSelectedClass("math-101")}
        >
          Mathematics 101
        </button>
        <button 
          className={`px-4 py-2 rounded-lg ${selectedClass === "physics-201" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          onClick={() => setSelectedClass("physics-201")}
        >
          Physics Advanced
        </button>
      </div>
      
      <LiveClassPanel
        classId={selectedClass}
        className={selectedClass === "math-101" ? "Mathematics 101" : "Physics Advanced"}
        classSubject={selectedClass === "math-101" ? "Mathematics" : "Physics"}
        useLiveStudents={useLiveStudents}
        startClass={startClass}
        endClass={endClass}
        pauseClass={pauseClass}
        resumeClass={resumeClass}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        // Example of additional custom functions
        customFunction1={customFunction1}
        customFunction2={customFunction2}
      />
      
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">How to use additional functions:</h3>
        <p className="text-sm text-muted-foreground">
          All additional functions passed as props to LiveClassPanel are accessible through the component.
          You can add custom buttons or controls in your parent component that call these functions directly.
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button 
            onClick={() => customFunction1(selectedClass)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Custom Function 1
          </button>
          <button 
            onClick={() => customFunction2(selectedClass)}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
          >
            Custom Function 2
          </button>
        </div>
      </div>
    </div>
  );
};