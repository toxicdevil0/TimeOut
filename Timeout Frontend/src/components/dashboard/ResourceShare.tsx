import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  Link as LinkIcon,
  File,
  Image,
  Video,
  Music,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  Plus,
  Trash2,
  Clock
} from 'lucide-react';

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

interface ResourceShareProps {
  classId: string;
  className?: string;
  // These functions should be provided by parent component
  getResources?: (classId: string) => Promise<Resource[]>;
  uploadResource?: (classId: string, resourceData: {
    title: string;
    type: string;
    url: string;
    fileName?: string;
    fileSize?: string;
  }) => Promise<void>;
  deleteResource?: (resourceId: string) => Promise<void>;
}

// Helper function to get the appropriate icon for a resource type
const getResourceIcon = (type: Resource["type"]) => {
  switch (type) {
    case "link":
      return <LinkIcon className="w-5 h-5 text-blue-500" />;
    case "file":
      return <File className="w-5 h-5 text-blue-500" />;
    case "document":
      return <FileText className="w-5 h-5 text-red-500" />;
    case "image":
      return <Image className="w-5 h-5 text-green-500" />;
    case "video":
      return <Video className="w-5 h-5 text-purple-500" />;
    case "audio":
      return <Music className="w-5 h-5 text-yellow-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
};

// Helper function to format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Helper function to format file size
const formatFileSize = (bytes: string) => {
  return bytes || 'Unknown size';
};

// Mock implementations - replace with actual Firebase calls
const mockGetResources = async (classId: string): Promise<Resource[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

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
    },
    {
      id: '3',
      title: 'Practice Problems',
      type: 'link',
      url: 'https://example.com/practice-problems',
      uploadedAt: new Date(Date.now() - 259200000), // 3 days ago
      uploadedBy: 'Dr. Smith'
    }
  ];
};

const mockUploadResource = async (classId: string, resourceData: any) => {
  console.log('Uploading resource:', resourceData);
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
};

const mockDeleteResource = async (resourceId: string) => {
  console.log('Deleting resource:', resourceId);
  // Simulate delete delay
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const ResourceShare: React.FC<ResourceShareProps> = ({
  classId,
  className = 'Mathematics 101',
  getResources = mockGetResources,
  uploadResource = mockUploadResource,
  deleteResource = mockDeleteResource,
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Load resources on component mount
  useEffect(() => {
    const loadResources = async () => {
      setIsLoading(true);
      try {
        const resourceList = await getResources(classId);
        setResources(resourceList);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResources();
  }, [classId, getResources]);

  // Handle link submission
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!linkTitle.trim() || !linkUrl.trim()) {
      setUploadError('Please fill in both title and URL');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      await uploadResource(classId, {
        title: linkTitle.trim(),
        type: 'link',
        url: linkUrl.trim(),
      });

      // Refresh resources list
      const updatedResources = await getResources(classId);
      setResources(updatedResources);

      // Reset form
      setLinkTitle('');
      setLinkUrl('');
    } catch (error) {
      setUploadError('Failed to upload resource');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !linkTitle.trim()) {
      setUploadError('Please select a file and enter a title');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // In a real implementation, you would upload the file first
      // and get back a URL, then call uploadResource
      const fileUrl = `https://example.com/uploads/${selectedFile.name}`;

      await uploadResource(classId, {
        title: linkTitle.trim(),
        type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
        url: fileUrl,
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      });

      // Refresh resources list
      const updatedResources = await getResources(classId);
      setResources(updatedResources);

      // Reset form
      setLinkTitle('');
      setSelectedFile(null);
    } catch (error) {
      setUploadError('Failed to upload file');
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle resource deletion
  const handleDeleteResource = async (resourceId: string) => {
    try {
      await deleteResource(resourceId);
      setResources(resources.filter(r => r.id !== resourceId));
    } catch (error) {
      console.error('Failed to delete resource:', error);
    }
  };

  // Handle resource click
  const handleResourceClick = (resource: Resource) => {
    if (resource.type === 'link') {
      window.open(resource.url, '_blank');
    } else {
      // For files, you might want to download or open in new tab
      window.open(resource.url, '_blank');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Study Resources - {className}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link Upload Form */}
          <form onSubmit={handleLinkSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="link-title">Resource Title</Label>
                <Input
                  id="link-title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Enter resource title"
                  disabled={isUploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-url">Resource URL</Label>
                <Input
                  id="link-url"
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  disabled={isUploading}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isUploading || !linkTitle.trim() || !linkUrl.trim()}
                  className="w-full"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  {isUploading ? 'Adding...' : 'Add Link'}
                </Button>
              </div>
            </div>
          </form>

          <Separator />

          {/* File Upload Form */}
          <form onSubmit={handleFileUpload} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="file-title">File Title</Label>
                <Input
                  id="file-title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Enter file title"
                  disabled={isUploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isUploading || !selectedFile || !linkTitle.trim()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </div>
          </form>

          {uploadError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {uploadError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resources List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5" />
            Shared Resources ({resources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading resources...</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
              <p>No resources shared yet</p>
              <p className="text-sm mt-2">Share links or files with your students above</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="group flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleResourceClick(resource)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 text-muted-foreground">
                      {getResourceIcon(resource.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {resource.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Uploaded {formatDate(resource.uploadedAt)}</span>
                        </div>
                        {resource.fileSize && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(resource.fileSize)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {resource.type === 'link' ? (
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Download className="w-4 h-4 text-muted-foreground" />
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteResource(resource.id);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};