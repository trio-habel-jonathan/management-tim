import { 
  User, InsertUser, 
  Team, InsertTeam, 
  TeamMember, InsertTeamMember,
  Project, InsertProject,
  Task, InsertTask,
  Comment, InsertComment,
  File, InsertFile,
  Message, InsertMessage,
  users, teams, teamMembers, projects, tasks, comments, files, messages
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Team operations
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByUser(userId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Team Members operations
  getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember | undefined>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByTeam(teamId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  getTasksByAssignee(assigneeId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  updateTaskStatus(id: number, status: string, order: number): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Comment operations
  getCommentsByTask(taskId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // File operations
  getFilesByProject(projectId: number): Promise<File[]>;
  getFilesByTask(taskId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  
  // Message operations
  getMessagesByTeam(teamId: number): Promise<(Message & { user: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private teamMembers: Map<number, TeamMember>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private comments: Map<number, Comment>;
  private files: Map<number, File>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private teamIdCounter: number;
  private teamMemberIdCounter: number;
  private projectIdCounter: number;
  private taskIdCounter: number;
  private commentIdCounter: number;
  private fileIdCounter: number;
  private messageIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.comments = new Map();
    this.files = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.teamIdCounter = 1;
    this.teamMemberIdCounter = 1;
    this.projectIdCounter = 1;
    this.taskIdCounter = 1;
    this.commentIdCounter = 1;
    this.fileIdCounter = 1;
    this.messageIdCounter = 1;

    // Add some initial data for testing
    const adminUser: User = {
      id: this.userIdCounter++,
      username: "admin",
      password: "admin123",
      email: "admin@teamflow.com",
      fullName: "Admin User",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    };
    this.users.set(adminUser.id, adminUser);
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }
  
  async getTeamsByUser(userId: number): Promise<Team[]> {
    const teamMembersByUser = Array.from(this.teamMembers.values()).filter(
      (tm) => tm.userId === userId,
    );
    
    return teamMembersByUser.map((tm) => this.teams.get(tm.teamId)).filter(Boolean) as Team[];
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const newTeam: Team = { ...team, id };
    this.teams.set(id, newTeam);
    
    // Automatically add creator as team member with 'admin' role
    await this.addTeamMember({
      teamId: id,
      userId: team.createdBy,
      role: "admin",
    });
    
    return newTeam;
  }
  
  async updateTeam(id: number, team: Partial<Team>): Promise<Team | undefined> {
    const existingTeam = this.teams.get(id);
    if (!existingTeam) return undefined;
    
    const updatedTeam = { ...existingTeam, ...team };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }
  
  async deleteTeam(id: number): Promise<boolean> {
    return this.teams.delete(id);
  }
  
  // Team Members methods
  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    const teamMembersList = Array.from(this.teamMembers.values()).filter(
      (tm) => tm.teamId === teamId,
    );
    
    return teamMembersList.map((tm) => {
      const user = this.users.get(tm.userId);
      if (!user) throw new Error(`User not found for team member: ${tm.id}`);
      return { ...tm, user };
    });
  }
  
  async addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const id = this.teamMemberIdCounter++;
    const newTeamMember: TeamMember = { ...teamMember, id };
    this.teamMembers.set(id, newTeamMember);
    return newTeamMember;
  }
  
  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const teamMember = Array.from(this.teamMembers.values()).find(
      (tm) => tm.teamId === teamId && tm.userId === userId,
    );
    
    if (!teamMember) return false;
    return this.teamMembers.delete(teamMember.id);
  }
  
  async updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember | undefined> {
    const teamMember = Array.from(this.teamMembers.values()).find(
      (tm) => tm.teamId === teamId && tm.userId === userId,
    );
    
    if (!teamMember) return undefined;
    
    const updatedTeamMember = { ...teamMember, role };
    this.teamMembers.set(teamMember.id, updatedTeamMember);
    return updatedTeamMember;
  }
  
  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectsByTeam(teamId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.teamId === teamId,
    );
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const newProject: Project = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, project: Partial<Project>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    
    const updatedProject = { ...existingProject, ...project };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.projectId === projectId,
    );
  }
  
  async getTasksByAssignee(assigneeId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.assigneeId === assigneeId,
    );
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const newTask: Task = { ...task, id };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async updateTask(id: number, task: Partial<Task>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async updateTaskStatus(id: number, status: string, order: number): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, status, order };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  // Comment methods
  async getCommentsByTask(taskId: number): Promise<(Comment & { user: User })[]> {
    const taskComments = Array.from(this.comments.values()).filter(
      (comment) => comment.taskId === taskId,
    );
    
    return taskComments.map((comment) => {
      const user = this.users.get(comment.userId);
      if (!user) throw new Error(`User not found for comment: ${comment.id}`);
      return { ...comment, user };
    });
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const newComment: Comment = { ...comment, id, createdAt: new Date() };
    this.comments.set(id, newComment);
    return newComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // File methods
  async getFilesByProject(projectId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.projectId === projectId,
    );
  }
  
  async getFilesByTask(taskId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.taskId === taskId,
    );
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const id = this.fileIdCounter++;
    const newFile: File = { ...file, id, uploadedAt: new Date() };
    this.files.set(id, newFile);
    return newFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }
  
  // Message methods
  async getMessagesByTeam(teamId: number): Promise<(Message & { user: User })[]> {
    const teamMessages = Array.from(this.messages.values()).filter(
      (message) => message.teamId === teamId,
    );
    
    return teamMessages.map((message) => {
      const user = this.users.get(message.userId);
      if (!user) throw new Error(`User not found for message: ${message.id}`);
      return { ...message, user };
    });
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMessage: Message = { ...message, id, createdAt: new Date() };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }
}

export const storage = new MemStorage();
