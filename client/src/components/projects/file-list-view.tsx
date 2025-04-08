import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { File } from "@shared/schema";
import type { User as SchemaUser } from "@shared/schema";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileIcon, 
  Upload, 
  Download, 
  Trash2, 
  Eye,
  Search,
  FileText,
  FileImage,
  FileArchive,
  FileAudio,
  FileVideo,
  FilePlus,
  Link2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, formatFileSize as formatBytes, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface FileListViewProps {
  projectId: number;
}

export function FileListView({ projectId }: FileListViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch files for the project
  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: [`/api/projects/${projectId}/files`],
    enabled: !!projectId,
  });
  
  // Fetch users for uploaded by information
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Filter files based on search term
  const filteredFiles = searchTerm 
    ? files.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : files;
  
  // Get user details for uploader
  const getUserInfo = (userId?: number): SchemaUser | undefined => {
    if (!userId || !Array.isArray(users)) return undefined;
    return users.find((user: any) => user.id === userId);
  };
  
  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return apiRequest(`/api/files/${fileId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
      toast({
        title: "Success",
        description: "File deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete file: ${error}`
      });
    }
  });
  
  // Handle file deletion
  const handleDeleteFile = (e: React.MouseEvent, fileId: number) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      deleteFileMutation.mutate(fileId);
    }
  };
  
  // Handle file preview
  const handlePreviewFile = (file: File) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };
  
  // Handle file download
  const handleDownloadFile = (e: React.MouseEvent, file: File) => {
    e.stopPropagation();
    window.open(file.url, '_blank');
  };
  
  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile || !uploadFile[0]) return;
    
    const file = uploadFile[0];
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Maximum file size is ${formatBytes(MAX_FILE_SIZE)}`
      });
      return;
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValidType = Object.values(ACCEPTED_FILE_TYPES).some(
      types => types.includes(`.${fileExtension}`)
    );
    
    if (!isValidType) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a supported file type"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // In a real app, this would upload to a server or cloud storage
      // For this demo, we'll simulate an upload and generate a URL
      const fakeUploadUrl = `https://example.com/files/${Date.now()}-${file.name}`;
      
      // Create file record in the database
      await apiRequest("/api/files", {
        method: "POST",
        data: {
          name: file.name,
          url: fakeUploadUrl,
          size: file.size,
          type: file.type || getFileTypeFromExtension(fileExtension),
          projectId: projectId,
          uploadedBy: user?.id
        }
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/files`] });
      
      toast({
        title: "Success",
        description: "File uploaded successfully"
      });
      
      setIsUploadOpen(false);
      setUploadFile(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to upload file: ${error}`
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get file type from extension
  const getFileTypeFromExtension = (extension: string): string => {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac'];
    const videoExts = ['mp4', 'webm', 'avi', 'mov', 'wmv'];
    
    if (imageExts.includes(extension)) return 'image';
    if (docExts.includes(extension)) return 'document';
    if (archiveExts.includes(extension)) return 'archive';
    if (audioExts.includes(extension)) return 'audio';
    if (videoExts.includes(extension)) return 'video';
    
    return 'application/octet-stream';
  };
  
  // Get file icon based on file type
  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    
    if (type.includes('image')) return <FileImage className="h-5 w-5" />;
    if (type.includes('pdf') || type.includes('doc') || type.includes('text')) return <FileText className="h-5 w-5" />;
    if (type.includes('audio')) return <FileAudio className="h-5 w-5" />;
    if (type.includes('video')) return <FileVideo className="h-5 w-5" />;
    if (type.includes('zip') || type.includes('archive') || type.includes('compressed')) return <FileArchive className="h-5 w-5" />;
    
    return <FileIcon className="h-5 w-5" />;
  };
  
  // File preview component
  const FilePreview = () => {
    if (!selectedFile) return null;
    
    const fileType = selectedFile.type.toLowerCase();
    const isImage = fileType.includes('image');
    
    return (
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon(selectedFile)}
              {selectedFile.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isImage ? (
              <div className="flex justify-center">
                <img 
                  src={selectedFile.url} 
                  alt={selectedFile.name} 
                  className="max-h-[400px] object-contain"
                />
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center">
                {getFileIcon(selectedFile)}
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Preview not available for this file type
                </p>
                <Button 
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.open(selectedFile.url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download to view
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Size</p>
              <p>{formatBytes(selectedFile.size)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Type</p>
              <p>{selectedFile.type}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Uploaded by</p>
              <p>{getUserInfo(selectedFile.uploadedBy)?.fullName || "Unknown"}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Date</p>
              <p>{formatDate(selectedFile.uploadedAt)}</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline"
              onClick={() => window.open(selectedFile.url, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this file?")) {
                  deleteFileMutation.mutate(selectedFile.id);
                  setIsPreviewOpen(false);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Upload dialog component
  const UploadDialog = () => {
    return (
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {uploadFile && uploadFile[0] ? (
                <div className="flex flex-col items-center">
                  <FileIcon className="h-12 w-12 text-blue-500 mb-2" />
                  <p className="font-medium">{uploadFile[0].name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatBytes(uploadFile[0].size)}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFile(null);
                    }}
                  >
                    Choose a different file
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-2" />
                  <p className="font-medium">Click to upload a file</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or drag and drop here
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Max file size: {formatBytes(MAX_FILE_SIZE)}
                  </p>
                </div>
              )}
              
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files)}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsUploadOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                disabled={!uploadFile || isUploading} 
                onClick={handleFileUpload}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            type="search"
            placeholder="Search files..."
            className="pl-9 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2"
        >
          <FilePlus className="h-4 w-4" />
          Upload File
        </Button>
      </div>
      
      {filteredFiles.length === 0 ? (
        <div className="bg-white dark:bg-dark rounded-lg shadow p-10 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No files yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {files.length ? "Try adjusting your search." : "Upload your first file to get started."}
          </p>
          {!files.length && (
            <Button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload File
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => {
                  const uploader = getUserInfo(file.uploadedBy);
                  
                  return (
                    <TableRow 
                      key={file.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handlePreviewFile(file)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {getFileIcon(file)}
                          <span className="ml-2">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {file.type}
                      </TableCell>
                      <TableCell>
                        {formatBytes(file.size)}
                      </TableCell>
                      <TableCell>
                        {uploader ? (
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={uploader.avatar} />
                              <AvatarFallback>
                                {getInitials(uploader.fullName || uploader.username)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{uploader.fullName || uploader.username}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(file.uploadedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => handleDownloadFile(e, file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => handleDeleteFile(e, file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {/* File Preview Dialog */}
      <FilePreview />
      
      {/* Upload Dialog */}
      <UploadDialog />
    </div>
  );
}