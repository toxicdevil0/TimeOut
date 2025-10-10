import { useState } from "react";
import { ResourceShare } from "./ResourceShare";

// Define TypeScript interfaces
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

// Mock implementations - in a real app, these would connect to Firebase
const mockGetResources = async (classId: string): Promise<Resource[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Different mock data based on classId
  const mockResources: Record<string, Resource[]> = {
    "math-101": [
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
    ],
    "physics-201": [
      {
        id: '3',
        title: 'Practice Problems',
        type: 'link',
        url: 'https://example.com/practice-problems',
        uploadedAt: new Date(Date.now() - 259200000), // 3 days ago
        uploadedBy: 'Dr. Smith'
      },
      {
        id: '4',
        title: 'Lab Report Template',
        type: 'document',
        url: 'https://example.com/lab-template.docx',
        fileName: 'lab-template.docx',
        fileSize: '0.5 MB',
        uploadedAt: new Date(Date.now() - 345600000), // 4 days ago
        uploadedBy: 'Dr. Smith'
      }
    ]
  };

  return mockResources[classId] || [];
};

const mockUploadResource = async (classId: string, resourceData: {
  title: string;
  type: string;
  url: string;
  fileName?: string;
  fileSize?: string;
}) => {
  console.log('Uploading resource to class', classId, ':', resourceData);
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
};

const mockDeleteResource = async (resourceId: string) => {
  console.log('Deleting resource:', resourceId);
  // Simulate delete delay
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const ResourceShareDemo = () => {
  const [selectedClass, setSelectedClass] = useState("math-101");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resource Share Demo</h1>
        <p className="text-muted-foreground">Manage and display study materials for classes</p>
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
      
      <ResourceShare
        classId={selectedClass}
        className={selectedClass === "math-101" ? "Mathematics 101" : "Physics Advanced"}
        getResources={mockGetResources}
        uploadResource={mockUploadResource}
        deleteResource={mockDeleteResource}
      />
      
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">How to use with Firebase:</h3>
        <p className="text-sm text-muted-foreground">
          To connect with Firebase, replace the mock functions with actual implementations:
        </p>
        <pre className="mt-2 p-3 bg-background rounded text-xs overflow-x-auto">
          {`const getResources = async (classId: string) => {
  const snapshot = await firebase.firestore()
    .collection('classes')
    .doc(classId)
    .collection('resources')
    .get();
    
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Resource[];
};

const uploadResource = async (classId: string, resourceData: any) => {
  await firebase.firestore()
    .collection('classes')
    .doc(classId)
    .collection('resources')
    .add({
      ...resourceData,
      uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
      uploadedBy: currentUser.uid
    });
};`}
        </pre>
      </div>
    </div>
  );
};