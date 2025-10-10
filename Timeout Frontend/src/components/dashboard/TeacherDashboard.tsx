import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Video, BarChart3, Group, TrendingUp } from "lucide-react";
import { LiveClassPanel } from "./LiveClassPanel";
import { ClassAnalyticsCard } from "./ClassAnalyticsCard";
import { ResourceShare } from "./ResourceShare";

// Define the Class type based on what we found in the codebase
interface Class {
  id: string;
  name: string;
  subject: string;
  status: "active" | "ended";
}

// Define the Student interface to match LiveClassPanel
interface Student {
  id: string;
  name: string;
  isActive: boolean;
  isInFocus: boolean;
  joinedAt: Date;
  hasCameraEnabled?: boolean;
  hasMicrophoneEnabled?: boolean;
  lastCheckIn?: Date;
  audioIntensity?: number;
}

// Define the Resource type for ResourceShare component
interface Resource {
  id: string;
  title: string;
  type: 'link' | 'file' | 'document' | 'image' | 'video' | 'audio';
  url: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Mock data for demonstration - in a real app, this would come from Firebase
const mockClasses: Class[] = [
  { id: "1", name: "Mathematics 101", subject: "Math", status: "active" },
  { id: "2", name: "Physics Advanced", subject: "Science", status: "active" },
  { id: "3", name: "History of Art", subject: "Arts", status: "ended" },
];

// Mock function - in a real app, this would connect to Firebase
const getClasses = (): Class[] => {
  return mockClasses;
};

// Mock function - in a real app, this would connect to Firebase
const addClass = (newClass: Omit<Class, "id">): void => {
  console.log("Adding class:", newClass);
  // In a real implementation, this would call a Firebase function
};

// Mock hook for live students - in a real app, this would connect to Firebase
const useLiveStudents = (classId: string) => {
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      isActive: true,
      isInFocus: true,
      joinedAt: new Date(Date.now() - 300000), // 5 minutes ago
      hasCameraEnabled: true,
      hasMicrophoneEnabled: true,
      audioIntensity: 65, // Mock audio intensity
    },
    {
      id: '2',
      name: 'Bob Smith',
      isActive: true,
      isInFocus: false,
      joinedAt: new Date(Date.now() - 600000), // 10 minutes ago
      hasCameraEnabled: false,
      hasMicrophoneEnabled: false,
    },
    {
      id: '3',
      name: 'Carol Davis',
      isActive: false,
      isInFocus: false,
      joinedAt: new Date(Date.now() - 900000), // 15 minutes ago
      hasCameraEnabled: true,
      hasMicrophoneEnabled: true,
      audioIntensity: 25, // Mock audio intensity
    },
    {
      id: '4',
      name: 'David Wilson',
      isActive: true,
      isInFocus: true,
      joinedAt: new Date(Date.now() - 180000), // 3 minutes ago
      hasCameraEnabled: true,
      hasMicrophoneEnabled: true,
      audioIntensity: 45, // Mock audio intensity
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

const enableStudentMicrophone = async (classId: string, studentId: string) => {
  console.log(`Enabling microphone for student ${studentId} in class ${classId}`);
};

const disableStudentMicrophone = async (classId: string, studentId: string) => {
  console.log(`Disabling microphone for student ${studentId} in class ${classId}`);
};

// Mock functions for analytics
const getAnalytics = async (classId: string) => {
  return {
    attendanceRate: 85,
    avgFocusMinutes: 42,
    totalStudents: 30,
    activeStudents: 25,
  };
};

// Mock functions for resources
const getResources = async (classId: string): Promise<Resource[]> => {
  return [
    {
      id: '1',
      title: 'Chapter 5 Slides',
      type: 'document',
      url: 'https://example.com/slides.pdf',
      fileName: 'chapter5-slides.pdf',
      fileSize: '2.5 MB',
      uploadedAt: new Date(Date.now() - 86400000), // 1 day ago
      uploadedBy: 'Dr. Smith'
    },
    {
      id: '2',
      title: 'Video Lecture: Algebra Basics',
      type: 'video',
      url: 'https://example.com/video.mp4',
      uploadedAt: new Date(Date.now() - 172800000), // 2 days ago
      uploadedBy: 'Dr. Smith'
    }
  ];
};

const uploadResource = async (classId: string, resourceData: any) => {
  console.log('Uploading resource:', resourceData);
};

const deleteResource = async (resourceId: string) => {
  console.log('Deleting resource:', resourceId);
};

export const TeacherDashboard = () => {
  const [classes, setClasses] = useState<Class[]>(getClasses());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  const handleCreateClass = () => {
    if (newClassName.trim() && newClassSubject.trim()) {
      const newClass: Class = {
        id: Date.now().toString(),
        name: newClassName,
        subject: newClassSubject,
        status: "active"
      };
      
      addClass(newClass);
      setClasses([...classes, newClass]);
      setNewClassName("");
      setNewClassSubject("");
      setIsDialogOpen(false);
    }
  };

  const handleSelectClass = (classItem: Class) => {
    setSelectedClass(classItem);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
          <p className="text-muted-foreground">Manage your classes and track student engagement</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to your dashboard. You can edit class details later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Class Name
                </Label>
                <Input
                  id="name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Advanced Mathematics"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Math"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateClass}>
                Create Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No classes yet</h3>
          <p className="text-muted-foreground mt-2">
            Create your first class to get started
          </p>
          <Button 
            className="mt-4" 
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Live Class
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Group className="w-4 h-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="classes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {classes.map((classItem) => (
                <Card 
                  key={classItem.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelectClass(classItem)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classItem.name}</CardTitle>
                      <Badge variant={classItem.status === "active" ? "default" : "secondary"}>
                        {classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{classItem.subject}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectClass(classItem);
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="live">
            <div className="mt-4">
              {selectedClass ? (
                <LiveClassPanel
                  classId={selectedClass.id}
                  className={selectedClass.name}
                  classSubject={selectedClass.subject}
                  userType="teacher"
                  useLiveStudents={useLiveStudents}
                  startClass={startClass}
                  endClass={endClass}
                  pauseClass={pauseClass}
                  resumeClass={resumeClass}
                  toggleAudio={toggleAudio}
                  toggleVideo={toggleVideo}
                  enableStudentCamera={enableStudentCamera}
                  disableStudentCamera={disableStudentCamera}
                  enableStudentMicrophone={enableStudentMicrophone}
                  disableStudentMicrophone={disableStudentMicrophone}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Class Selected</h3>
                  <p className="text-muted-foreground mt-2">
                    Select a class from the Classes tab to start a live session
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="mt-4">
              {selectedClass ? (
                <ClassAnalyticsCard
                  classId={selectedClass.id}
                  className={selectedClass.name}
                  getAnalytics={getAnalytics}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Class Selected</h3>
                  <p className="text-muted-foreground mt-2">
                    Select a class from the Classes tab to view analytics
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="resources">
            <div className="mt-4">
              {selectedClass ? (
                <ResourceShare
                  classId={selectedClass.id}
                  className={selectedClass.name}
                  getResources={getResources}
                  uploadResource={uploadResource}
                  deleteResource={deleteResource}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <Group className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Class Selected</h3>
                  <p className="text-muted-foreground mt-2">
                    Select a class from the Classes tab to manage resources
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="progress">
            <div className="mt-4">
              {selectedClass ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Student Progress Tracking</h3>
                  <p className="text-muted-foreground mt-2">
                    Track individual student progress and performance metrics
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Average Grade</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">85%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Attendance Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">92%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Participation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">78%</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Class Selected</h3>
                  <p className="text-muted-foreground mt-2">
                    Select a class from the Classes tab to view student progress
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};