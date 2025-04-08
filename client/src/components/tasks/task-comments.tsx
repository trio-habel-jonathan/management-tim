import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: number;
  content: string;
  taskId: number;
  userId: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    avatar?: string;
    role: string;
  };
}

interface TaskCommentsProps {
  taskId: number;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  
  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/tasks/${taskId}/comments`],
    enabled: !!taskId,
  });
  
  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        data: {
          content,
          taskId,        // ⬅️ tambahkan ini
          userId: user.id // ⬅️ dan ini
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
      setCommentText("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add comment: ${error}`,
        variant: "destructive"
      });
    }
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest(`/api/comments/${commentId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete comment: ${error}`,
        variant: "destructive"
      });
    }
  });
  
  // Add comment handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      createCommentMutation.mutate(commentText);
    }
  };
  
  // Delete comment handler
  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };
  
  // Check if user can delete a comment (user is comment author or admin)
  const canDeleteComment = (comment: Comment) => {
    return user && (user.id === comment.userId || user.role === "admin");
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment form */}
        <form onSubmit={handleAddComment} className="flex items-end gap-2 mb-4">
          <div className="flex-1">
            <Textarea 
              placeholder="Add a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="resize-none"
              disabled={createCommentMutation.isPending}
            />
          </div>
          <Button 
            type="submit" 
            size="sm"
            disabled={!commentText.trim() || createCommentMutation.isPending}
          >
            {createCommentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-1 sr-only md:not-sr-only">Send</span>
          </Button>
        </form>
        
        {/* Comments list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user.avatar} alt={comment.user.fullName} />
                  <AvatarFallback>
                    {comment.user.fullName?.charAt(0) || comment.user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{comment.user.fullName || comment.user.username}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}