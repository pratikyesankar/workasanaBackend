const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();

const { initializeDatabase } = require("./db/db.connect");

const User = require("./models/user.model");
const Project = require("./models/project.model");
const Team = require("./models/team.model");
const Tag = require("./models/tag.model");
const Task = require("./models/task.model");

const SECRET_KEY = "supersecretadmin";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

initializeDatabase();

app.use(cors());
app.use(express.json());

// ----------------------------------------------------------------------------------------------------------
 const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.log("No token provided in Authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("Incorrect Authorization header format");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    console.log("Token verified, decoded:", decodedToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Admin Login  
app.post("/admin/login", (req, res) => {
  const { secret } = req.body;
  if (!secret) {
    return res.status(400).json({ message: "Secret is required" });
  }
  if (secret === SECRET_KEY) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    console.log("Admin login successful");
    return res.json({ message: "Admin login successful", token });
  } else {
    console.log("Invalid admin secret provided");
    return res.status(401).json({ message: "Invalid Secret" });
  }
});
// ----------------------------------------------------------------------------------------------------------

// User Signup  
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log("Missing required fields for signup:", { name, email, password });
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered:", email);
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    console.log("Signup successful for email:", email);
    res.status(201).json({ message: "User registered successfully", token, email: user.email, name: user.name });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// User Login  
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing required fields for login:", { email, password });
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      console.log("Incorrect password for email:", email);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    console.log("Login successful for email:", email);
    res.json({ message: "Login successful", token, email: user.email, name: user.name });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});
// ----------------------------------------------------------------------------------------------------------
 
app.get("/admin/api/data", verifyJWT, (req, res) => {
  if (req.user.role !== "admin") {
    console.log("Unauthorized access attempt by:", req.user);
    return res.status(403).json({ message: "Admin access required" });
  }
  console.log("Protected admin route accessed by:", req.user);
  res.json({ message: "Protected route accessible to admin" });
});

// Token Verification Endpoint
app.get("/api/verify-token", verifyJWT, (req, res) => {
  console.log("Token verification successful for user:", req.user);
  res.json({ message: "Token is valid", user: req.user });
});

// Get all users 
app.get("/auth/users", verifyJWT, async (req, res) => {
  try {
    const users = await User.find().select('-password');  
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Server error fetching users", details: error.message });
  }
});

// ----------------------------------------------------------------------------------------------------------
// --- Project Routes ---
app.post("/projects", verifyJWT, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }
    const newProject = new Project({ name, description });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error.message);
    res.status(500).json({ error: "Server error creating project", details: error.message });
  }
});

app.get("/projects", verifyJWT, async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error.message);
    res.status(500).json({ error: "Server error fetching projects", details: error.message });
  }
});

// ----------------------------------------------------------------------------------------------------------
// --- Team Routes ---
app.post("/teams", verifyJWT, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Team name is required" });
    }
    const newTeam = new Team({ name, description });
    await newTeam.save();
    res.status(201).json(newTeam);
  } catch (error) {
    console.error("Error creating team:", error.message);
    res.status(500).json({ error: "Server error creating team", details: error.message });
  }
});

app.get("/teams", verifyJWT, async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error.message);
    res.status(500).json({ error: "Server error fetching teams", details: error.message });
  }
});

// ----------------------------------------------------------------------------------------------------------
// --- Tag Routes ---
app.post("/tags", verifyJWT, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }
    const newTag = new Tag({ name });
    await newTag.save();
    res.status(201).json(newTag);
  } catch (error) {
    console.error("Error creating tag:", error.message);
    res.status(500).json({ error: "Server error creating tag", details: error.message });
  }
});

app.get("/tags", verifyJWT, async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error.message);
    res.status(500).json({ error: "Server error fetching tags", details: error.message });
  }
});

// ----------------------------------------------------------------------------------------------------------
// --- Task Routes ---
app.post("/tasks", verifyJWT, async (req, res) => {
  try {
    const { name, project, team, owners, tags, timeToComplete, status } = req.body;
    if (!name || !project || !team || !timeToComplete) {
      return res.status(400).json({ error: "Task name, project, team, and time to complete are required" });
    }

    const newTask = new Task({
      name,
      project,
      team,
      owners: owners || [],
      tags: tags || [],
      timeToComplete,
      status: status || "To Do",
    });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error.message);
    res.status(500).json({ error: "Server error creating task", details: error.message });
  }
});

app.get("/tasks", verifyJWT, async (req, res) => {
  try {
    const { owner, team, tags, project, status, sortBy } = req.query;
    const filter = {};

    if (owner) filter.owners = owner;
    if (team) filter.team = team;
    if (project) filter.project = project;
    if (status) filter.status = status;
    if (tags) {
      filter.tags = { $in: tags.split(',') };
    }

    let query = Task.find(filter)
      .populate('project', 'name')
      .populate('team', 'name')
      .populate('owners', 'name');

    if (sortBy === 'timeToComplete') {
      query = query.sort({ timeToComplete: 1 });
    }

    const tasks = await query.exec();
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({ error: "Server error fetching tasks", details: error.message });
  }
});

app.post("/tasks/:id", verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error.message);
    res.status(500).json({ error: "Server error updating task", details: error.message });
  }
});

app.delete("/tasks/:id", verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error.message);
    res.status(500).json({ error: "Server error deleting task", details: error.message });
  }
});

// ----------------------------------------------------------------------------------------------------------
// --- Reporting Routes ---

app.get("/report/last-week", verifyJWT, async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const completedTasksLastWeek = await Task.find({
      status: "Completed",
      updatedAt: { $gte: oneWeekAgo },
    }).populate('project', 'name');

    res.json(completedTasksLastWeek);
  } catch (error) {
    console.error("Error fetching last week's report:", error.message);
    res.status(500).json({ error: "Server error fetching report", details: error.message });
  }
});

app.get("/report/pending", verifyJWT, async (req, res) => {
  try {
    const pendingTasks = await Task.find({ status: { $ne: "Completed" } });
    const totalDaysPending = pendingTasks.reduce((sum, task) => sum + task.timeToComplete, 0);
    res.json({ totalDaysPending });
  } catch (error) {
    console.error("Error fetching pending work report:", error.message);
    res.status(500).json({ error: "Server error fetching report", details: error.message });
  }
});

app.get("/report/closed-tasks", verifyJWT, async (req, res) => {
  try {
    const { groupBy } = req.query;

    if (!groupBy || !['team', 'owner', 'project'].includes(groupBy)) {
      return res.status(400).json({ error: "Invalid groupBy parameter. Must be 'team', 'owner', or 'project'." });
    }

    const completedTasks = await Task.find({ status: "Completed" })
      .populate('team', 'name')
      .populate('owners', 'name')
      .populate('project', 'name');

    const groupedData = {};

    completedTasks.forEach(task => {
      let key;
      if (groupBy === 'team' && task.team) {
        key = task.team.name;
      } else if (groupBy === 'owner' && task.owners && task.owners.length > 0) {
        task.owners.forEach(owner => {
          key = owner.name;
          groupedData[key] = (groupedData[key] || 0) + 1;
        });
        return;
      } else if (groupBy === 'project' && task.project) {
        key = task.project.name;
      } else {
        key = "Unknown";
      }

      groupedData[key] = (groupedData[key] || 0) + 1;
    });

    res.json(groupedData);
  } catch (error) {
    consoleirono: console.error("Error fetching closed tasks report:", error.message);
    res.status(500).json({ error: "Server error fetching report", details: error.message });
  }
});

// ----------------------------------------------------------------------------------------------------------
// Start the Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});