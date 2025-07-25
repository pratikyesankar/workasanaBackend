  # WorkAsana
## Project Overview
WorkAsana is a full-stack task and project management application designed to streamline team collaboration and task tracking. It provides a user-friendly interface for managing tasks, teams, and projects with robust filtering, reporting, and visualization features. Built with a modern tech stack, WorkAsana ensures scalability, security, and an intuitive user experience.

## Demo Link
([Live Demo](https://frontend-workasana-p6hf.vercel.app/login))

## Login

> **Guest Credentials**  
> Password: supersecretadmin   

Quick Start

```
git clone (https://github.com/pratikyesankar/frontendWorkasana)
cd workasanaFrontend
npm install
npm run dev      
```
## Technologies

- React JS  
- React Router  
- Vite  
- Axios  
- Bootstrap  
- Chart.js  
- Node.js  
- Express  
- MongoDB  
- Mongoose  
- JWT  
- bcrypt

## Demo Video
Watch a walkthrough (5–7 minutes) of all major features of this app: Loom Video Link

## Features

**Home**
- Displays a list of all tasks with real-time filtering by owner, team, tags, project, or status.  
- URL-based filtering (e.g., /tasks?team=development&tags=Urgent).

**Task  Listing**
- Paginated task list with sorting options for completion dates or priority.  
- “Add New Task” button opens a form to create tasks with fields for task name, project, team, owners, tags, time to complete, and status.

**Task  Details**
- View detailed task information, including project, team, owners, tags, time to complete, and status (To Do, In Progress, Completed, Blocked).  
- “Edit Task” button to update task details or status.

**Authentication**
User signup and login with JWT-based authentication, storing tokens in localStorage.  
Protected routes ensure only authenticated users can add, edit, or delete tasks.  
Logout clears the JWT token and redirects to the login page.

## API Reference

### **GET /api/tasks**<br>  

List all tasks with optional filters (team, owner, tags, project, status).  
Sample Response:<br>
```[{ "_id": "123", "name": "Design Wireframes", "project": "Website Redesign", "team": "Development", "status": "In Progress", ... }, ...]```

### **GET /api/projects**<br>    

List all projects.  
Sample Response:<br>
```[{ "_id": "64c34512f7a60e36df44", "name": "Website Redesign", "description": "Redesign company website" }, ...]```


### **GET /api/teams**<br>  

List all teams.  
Sample Response:<br>
```[{ "_id": "64c99a47b74e58d3b213", "name": "Development", "description": "Handles development tasks" }, ...]```


### **POST /api/auth/signup**<br>   

Register a new user with password hashing (bcrypt).  
Sample Response:<br>
``` { "userId": "456", "token": "jwt_token" } ```

### **POST /api/auth/login**<br>   

Authenticate a user and issue a JWT token.  
Sample Response:<br>
``` { "userId": "456", "token": "jwt_token" } ```

### **POST /api/teams**<br>   

Create a new team.  
Sample Response:<br>
``` { "_id": "64c99a47b74e58d3b213", "name": "Development", "description": "Handles development tasks" } ```

### **POST /api/tasks**<br>    

Create a new task (protected).  
Sample Response:<br>
``` { "_id": "123", "name": "Design Wireframes", "project": "Website Redesign", ... } ```

### **POST /api/projects**<br>    

Create a new project.  
Sample Response:<br>
``` { "_id": "64c34512f7a60e36df44", "name": "Website Redesign", "description": "Redesign company website" } ```

### **GET /api/report/last-week**<br>    

Fetch tasks completed in the last 7 days.  
Sample Response:  [{ "_id": "123", "name": "Design Wireframes", "status": "Completed", ... }, ...]


## Contact
For bugs or feature requests, please reach out to pratikyesankar17.@gmail.com.
