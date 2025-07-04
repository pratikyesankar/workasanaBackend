const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
const { initializeDatabase } = require("./db/db.connect");
const app = express();

// Load environment variables
dotenv.config();

// Models
const User = require("./models/user.model");
const Project = require("./models/project.model");
const Tag = require("./models/tag.model");
const Team = require("./models/team.model");
const Task = require("./models/task.model");

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5174" }));
app.use(express.json());

// Initialize database
initializeDatabase();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const SECRET_KEY = process.env.ADMIN_SECRET || "supersecretadmin";

// Admin login
app.post("/admin/login", (req, res, next) => {
  const { secret } = req.body;
  console.log("Admin login attempt with secret:", secret);
  if (secret === SECRET_KEY) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.setHeader("Content-Type", "application/json");
    res.json({ token });
  } else {
    res.setHeader("Content-Type", "application/json");
    res.status(401).json({ error: "Invalid admin secret" });
  }
});

// JWT verification middleware
const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) {
    res.setHeader("Content-Type", "application/json");
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    res.setHeader("Content-Type", "application/json");
    return res.status(403).json({ error: "Invalid token" });
  }
};

// Token verification endpoint
app.get("/api/verify-token", verifyJWT, (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ message: "Token is valid", user: req.user });
});

// Signup
app.post("/api/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log("Signup attempt for email:", email);
    if (!name || !email || !password) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
    res.setHeader("Content-Type", "application/json");
    res.status(201).json({ message: "User registered successfully", token, email: user.email, name: user.name });
  } catch (error) {
    next(error);
  }
});

// Login
app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);
    if (!email || !password) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      res.setHeader("Content-Type", "application/json");
      return res.status(401).json({ error: "Invalid credentials: user not found" });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.log("Password mismatch for email:", email);
      res.setHeader("Content-Type", "application/json");
      return res.status(401).json({ error: "Invalid credentials: incorrect password" });
    }
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });
    res.setHeader("Content-Type", "application/json");
    res.json({ message: "Login successful", token, email: user.email, name: user.name });
  } catch (error) {
    next(error);
  }
});

// Team creation
app.post("/teams", verifyJWT, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Team name is required" });
    }
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Team name already exists" });
    }
    const team = new Team({ name, description });
    await team.save();
    res.setHeader("Content-Type", "application/json");
    res.status(201).json({ message: "Team created successfully", team });
  } catch (error) {
    next(error);
  }
});

// Task creation
app.post("/tasks", verifyJWT, async (req, res, next) => {
  try {
    let { name, project, team, owners, tags, timeToComplete, status } = req.body;
    if (!name || !project || !team || !owners || !timeToComplete) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Missing required fields" });
    }
    const validStatuses = ["To Do", "In Progress", "Completed", "Blocked"];
    if (status && !validStatuses.includes(status)) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Invalid status value" });
    }
    if (!mongoose.Types.ObjectId.isValid(project)) {
      const projectDoc = await Project.findOne({ name: project });
      if (!projectDoc) {
        res.setHeader("Content-Type", "application/json");
        return res.status(400).json({ error: "Project not found" });
      }
      project = projectDoc._id;
    }
    if (!mongoose.Types.ObjectId.isValid(team)) {
      const teamDoc = await Team.findOne({ name: team });
      if (!teamDoc) {
        res.setHeader("Content-Type", "application/json");
        return res.status(400).json({ error: "Team not found" });
      }
      team = teamDoc._id;
    }
    if (!Array.isArray(owners)) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Owners must be an array" });
    }
    const ownerIds = [];
    for (let owner of owners) {
      if (!mongoose.Types.ObjectId.isValid(owner)) {
        const user = await User.findOne({ $or: [{ email: owner }, { name: owner }] });
        if (!user) {
          res.setHeader("Content-Type", "application/json");
          return res.status(400).json({ error: `User not found: ${owner}` });
        }
        ownerIds.push(user._id);
      } else {
        ownerIds.push(owner);
      }
    }
    const task = new Task({
      name,
      project,
      team,
      owners: ownerIds,
      tags: tags || [],
      timeToComplete,
      status: status || "To Do",
    });
    await task.save();
    res.setHeader("Content-Type", "application/json");
    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    next(error);
  }
});

// Project creation
app.post("/projects", verifyJWT, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Project name is required" });
    }
    const existingProject = await Project.findOne({ name });
    if (existingProject) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Project name already exists" });
    }
    const project = new Project({ name, description });
    await project.save();
    res.setHeader("Content-Type", "application/json");
    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    next(error);
  }
});

// Tag creation
app.post("/tags", verifyJWT, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Tag name is required" });
    }
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: "Tag name already exists" });
    }
    const tag = new Tag({ name });
    await tag.save();
    res.setHeader("Content-Type", "application/json");
    res.status(201).json({ message: "Tag created successfully", tag });
  } catch (error) {
    next(error);
  }
});

// Fetch all users
app.get("/users", verifyJWT, async (req, res, next) => {
  try {
    const users = await User.find();
    res.setHeader("Content-Type", "application/json");
    if (users.length > 0) {
      res.status(200).json(users);
    } else {
      res.status(404).json({ error: "No users found" });
    }
  } catch (error) {
    next(error);
  }
});

// Fetch all tasks
app.get("/tasks", verifyJWT, async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.setHeader("Content-Type", "application/json");
    if (tasks.length > 0) {
      res.status(200).json(tasks);
    } else {
      res.status(404).json({ error: "No tasks found" });
    }
  } catch (error) {
    next(error);
  }
});

// Fetch all teams
app.get("/teams", verifyJWT, async (req, res, next) => {
  try {
    const teams = await Team.find();
    res.setHeader("Content-Type", "application/json");
    if (teams.length > 0) {
      res.status(200).json(teams);
    } else {
      res.status(404).json({ error: "No teams found" });
    }
  } catch (error) {
    next(error);
  }
});

// Fetch all projects
app.get("/projects", verifyJWT, async (req, res, next) => {
  try {
    const projects = await Project.find();
    res.setHeader("Content-Type", "application/json");
    if (projects.length > 0) {
      res.status(200).json(projects);
    } else {
      res.status(404).json({ error: "No projects found" });
    }
  } catch (error) {
    next(error);
  }
});

// Fetch all tags
app.get("/tags", verifyJWT, async (req, res, next) => {
  try {
    const tags = await Tag.find();
    res.setHeader("Content-Type", "application/json");
    if (tags.length > 0) {
      res.status(200).json(tags);
    } else {
      res.status(404).json({ error: "No tags found" });
    }
  } catch (error) {
    next(error);
  }
});

// Last week report
app.get("/report/last-week", verifyJWT, async (req, res, next) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const tasks = await Task.find({
      status: "Completed",
      updatedAt: { $gte: oneWeekAgo },
    })
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name");
    res.setHeader("Content-Type", "application/json");
    if (!tasks.length) {
      return res.status(404).json({ error: "No tasks completed last week" });
    }
    const byProject = tasks.reduce((acc, task) => {
      const projectName = task.project?.name || "Unknown";
      acc[projectName] = (acc[projectName] || 0) + 1;
      return acc;
    }, {});
    res.status(200).json({
      message: "Last week report fetched successfully",
      tasks,
      byProject,
    });
  } catch (error) {
    next(error);
  }
});

// Pending report
app.get("/report/pending", verifyJWT, async (req, res, next) => {
  try {
    const tasks = await Task.find({ status: { $ne: "Completed" } }).populate("project", "name");
    res.setHeader("Content-Type", "application/json");
    if (!tasks.length) {
      return res.status(404).json({ error: "No pending tasks found" });
    }
    const totalPendingDays = tasks.reduce((sum, task) => sum + (task.timeToComplete || 0), 0);
    const byProject = tasks.reduce((acc, task) => {
      const projectName = task.project?.name || "Unknown";
      acc[projectName] = (acc[projectName] || 0) + (task.timeToComplete || 0);
      return acc;
    }, {});
    res.status(200).json({
      message: "Pending report fetched successfully",
      totalPendingDays,
      byProject,
    });
  } catch (error) {
    next(error);
  }
});

// Closed tasks report
app.get("/report/closed-tasks", verifyJWT, async (req, res, next) => {
  try {
    const tasks = await Task.find({ status: "Completed" })
      .populate("project", "name")
      .populate("team", "name")
      .populate("owners", "name");
    res.setHeader("Content-Type", "application/json");
    if (!tasks.length) {
      return res.status(404).json({ error: "No completed tasks found" });
    }
    const byTeam = tasks.reduce((acc, task) => {
      const teamName = task.team?.name || "Unknown";
      acc[teamName] = (acc[teamName] || 0) + 1;
      return acc;
    }, {});
    const byOwner = tasks.reduce((acc, task) => {
      task.owners.forEach((owner) => {
        const ownerName = owner.name || "Unknown";
        acc[ownerName] = (acc[ownerName] || 0) + 1;
      });
      return acc;
    }, {});
    const byProject = tasks.reduce((acc, task) => {
      const projectName = task.project?.name || "Unknown";
      acc[projectName] = (acc[projectName] || 0) + 1;
      return acc;
    }, {});
    res.status(200).json({
      message: "Closed tasks report fetched successfully",
      byTeam,
      byOwner,
      byProject,
    });
  } catch (error) {
    next(error);
  }
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.setHeader("Content-Type", "application/json");
  res.status(500).json({ error: err.message || "Server error" });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});