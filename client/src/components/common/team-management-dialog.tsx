import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertTeamMemberSchema, type User, type Team, type TeamMember } from "@shared/schema";
import { TEAM_ROLES } from "@/lib/constants";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

// Form schema for adding a team member
const formSchema = insertTeamMemberSchema.extend({
  userId: z.number().positive({ message: "User is required" }),
  role: z.string().min(1, { message: "Role is required" }),
});

interface TeamManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

interface TeamMemberWithUser extends TeamMember {
  user: User;
}

export function TeamManagementDialog({ 
  open, 
  onOpenChange, 
  team 
}: TeamManagementDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [userToRemove, setUserToRemove] = useState<{ id: number, name: string } | null>(null);

  // Fetch team members
  const { data: teamMembers, isLoading: isLoadingTeamMembers } = useQuery<TeamMemberWithUser[]>({
    queryKey: [`/api/teams/${team?.id}/members`],
    enabled: open && !!team,
  });

  // Fetch all users for user selection
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open && !!team,
  });

  // Filter out users that are already team members
  const availableUsers = users?.filter(user => 
    !teamMembers?.some(member => member.userId === user.id)
  ) || [];

  // Set defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "member",
    },
  });

  // Add team member mutation
  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!team) return null;
      return apiRequest("POST", `/api/teams/${team.id}/members`, data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${team?.id}/members`] });
      toast({
        title: "Team member added",
        description: "Team member has been added successfully.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to add team member",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!team) return null;
      return apiRequest("DELETE", `/api/teams/${team.id}/members/${userId}`);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${team?.id}/members`] });
      toast({
        title: "Team member removed",
        description: "Team member has been removed successfully.",
      });
      setUserToRemove(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to remove team member",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    addTeamMemberMutation.mutate(data);
  }

  // Check if current user is admin of this team
  const isAdmin = teamMembers?.some(
    member => member.userId === currentUser?.id && member.role === "admin"
  );

  if (!team) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Team Management: {team.name}</DialogTitle>
            <DialogDescription>
              Manage team members and their roles.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="members" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Team Members</TabsTrigger>
              {isAdmin && <TabsTrigger value="add">Add Member</TabsTrigger>}
            </TabsList>
            <TabsContent value="members" className="mt-4">
              <div className="max-h-[400px] overflow-y-auto">
                {isLoadingTeamMembers ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        {isAdmin && <TableHead className="w-20">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers && teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarImage src={member.user.avatar || ""} />
                                  <AvatarFallback>{getInitials(member.user.fullName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{member.user.fullName}</div>
                                  <div className="text-sm text-gray-500">{member.user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={member.role === "admin" ? "default" : "outline"}>
                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                              </Badge>
                            </TableCell>
                            {isAdmin && (
                              <TableCell>
                                {/* Prevent removing yourself or if there's only one admin */}
                                {(member.userId !== currentUser?.id || teamMembers.filter(m => m.role === "admin").length > 1) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUserToRemove({ 
                                      id: member.userId, 
                                      name: member.user.fullName 
                                    })}
                                    disabled={removeTeamMemberMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={isAdmin ? 3 : 2} className="text-center">
                            No team members found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
            {isAdmin && (
              <TabsContent value="add" className="mt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            disabled={addTeamMemberMutation.isPending || availableUsers.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a user" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingUsers ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : availableUsers.length === 0 ? (
                                <SelectItem value="0" disabled>
                                  No available users to add
                                </SelectItem>
                              ) : (
                                availableUsers.map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.fullName} ({user.email})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={addTeamMemberMutation.isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TEAM_ROLES.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="submit"
                        disabled={addTeamMemberMutation.isPending || availableUsers.length === 0}
                      >
                        {addTeamMemberMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for removing team member */}
      <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToRemove?.name} from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToRemove && removeTeamMemberMutation.mutate(userToRemove.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeTeamMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}