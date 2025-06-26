const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { initializeDatabase } = require("./db/db.connect");
const app = express();

// -------------------------------------------------------------------------

const User = require("./models/user.model");
const Project = require("./models/project.model");
const Tag = require("./models/tag.model");
const Team = require("./models/team.model");
const Task = require("./models/task.model");

// -------------------------------------------------------------------------

// JWT Secret
const SECRET_KEY = "supersecretadmin";
const JWT_SECRET = "your_jwt_secret";

app.use(cors());
app.use(express.json());
initializeDatabase();

// -------------------------------------------------------------------------

// Admin login endpoint
app.post("/admin/login", (req, res) => {
  const { secret } = req.body;
  if (secret === SECRET_KEY) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid Secret" });
  }
});

// -------------------------------------------------------------------------

// Verify JWT for protected admin routes
const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Admin protected route
app.get("/admin/api/data", verifyJWT, (req, res) => {
  res.json({ message: "protected route accessible" });
});


// -------------------------------------------------------------------------

// User signup endpoint
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

   
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);

 
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------------------------

// User login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

   
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

   
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

   
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------- POST METHODS ------------------------------------------------

// Create new team
app.post("/teams", async (req, res) => {
  try {
    const { name, description } = req.body;

  
    if (!name) {
      return res.status(400).json({ error: "Team name is required" });
    }

  
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ error: "Team name already exists" });
    }

   
    const team = new Team({ name, description });
    await team.save();

    res.status(201).json({ message: "Team created successfully", team });
  } catch (error) {
    console.error("Team Creation Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------------------------

// Create new task
app.post("/tasks", async (req, res) => {
  try {
    let { name, project, team, owners, tags, timeToComplete, status } = req.body;

   
    if (!name || !project || !team || !owners || !timeToComplete) {
      return res.status(400).json({ error: "Missing required fields" });
    }

  
    const validStatuses = ["To Do", "In Progress", "Completed", "Blocked"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

   
    if (!mongoose.Types.ObjectId.isValid(project)) {
      const projectDoc = await Project.findOne({ name: project });
      if (!projectDoc) {
        return res.status(400).json({ error: "Project not found" });
      }
      project = projectDoc._id;
    }

  
    if (!mongoose.Types.ObjectId.isValid(team)) {
      const teamDoc = await Team.findOne({ name: team });
      if (!teamDoc) {
        return res.status(400).json({ error: "Team not found" });
      }
      team = teamDoc._id;
    }

    
    if (!Array.isArray(owners)) {
      return res.status(400).json({ error: "Owners must be an array" });
    }

    const ownerIds = [];
    for (let owner of owners) {
      if (!mongoose.Types.ObjectId.isValid(owner)) {
        
        const user = await User.findOne({ $or: [{ email: owner }, { name: owner }] });
        if (!user) {
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
    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.error("Task Creation Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------------------------

// Create new project
app.post("/projects", async (req, res) => {
  try {
    const { name, description } = req.body;

    
    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

  
    const existingProject = await Project.findOne({ name });
    if (existingProject) {
      return res.status(400).json({ error: "Project name already exists" });
    }

  
    const project = new Project({ name, description });
    await project.save();

    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    console.error("Project Creation Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------------------------

// Create new tag
app.post("/tags", async (req, res) => {
  try {
    const { name } = req.body;

    
    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return res.status(400).json({ error: "Tag name already exists" });
    }

  
    const tag = new Tag({ name });
    await tag.save();

    res.status(201).json({ message: "Tag created successfully", tag });
  } catch (error) {
    console.error("Tag Creation Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------------------------

// Get all users
async function readAllUsers() {
  try {
    const users = await User.find();
    return users;
  } catch (error) {
    console.log("Error fetching users:", error);
    throw error;
  }
}

app.get("/users", async (req, res) => {
  try {
    const users = await readAllUsers();
    if (users.length > 0) {
      res.status(200).json(users);
    } else {
      res.status(404).json({ error: "No users found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// -------------------------------------------------------------------------

// Get all tasks
async function readAllTasks() {
  try {
    const tasks = await Task.find();
    return tasks;
  } catch (error) {
    console.log("Error fetching tasks:", error);
    throw error;
  }
}

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await readAllTasks();
    if (tasks.length > 0) {
      res.status(200).json(tasks);
    } else {
      res.status(404).json({ error: "No tasks found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// -------------------------------------------------------------------------

// Get all teams
async function readAllTeams() {
  try {
    const teams = await Team.find();
    return teams;
  } catch (error) {
    console.log("Error fetching teams:", error);
    throw error;
  }
}

app.get("/teams", async (req, res) => {
  try {
    const teams = await readAllTeams();
    if (teams.length > 0) {
      res.status(200).json(teams);
    } else {
      res.status(404).json({ error: "No teams found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// -------------------------------------------------------------------------

// Get all projects
async function readAllProjects() {
  try {
    const projects = await Project.find();
    return projects;
  } catch (error) {
    console.log("Error fetching projects:", error);
    throw error;
  }
}

app.get("/projects", async (req, res) => {
  try {
    const projects = await readAllProjects();
    if (projects.length > 0) {
      res.status(200).json(projects);
    } else {
      res.status(404).json({ error: "No projects found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// -------------------------------------------------------------------------

// Get all tags
async function readAllTags() {
  try {
    const tags = await Tag.find();
    return tags;
  } catch (error) {
    console.log("Error fetching tags:", error);
    throw error;
  }
}

app.get("/tags", async (req, res) => {
  try {
    const tags = await readAllTags();
    if (tags.length > 0) {
      res.status(200).json(tags);
    } else {
      res.status(404).json({ error: "No tags found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// -------------------------------------------------------------------------

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});