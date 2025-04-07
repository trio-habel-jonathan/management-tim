import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertTeamSchema, 
  insertTeamMemberSchema, 
  insertProjectSchema, 
  insertTaskSchema,
  insertCommentSchema,
  insertFileSchema,
  insertMessageSchema
} from "@shared/schema";
import { z } from "zod";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

// Helper function to validate request body using zod schema
const validateBody = <T>(schema: z.ZodType<T>) => {
  return (req: Request, res: Response, next: () => void) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "teamflow-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({ checkPeriod: 86400000 }),
    })
  );
  
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: () => void) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
  
  // Authentication routes
  app.post("/api/auth/register", validateBody(insertUserSchema), async (req, res) => {
    try {
      const { username, email } = req.body;
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser(req.body);
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      // Set session
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Don't return password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  
  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = Array.from(storage["users"].values()).map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  // Team routes
  app.get("/api/teams", requireAuth, async (req, res) => {
    try {
      const teams = await storage.getTeamsByUser(req.session.userId!);
      res.status(200).json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to get teams" });
    }
  });
  
  app.post("/api/teams", requireAuth, validateBody(insertTeamSchema), async (req, res) => {
    try {
      const team = await storage.createTeam({
        ...req.body,
        createdBy: req.session.userId!,
      });
      
      res.status(201).json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to create team" });
    }
  });
  
  app.get("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const team = await storage.getTeam(parseInt(req.params.id));
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.status(200).json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to get team" });
    }
  });
  
  app.put("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const team = await storage.getTeam(parseInt(req.params.id));
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is admin of the team
      const teamMembers = await storage.getTeamMembers(team.id);
      const currentUserMembership = teamMembers.find(member => member.userId === req.session.userId!);
      
      if (!currentUserMembership || currentUserMembership.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to update team" });
      }
      
      const updatedTeam = await storage.updateTeam(team.id, req.body);
      res.status(200).json(updatedTeam);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team" });
    }
  });
  
  app.delete("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const team = await storage.getTeam(parseInt(req.params.id));
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is admin of the team
      const teamMembers = await storage.getTeamMembers(team.id);
      const currentUserMembership = teamMembers.find(member => member.userId === req.session.userId!);
      
      if (!currentUserMembership || currentUserMembership.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete team" });
      }
      
      await storage.deleteTeam(team.id);
      res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });
  
  // Team Members routes
  app.get("/api/teams/:id/members", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is member of the team
      const teamMembers = await storage.getTeamMembers(teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view team members" });
      }
      
      res.status(200).json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get team members" });
    }
  });
  
  app.post("/api/teams/:id/members", requireAuth, validateBody(insertTeamMemberSchema), async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is admin of the team
      const teamMembers = await storage.getTeamMembers(teamId);
      const currentUserMembership = teamMembers.find(member => member.userId === req.session.userId!);
      
      if (!currentUserMembership || currentUserMembership.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to add team members" });
      }
      
      const newTeamMember = await storage.addTeamMember({
        ...req.body,
        teamId,
      });
      
      res.status(201).json(newTeamMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to add team member" });
    }
  });
  
  app.delete("/api/teams/:teamId/members/:userId", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.params.userId);
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is admin of the team or removing themselves
      const teamMembers = await storage.getTeamMembers(teamId);
      const currentUserMembership = teamMembers.find(member => member.userId === req.session.userId!);
      
      if (
        !currentUserMembership || 
        (currentUserMembership.role !== "admin" && req.session.userId !== userId)
      ) {
        return res.status(403).json({ message: "Not authorized to remove team member" });
      }
      
      const result = await storage.removeTeamMember(teamId, userId);
      if (!result) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      res.status(200).json({ message: "Team member removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });
  
  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
      
      if (teamId) {
        // Check if team exists
        const team = await storage.getTeam(teamId);
        if (!team) {
          return res.status(404).json({ message: "Team not found" });
        }
        
        // Check if user is member of the team
        const teamMembers = await storage.getTeamMembers(teamId);
        const isMember = teamMembers.some(member => member.userId === req.session.userId!);
        
        if (!isMember) {
          return res.status(403).json({ message: "Not authorized to view projects" });
        }
        
        const projects = await storage.getProjectsByTeam(teamId);
        res.status(200).json(projects);
      } else {
        // Get all teams the user belongs to
        const teams = await storage.getTeamsByUser(req.session.userId!);
        
        // Get projects for each team
        const projectPromises = teams.map(team => storage.getProjectsByTeam(team.id));
        const projectsByTeam = await Promise.all(projectPromises);
        
        // Flatten the array of projects
        const projects = projectsByTeam.flat();
        
        res.status(200).json(projects);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get projects" });
    }
  });
  
  app.post("/api/projects", requireAuth, validateBody(insertProjectSchema), async (req, res) => {
    try {
      const { teamId } = req.body;
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is member of the team
      const teamMembers = await storage.getTeamMembers(teamId);
      const userMembership = teamMembers.find(member => member.userId === req.session.userId!);
      
      if (!userMembership) {
        return res.status(403).json({ message: "Not authorized to create project" });
      }
      
      const project = await storage.createProject(req.body);
      
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to create project" });
    }
  });
  
  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view project" });
      }
      
      res.status(200).json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project" });
    }
  });
  
  app.put("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const userMembership = teamMembers.find(member => member.userId === req.session.userId!);
      
      if (!userMembership || userMembership.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to update project" });
      }
      
      const updatedProject = await storage.updateProject(project.id, req.body);
      res.status(200).json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });
  
  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is admin of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const userMembership = teamMembers.find(member => member.userId === req.session.userId!);
      
      if (!userMembership || userMembership.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete project" });
      }
      
      await storage.deleteProject(project.id);
      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });
  
  // Task routes
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const assigneeId = req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined;
      
      if (projectId) {
        // Check if project exists
        const project = await storage.getProject(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if user is member of the team that owns the project
        const teamMembers = await storage.getTeamMembers(project.teamId);
        const isMember = teamMembers.some(member => member.userId === req.session.userId!);
        
        if (!isMember) {
          return res.status(403).json({ message: "Not authorized to view tasks" });
        }
        
        const tasks = await storage.getTasksByProject(projectId);
        res.status(200).json(tasks);
      } else if (assigneeId) {
        // Users can only view their own assigned tasks
        if (assigneeId !== req.session.userId!) {
          return res.status(403).json({ message: "Not authorized to view other users' tasks" });
        }
        
        const tasks = await storage.getTasksByAssignee(assigneeId);
        res.status(200).json(tasks);
      } else {
        // Get all tasks assigned to the current user
        const tasks = await storage.getTasksByAssignee(req.session.userId!);
        res.status(200).json(tasks);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });
  
  app.post("/api/tasks", requireAuth, validateBody(insertTaskSchema), async (req, res) => {
    try {
      const { projectId } = req.body;
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to create task" });
      }
      
      const task = await storage.createTask(req.body);
      
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  
  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if project exists
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view task" });
      }
      
      res.status(200).json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to get task" });
    }
  });
  
  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if project exists
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to update task" });
      }
      
      const updatedTask = await storage.updateTask(task.id, req.body);
      res.status(200).json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  
  app.put("/api/tasks/:id/status", requireAuth, async (req, res) => {
    try {
      const { status, order } = req.body;
      
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if project exists
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to update task status" });
      }
      
      const updatedTask = await storage.updateTaskStatus(task.id, status, order);
      res.status(200).json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task status" });
    }
  });
  
  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if project exists
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to delete task" });
      }
      
      await storage.deleteTask(task.id);
      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  
  // Comment routes
  app.get("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      
      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if project exists
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view comments" });
      }
      
      const comments = await storage.getCommentsByTask(taskId);
      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get comments" });
    }
  });
  
  app.post("/api/tasks/:taskId/comments", requireAuth, validateBody(insertCommentSchema), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      
      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if project exists
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to add comment" });
      }
      
      const comment = await storage.createComment({
        ...req.body,
        taskId,
        userId: req.session.userId!,
      });
      
      // Get the user for the comment
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(500).json({ message: "Failed to get user" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({ ...comment, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });
  
  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      
      // Find the comment
      const comment = Array.from(storage["comments"].values()).find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if the user is the author of the comment
      if (comment.userId !== req.session.userId!) {
        // If not, check if the user is an admin
        const task = await storage.getTask(comment.taskId);
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        const project = await storage.getProject(task.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        const teamMembers = await storage.getTeamMembers(project.teamId);
        const userMembership = teamMembers.find(member => member.userId === req.session.userId!);
        
        if (!userMembership || userMembership.role !== "admin") {
          return res.status(403).json({ message: "Not authorized to delete comment" });
        }
      }
      
      await storage.deleteComment(commentId);
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });
  
  // File routes
  app.get("/api/projects/:projectId/files", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view files" });
      }
      
      const files = await storage.getFilesByProject(projectId);
      res.status(200).json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to get files" });
    }
  });
  
  app.get("/api/tasks/:taskId/files", requireAuth, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      
      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if project exists
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view files" });
      }
      
      const files = await storage.getFilesByTask(taskId);
      res.status(200).json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to get files" });
    }
  });
  
  app.post("/api/files", requireAuth, validateBody(insertFileSchema), async (req, res) => {
    try {
      const { projectId } = req.body;
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to upload file" });
      }
      
      const file = await storage.createFile({
        ...req.body,
        uploadedBy: req.session.userId!,
      });
      
      res.status(201).json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  
  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      
      // Find the file
      const file = Array.from(storage["files"].values()).find(f => f.id === fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Check if project exists
      const project = await storage.getProject(file.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user is member of the team that owns the project
      const teamMembers = await storage.getTeamMembers(project.teamId);
      const userMembership = teamMembers.find(member => member.userId === req.session.userId!);
      
      if (!userMembership) {
        return res.status(403).json({ message: "Not authorized to delete file" });
      }
      
      // Only the uploader or team admin can delete files
      if (file.uploadedBy !== req.session.userId! && userMembership.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete file" });
      }
      
      await storage.deleteFile(fileId);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });
  
  // Message routes
  app.get("/api/teams/:teamId/messages", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is member of the team
      const teamMembers = await storage.getTeamMembers(teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to view messages" });
      }
      
      const messages = await storage.getMessagesByTeam(teamId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  
  app.post("/api/teams/:teamId/messages", requireAuth, validateBody(insertMessageSchema), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is member of the team
      const teamMembers = await storage.getTeamMembers(teamId);
      const isMember = teamMembers.some(member => member.userId === req.session.userId!);
      
      if (!isMember) {
        return res.status(403).json({ message: "Not authorized to send message" });
      }
      
      const message = await storage.createMessage({
        ...req.body,
        teamId,
        userId: req.session.userId!,
      });
      
      // Get the user for the message
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(500).json({ message: "Failed to get user" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({ ...message, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  app.delete("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      // Find the message
      const message = Array.from(storage["messages"].values()).find(m => m.id === messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Check if the user is the author of the message
      if (message.userId !== req.session.userId!) {
        // If not, check if the user is an admin
        const teamMembers = await storage.getTeamMembers(message.teamId);
        const userMembership = teamMembers.find(member => member.userId === req.session.userId!);
        
        if (!userMembership || userMembership.role !== "admin") {
          return res.status(403).json({ message: "Not authorized to delete message" });
        }
      }
      
      await storage.deleteMessage(messageId);
      res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
