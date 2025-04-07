import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { File, Project } from "@shared/schema";
import { formatDate, formatFileSize } from "@/lib/utils";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import {
  Upload,
  FileText,
  Image,
  ArrowDown,
  Trash2,
  File as FileIcon,
  FolderOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function FilesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch files for selected project or all files
  const { data: files, isLoading: isLoadingFiles } = useQuery<File[]>({
    queryKey: [
      selectedProject
        ? `/api/projects/${selectedProject}/files`
        : "/api/files",
    ],
    enabled: true,
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      if (selectedProject) {
        queryClient.invalidateQueries({
          queryKey: [`/api/projects/${selectedProject}/files`],
        });
      }
      toast({
        title: "File deleted",
        description: "File has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      url: string;
      size: number;
      type: string;
      projectId: number;
    }) => {
      return apiRequest("POST", "/api/files", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      if (selectedProject) {
        queryClient.invalidateQueries({
          queryKey: [`/api/projects/${selectedProject}/files`],
        });
      }
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      toast({
        title: "File uploaded",
        description: "File has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to upload file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Maximum file size is ${formatFileSize(MAX_FILE_SIZE)}`,
      });
      return;
    }

    setUploadFile(selectedFile);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadFile || !selectedProject) return;

    // In a real app, you would upload to Supabase storage and get a URL
    // Here, we'll simulate it by creating a file record with a mock URL
    
    // Determine file type category
    const fileExt = `.${uploadFile.name.split(".").pop()?.toLowerCase()}`;
    let fileType = "other";
    
    if (ACCEPTED_FILE_TYPES.IMAGES.includes(fileExt)) {
      fileType = "image";
    } else if (ACCEPTED_FILE_TYPES.DOCUMENTS.includes(fileExt)) {
      fileType = "document";
    } else if (ACCEPTED_FILE_TYPES.ARCHIVES.includes(fileExt)) {
      fileType = "archive";
    }

    // Create a mock URL for demonstration
    const mockUrl = `https://example.com/files/${Date.now()}-${uploadFile.name}`;

    uploadFileMutation.mutate({
      name: uploadFile.name,
      url: mockUrl,
      size: uploadFile.size,
      type: fileType,
      projectId: selectedProject,
    });
  };

  // Handle delete file
  const handleDeleteFile = (fileId: number) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteFileMutation.mutate(fileId);
    }
  };

  // Filter files based on active tab
  const filteredFiles = files?.filter((file) => {
    if (activeTab === "all") return true;
    return file.type === activeTab;
  });

  // Table columns
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className="flex items-center">
            {file.type === "image" ? (
              <Image className="h-5 w-5 mr-2 text-blue-500" />
            ) : file.type === "document" ? (
              <FileText className="h-5 w-5 mr-2 text-green-500" />
            ) : (
              <FileIcon className="h-5 w-5 mr-2 text-gray-500" />
            )}
            <span className="font-medium">{file.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => {
        const size = row.getValue("size") as number;
        return formatFileSize(size);
      },
    },
    {
      accessorKey: "uploadedAt",
      header: "Uploaded",
      cell: ({ row }) => {
        const date = row.getValue("uploadedAt") as string;
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(file.url, "_blank")}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteFile(file.id)}
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
          Files
        </h1>
        <Button
          onClick={() => setIsUploadDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Files Library</CardTitle>
            <Select
              value={selectedProject?.toString() || ""}
              onValueChange={(value) =>
                setSelectedProject(value ? parseInt(value) : null)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Files</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="document">Documents</TabsTrigger>
              <TabsTrigger value="archive">Archives</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {isLoadingFiles ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : filteredFiles && filteredFiles.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={filteredFiles}
                  searchColumn="name"
                  searchPlaceholder="Search files..."
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FolderOpen className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    No files found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">
                    {activeTab === "all"
                      ? "Upload your first file to get started"
                      : `No ${activeTab} files found`}
                  </p>
                  <Button onClick={() => setIsUploadDialogOpen(true)}>
                    Upload File
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* File Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a file to your project library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <Select
                value={selectedProject?.toString() || ""}
                onValueChange={(value) =>
                  setSelectedProject(value ? parseInt(value) : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">File</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md">
                <div className="space-y-2 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload a file</span>
                      <Input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
                  </p>
                </div>
              </div>
            </div>

            {uploadFile && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm font-medium">{uploadFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(uploadFile.size)}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !selectedProject || uploadFileMutation.isPending}
            >
              {uploadFileMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
