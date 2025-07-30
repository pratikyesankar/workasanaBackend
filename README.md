# Devloper Portfolio

## Project Overview
DevPortfolio is a responsive full-stack developer portfolio website that showcases professional skills, projects, tech stack, and contact information. Built with a modern React and Node.js stack, it provides an interactive way for recruiters and visitors to explore the developer's experience and work.

The portfolio includes real-time project rendering, backend integration for dynamic data, and elegant UI with dark mode for a better viewing experience.

## Demo Link
[Live Portfolio](https://post-folio-frontend.vercel.app)

## Quick Start

```
git clone [https://github.com/pratikyesankar/post-folio-frontend](https://github.com/pratikyesankar/postFolioFrontend)
cd post-folio-frontend
npm install
npm run dev
```


## Technologies

**Frontend**
- React.js  
- Tailwind CSS  
- Axios  
- React Router  
- Vite  

**Backend**
- Node.js  
- Express.js  
- MongoDB  
- Mongoose  
- CORS  

**Deployment**
- Vercel (Frontend)  
- Render (Backend)

## Features

**Landing Page**
- Intro section with name, role, and tech specialization.
- CTA buttons for contact and resume.

**Projects Section**
- Dynamically displays project cards from backend.
- Each card includes project title, tech stack, description, and link.

**Tech Stack Section**
- Icons and names of key technologies used in frontend and backend development.

**Contact Section**
- Contact form to send messages (optional email integration).
- Links to GitHub, LinkedIn, and resume.

**Responsive Design**
- Fully optimized for desktop, tablet, and mobile devices.

## API Reference

### **GET /api/projects**
Retrieve all portfolio projects.  
**Sample Response:**
```json
[
  {
    "title": "Workasana",
    "description": "A modern e-commerce platform with real-time inventory management, secure payment processing, and personalized recommendations.",
    "techStack": ["React", "Node.js", "Chart.js"],
    "demoLink": "https://frontend-workasana-p6hf.vercel.app/signup",
    "codeLink": "https://github.com/pratikyesankar/frontendWorkasana",
    "image": "https://images.pexels.com/photos/12193264/pexels-photo-12193264.jpeg"
  }
]
