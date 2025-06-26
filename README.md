# Anvaya
A full-stack CRM app for lead management, allowing users to create, track, update, and visualize leads with sales agent assignment and reporting.
Built with a React frontend, Express/Node backend, MongoDB database, and Chart.js for visualizations.

---
## Demo Link
[Live Demo] (Replace with actual demo link)

---

Quick Start
git clone https://github.com/<your-username>/anvaya.git
cd anvaya
npm install
npm run dev      # or `npm start` / `yarn dev`

Technologies

-React JS  
-React Router  
-Node.js  
-Express  
-MongoDB  
-Chart.js

Demo Video
Watch a walkthrough (5–7 minutes) of all major features of this app: Loom Video Link (Replace with actual video link)
Features
Lead Management

Create and manage leads with details like name, source, status, and priority  
Assign leads to sales agents and track their progress

Lead Listing

Filter leads by sales agent, status, tags, or source  
Sort leads by priority or estimated closing date

Lead Details

View detailed lead information (status, tags, time to close, etc.)  
Add comments to track progress with author and timestamp

Reports and Visualizations

Visualize leads closed last week, total pipeline, and distribution by status  
View sales agent performance with Chart.js-powered bar and pie charts

URL-Based Filtering

Filter leads via URL (e.g., /leads?salesAgent=John&status=Qualified)  
Combine multiple filters for precise lead views

API Reference
POST /leads
Create a new leadRequest Body: { name, source, salesAgent, status, tags, timeToClose, priority }Sample Response: { id, name, source, salesAgent, status, ... }
GET /leads
List all leads with filteringExample: /leads?salesAgent=64c34512f7a60e36df44&status=NewSample Response: [{ id, name, source, salesAgent, status, ... }, ...]
PUT /leads/:id
Update a leadRequest Body: { name, source, salesAgent, status, tags, timeToClose, priority }Sample Response: { id, name, source, salesAgent, status, ... }
DELETE /leads/:id
Delete a leadSample Response: { message: "Lead deleted successfully." }
POST /agents
Add a new sales agentRequest Body: { name, email }Sample Response: { id, name, email, createdAt }
GET /report/last-week
Fetch leads closed in the last 7 daysSample Response: [{ id, name, salesAgent, closedAt }, ...]
Contact
For bugs or feature requests, please reach out to akanksha.xxx@gmail.com
