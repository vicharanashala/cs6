# VicharanaShala — AI-Assisted FAQ Portal

A collaborative FAQ platform for VLED Summership where students can ask questions, discover existing answers, and build a verified FAQ knowledge base through community contributions and moderator review. 

---

## Features

* User Authentication (JWT)
* Ask & Answer Questions
* Category-based Knowledge Organization
* FAQ Promotion Workflow
* Semantic Duplicate Question Detection
* AI-powered Content Moderation
* Question & Answer Reporting
* Bookmark Important Questions
* Role-based Access Control (Student, Moderator, Admin)
* Private Support Ticket System

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* bcrypt

### AI & Search

* HuggingFace Toxic-BERT
* Fuse.js
* Custom Semantic Similarity Engine

### Storage

* Cloudinary (Attachments & Images)

---

## System Architecture

```text
React Frontend
      │
      ▼
Express REST API
      │
 ┌────┼─────────────────────┐
 │    │         │           │
Auth Questions Moderation Reports
 │    │         │           │
 └────┴─────────┴───────────┘
      │
      ▼
 MongoDB Atlas

External Services:
• HuggingFace API
• Cloudinary
```

---

## Core Workflow

```text
User Searches FAQ
        │
        ▼
Question Not Found
        │
        ▼
Ask Question
        │
        ▼
Duplicate Detection
        │
        ▼
Question Published
        │
        ▼
Community Answers
        │
        ▼
AI Moderation
        │
        ▼
Moderator Review
        │
        ▼
Best Answer Selected
        │
        ▼
Promoted to FAQ
```

---

## Project Structure

```text
cs6/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── app.js
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   └── App.jsx
│   │
│   └── vite.config.js
│
├── product.md
├── ARCHITECTURE.md
└── README.md
```

---

# Environment Variables

## Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=

JWT_SECRET=
JWT_REFRESH_SECRET=

JWT_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

HUGGINGFACE_API_KEY=

FRONTEND_URL=http://localhost:5173
```

## Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

# Local Development Setup

## Prerequisites

* Node.js 18+
* MongoDB Atlas Cluster
* Cloudinary Account
* HuggingFace API Key

---

## 1. Clone Repository

```bash
git clone https://github.com/vicharanashala/cs6
cd cs6
```

---

## 2. Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd ../frontend
npm install
```

---

## 3. Configure Environment Variables

Create:

```text
backend/.env
frontend/.env
```

Fill the variables listed above.

---

## 4. Start Backend

```bash
cd backend
npm run dev
```

Backend:

```text
http://localhost:5000
```

---

## 5. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Roles

| Role      | Permissions                                     |
| --------- | ----------------------------------------------- |
| Student   | Ask questions, answer, bookmark, report content |
| Admin     | Review reports, moderate content, Manage users, Assign tickets|

---

## API Modules

```text
/api/auth
/api/questions
/api/answers
/api/categories
/api/search
/api/reports
/api/bookmarks
/api/users
/api/tickets
/api/moderation
```


