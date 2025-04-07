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
import { db } from "./db";
import { eq, and, desc, sql, asc, inArray } from "drizzle-orm";


export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
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
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByTask(taskId: number): Promise<(Comment & { user: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByProject(projectId: number): Promise<File[]>;
  getFilesByTask(taskId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
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
      userType: "organization",
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
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
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
  
  async deleteUser(id: number): Promise<boolean> {
    // Delete user from teams first
    const teamMembers = Array.from(this.teamMembers.values())
      .filter(tm => tm.userId === id);
    
    // Remove user from all teams
    for (const tm of teamMembers) {
      this.teamMembers.delete(tm.id);
    }
    
    // Delete the user
    return this.users.delete(id);
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
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

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
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

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
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // First remove user from all team memberships
    await db
      .delete(teamMembers)
      .where(eq(teamMembers.userId, id));
      
    // Then delete the user
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
      
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }
  
  async getTeamsByUser(userId: number): Promise<Team[]> {
    const teamMemberRecords = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));

    if (teamMemberRecords.length === 0) {
      return [];
    }

    const teamIds = teamMemberRecords.map(tm => tm.teamId);

    const teamsList = await db
      .select()
      .from(teams)
      .where(inArray(teams.id, teamIds)); // ✅ FIX

    return teamsList;
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    // Start a transaction to create both the team and add the creator as a member
    const [newTeam] = await db.insert(teams).values(team).returning();
    
    // Automatically add creator as team member with 'admin' role
    await this.addTeamMember({
      teamId: newTeam.id,
      userId: team.createdBy,
      role: "admin",
    });
    
    return newTeam;
  }
  
  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const [updatedTeam] = await db
      .update(teams)
      .set(teamData)
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }
  
  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Team Members methods
  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    // Get team members with their associated users
    const teamMemberRecords = await db
      .select({
        teamMember: teamMembers,
        user: users
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
    
    // Format the result to match the expected type
    return teamMemberRecords.map(record => ({
      ...record.teamMember,
      user: record.user
    }));
  }
  
  async addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const [newTeamMember] = await db.insert(teamMembers).values(teamMember).returning();
    return newTeamMember;
  }
  
  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async updateTeamMemberRole(teamId: number, userId: number, role: string): Promise<TeamMember | undefined> {
    const [updatedTeamMember] = await db
      .update(teamMembers)
      .set({ role })
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      )
      .returning();
    return updatedTeamMember;
  }
  
  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async getProjectsByTeam(teamId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.teamId, teamId));
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async getTasksByProject(projectId: number): Promise<Task[]> {
    return db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.order));
  }
  
  async getTasksByAssignee(assigneeId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.assigneeId, assigneeId));
  }
  
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }
  
  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
  
  async updateTaskStatus(id: number, status: string, order: number): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ status, order })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async getCommentsByTask(taskId: number): Promise<(Comment & { user: User })[]> {
    const commentRecords = await db
      .select({
        comment: comments,
        user: users
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.taskId, taskId))
      .orderBy(desc(comments.createdAt));
    
    return commentRecords.map(record => ({
      ...record.comment,
      user: record.user
    }));
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // File methods
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(desc(files.uploadedAt));
  }
  
  async getFilesByTask(taskId: number): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(eq(files.taskId, taskId))
      .orderBy(desc(files.uploadedAt));
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }
  
  async deleteFile(id: number): Promise<boolean> {
    const result = await db.delete(files).where(eq(files.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByTeam(teamId: number): Promise<(Message & { user: User })[]> {
    const messageRecords = await db
      .select({
        message: messages,
        user: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.teamId, teamId))
      .orderBy(desc(messages.createdAt));
    
    return messageRecords.map(record => ({
      ...record.message,
      user: record.user
    }));
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
