import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatar, getInitials } from "@/lib/utils";
import { Loader2, Sun, Moon, Monitor } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Profile form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  avatar: z.string().optional(),
});

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("account");
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      avatar: user?.avatar || "",
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      if (!user) throw new Error("Not logged in");
      return apiRequest("PUT", `/api/users/${user.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      if (!user) throw new Error("Not logged in");
      return apiRequest("PUT", `/api/users/${user.id}/password`, data);
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to change password",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    changePasswordMutation.mutate(data);
  };

  // Generate a new avatar
  const generateNewAvatar = () => {
    const newAvatar = generateAvatar(user?.fullName || "User");
    profileForm.setValue("avatar", newAvatar);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
          Settings
        </h1>
      </div>

      <div className="grid gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex flex-col items-center gap-3">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={profileForm.watch("avatar")} />
                          <AvatarFallback className="text-lg">
                            {getInitials(profileForm.watch("fullName"))}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateNewAvatar}
                        >
                          Generate Avatar
                        </Button>
                      </div>

                      <div className="flex-1 space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Password Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              placeholder="Enter your current password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              placeholder="Enter your new password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              {...field}
                              placeholder="Confirm your new password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how TeamFlow One looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a theme for the dashboard
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-5 w-5" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-5 w-5" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("system")}
                    >
                      <Monitor className="h-5 w-5" />
                      System
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 border-t pt-6">
                  <h3 className="text-lg font-medium">Interface Density</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Adjust the density of the user interface
                  </p>
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Compact Mode</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Reduce spacing in the interface
                        </div>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Large Font</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Increase font size throughout the app
                        </div>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Task Assignments</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        When a task is assigned to you
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Task Comments</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        When someone comments on your task
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Project Updates</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        When a project you're part of is updated
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-medium">In-App Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Task Reminders</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Remind you about upcoming due dates
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Chat Messages</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        When you receive a new message
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Team Activity</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Updates on team activity and file uploads
                      </div>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your plan and billing details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Current Plan</h3>
                      <p className="text-secondary font-semibold">
                        Free Plan
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Limited features and collaborators
                      </p>
                    </div>
                    <Button variant="outline">Upgrade</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Available Plans</h3>
                  
                  <div className="grid gap-4 mt-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-md font-semibold">Pro Plan</h4>
                          <p className="text-primary font-bold">$10 / month</p>
                        </div>
                        <Button>Upgrade</Button>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Unlimited projects and tasks
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Up to 10 team members
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Advanced reporting
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-md font-semibold">Enterprise Plan</h4>
                          <p className="text-primary font-bold">$29 / month</p>
                        </div>
                        <Button>Contact Sales</Button>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          All Pro features
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Unlimited team members
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 text-secondary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Priority support
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
