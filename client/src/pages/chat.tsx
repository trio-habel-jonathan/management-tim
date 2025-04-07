import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { MainLayout } from "@/components/layout/main-layout";
import { Team, Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch teams
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: !!user,
  });

  // Set the first team as selected if none selected yet
  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  // Fetch messages for selected team
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: [selectedTeamId ? `/api/teams/${selectedTeamId}/messages` : ""],
    enabled: !!selectedTeamId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedTeamId) throw new Error("No team selected");
      return apiRequest("POST", `/api/teams/${selectedTeamId}/messages`, { content });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${selectedTeamId}/messages`] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  // Handle enter key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
          Team Chat
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-240px)]">
        {/* Team Sidebar */}
        <Card className="md:col-span-1 overflow-hidden">
          <CardContent className="p-0 h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold">Teams</h2>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              {isLoadingTeams ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : teams && teams.length > 0 ? (
                <div className="py-2">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      className={`w-full flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        selectedTeamId === team.id ? "bg-gray-100 dark:bg-gray-800" : ""
                      }`}
                      onClick={() => setSelectedTeamId(team.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {getInitials(team.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="font-medium">{team.name}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <p>No teams found</p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Handle creating a new team
                    }}
                  >
                    Create Team
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-3 overflow-hidden flex flex-col">
          <CardContent className="p-0 flex flex-col h-full">
            {!selectedTeamId ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Select a team to start chatting</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose a team from the sidebar
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {teams?.find(t => t.id === selectedTeamId)?.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-lg font-semibold">
                      {teams?.find(t => t.id === selectedTeamId)?.name}
                    </h2>
                  </div>
                </div>

                {/* Messages area */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}
                        >
                          <div className="flex items-start max-w-[80%] space-x-2">
                            {i % 2 !== 0 && (
                              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                            )}
                            <div>
                              <Skeleton className="h-4 w-20 mb-1" />
                              <Skeleton className="h-16 w-[200px] rounded-md" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwnMessage = msg.user.id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwnMessage ? "justify-end" : ""}`}
                          >
                            <div className="flex items-start max-w-[80%] space-x-2">
                              {!isOwnMessage && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={msg.user.avatar} />
                                  <AvatarFallback>
                                    {getInitials(msg.user.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <div className="flex items-center">
                                  {!isOwnMessage && (
                                    <span className="text-sm font-medium mr-2">
                                      {msg.user.fullName}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(msg.createdAt)}
                                  </span>
                                </div>
                                <div
                                  className={`mt-1 p-3 rounded-lg ${
                                    isOwnMessage
                                      ? "bg-primary text-white"
                                      : "bg-gray-100 dark:bg-gray-800"
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <svg
                        className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Start the conversation with your team.
                      </p>
                    </div>
                  )}
                </ScrollArea>

                {/* Message input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex space-x-2">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="min-h-[60px] resize-none"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      className="flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
