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
* "It is Helpful" Question Voting & Prioritization
* Cohort Pulse Lifecycle-Based FAQ Feed
* 4-Stage Internship Timeline Mapping (Onboarding, Documentation, ViBe, Projects)
* Manual Answer Moderation Queue (Approve, Reject, Mark Best)

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
* Gemini Embeddings
* Jaccard Similarity & Overlap Coefficient NLP matchers

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
> For more detailed information about the technical design, database models, and scalability parameters, refer to the [ARCHITECTURE.md](ARCHITECTURE.md) document.

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
> Refer to [PRODUCT.md](PRODUCT.md) for more details on user journeys, product requirements, and resolution paths.

---

## Project Structure

```text
cs6/
│
├── backend/                  # Backend application source code (Node.js/Express)
│   ├── src/                  # Main backend source folder
│   │   ├── config/           # Application configuration files (DB, Cloudinary, auth, etc.)
│   │   ├── controllers/      # Route controller functions handling client requests
│   │   ├── middlewares/      # Express middlewares (auth checks, moderation layers, etc.)
│   │   ├── models/           # Mongoose schemas and models (User, Question, SupportTicket, etc.)
│   │   ├── routes/           # Express API route handlers and endpoints
│   │   ├── services/         # Core business logic services (BERT moderation, similarity engines, etc.)
│   │   └── utils/            # Helper utilities and reusable general helper functions
│   │
│   ├── app.js                # Express app setup and middleware configuration
│   └── server.js             # Entry point file to start the backend listener
│
├── frontend/                 # Frontend application source code (React/Vite)
│   ├── src/                  # Main frontend source folder
│   │   ├── api/              # API caller services (Axios client)
│   │   ├── components/       # Reusable layout and interactive user interface components
│   │   ├── layouts/          # Layout wrapper structures (AdminLayout, MainLayout)
│   │   ├── pages/            # Main client router views/pages (Dashboard, Home, Login, Signup)
│   │   └── App.jsx           # Main client router and React root component wrapper
│   │
│   └── vite.config.js        # Vite compiler and building configuration setup
│
├── ARCHITECTURE.md           # Detailed architecture document (database schema details, tech stack info)
├── CONTEXT.md                # Maintenance context log tracking goals, challenges, and fixes
├── PRODUCT.md                # Comprehensive product design, MVP requirements & user journeys
├── LICENSE                   # Open-source license agreement file
└── README.md                 # Main setup guide and portal documentation
```

### Folder and File Descriptions

#### **Backend Directory (`backend/`)**
- **`src/config/`**: Houses environment settings, database connectivity helpers, and configuration files for Cloudinary uploads.
- **`src/controllers/`**: Coordinates requests and responses between the client and database. Controls functions like user signups, question requests, and moderation commands.
- **`src/middlewares/`**: Houses Express interceptors such as JWT token validation, CORS management, and automated content filtering before routes execute.
- **`src/models/`**: Defines data shapes and structures using Mongoose Schemas. Prominent schemas include:
  - `User`: Handles student/moderator/admin profile attributes, credentials, and cohort timelines.
  - `Question`: Represents public queries, duplicate detection statuses, and bookmark details.
  - `Answer`: Stores responses and flags whether they have been approved or designated as "best".
  - `SupportTicket`: Isolated support issues uploaded by users.
- **`src/routes/`**: Maps API url patterns (`/api/auth`, `/api/questions`, etc.) to specific controller logic.
- **`src/services/`**: Encapsulates external integrations, database triggers, and heavy computations (e.g., duplicate checking using Fuse.js, similarity matches, and BERT toxicity checking).
- **`src/utils/`**: Implements custom error-handling classes, encryption routines, and generic functions.

#### **Frontend Directory (`frontend/`)**
- **`src/api/`**: Configures global Axios request settings (such as base URL, authorization headers, and error interceptors).
- **`src/components/`**: Houses modular design system elements like cards, timeline steppers, modulators, and modals.
- **`src/layouts/`**: Creates shell templates (like dashboards and standard headers) that wrap main pages.
- **`src/pages/`**: Standard React components loaded via route transitions, e.g., the Q&A Feed page, Cohort Onboarding page, and Moderator Dashboard.

#### **Documentation & Configuration Files**
- **`ARCHITECTURE.md`**: Provides a deep architectural breakdown, detailed database schema keys, scale constraints, and network API diagrams.
- **`PRODUCT.md`**: Details the user Journeys (Seekers, Contributors, Admins, Support filing), functional parameters, and release goals.
- **`CONTEXT.md`**: Contains a history log of issues encountered during development, bug solutions, and system upgrades.
- **`samagama_faq.json`**: An FAQ database seed file used to populate default categories and questions.

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

GEMINI_API_KEY=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM="Vicharanashala <your-email@gmail.com>"
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
/api/cohort-pulse
```


