# FAQ Website — Architecture Document

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [High-Level Architecture](#high-level-architecture)
4. [Frontend](#frontend)
5. [Backend](#backend)
6. [AI Service Layer](#ai-service-layer)
7. [Database & Storage](#database--storage)
8. [User Journey Flows](#user-journey-flows)
   - [Journey 1: Student (Question Asker)](#journey-1-student-question-asker)
   - [Journey 2: Community Contributor (Answer Provider)](#journey-2-community-contributor-answer-provider)
   - [Journey 3: Troubleshooting (Niche Issues)](#journey-3-troubleshooting-niche-issues)
9. [API Design](#api-design)
10. [Security & Moderation](#security--moderation)
11. [Scalability Notes](#scalability-notes)

---

## Overview

A community-driven FAQ platform where students can post questions, community members can contribute answers, and admins curate a growing knowledge base. AI augments the platform at key points — detecting duplicates, moderating content, and generating collective answers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| File Storage | Cloudinary |
| External AI | OpenAI API |
| API Layer | REST API via API Gateway |

---

## High-Level Architecture

```
Users (Students / Admins)
        │
        ▼
  [Frontend — React]
        │
        ▼
  [API Gateway / REST API]
        │
   ┌────┴────┐
   ▼         ▼
[Backend]  [AI Service Layer]
   │              │
   ├── Auth & User Management
   ├── Question Management     ◄──── Duplicate Detection (Semantic Search)
   ├── Answer Management       ◄──── Similar FAQ / Question Finder
   ├── FAQ Management          ◄──── Spam / Abuse Detection
   ├── Admin & Review Mgmt     ◄──── AI Collective Answer Generation
   ├── File Upload Service
   └── Notification (Pluggable)
        │
   ┌────┴──────────┐
   ▼               ▼
[MongoDB Atlas]  [Cloudinary]   [OpenAI API]
```

---

## Frontend

Built with **React**. Serves two user types: Students and Admins.

**Student-facing views:**
- FAQ Browse & Search (by keyword / category)
- Ask Question
- Questions Feed (open, unanswered questions)
- Answer Question
- Troubleshooting (niche issue reporting)

**Admin-facing views:**
- Admin Dashboard
- Review & Approval queue
- Moderation controls

---

## Backend

Built with **Node.js + Express**. Exposes a RESTful API consumed by the frontend and the AI service layer.

### Modules

**Auth & User Management**
- Registration, login, session/token management (JWT)
- Role-based access: Student, Admin

**Question Management**
- Create, read, update, delete questions
- Tag and categorize questions
- Track question status: Open → Unresolved → Answered → In FAQ Base

**Answer Management**
- Submit, edit, and delete answers
- Link answers to questions
- Track best answer selection

**FAQ Management**
- Promote approved answers to the FAQ knowledge base
- Organize by category
- Version control for FAQ entries

**Admin & Review Management**
- Review queue for flagged content
- Approve / reject answers and questions
- Mark best answers

**File Upload Service**
- Upload images/screenshots via Cloudinary
- Attach files to questions or troubleshooting tickets

**Notification Service** *(Pluggable)*
- Notify users on answer, moderation decision, or ticket update
- Pluggable: supports email, in-app, or push (configurable)

---

## AI Service Layer

Integrates with **OpenAI API** and internal semantic search. Runs automatically at defined points in the user journey.

| Feature | Trigger | Behavior |
|---|---|---|
| Duplicate Detection | On question submission | Semantic search across existing questions; shows matches if found |
| Similar FAQ / Question Finder | After duplicate check | Surfaces related FAQs the user may have missed |
| Spam / Abuse Detection | On answer/question submission | Flags content for review or auto-hides |
| AI Collective Answer Generation | After community answers collected | Synthesizes a consolidated answer for admin review |

---

## Database & Storage

### MongoDB Atlas

Primary data store. Collections:

- `users` — profiles, roles, auth tokens (Student / Admin)
- `questions` — content, tags, status, author, timestamps
- `answers` — content, question ref, author, moderation status, votes
- `faqs` — approved knowledge base entries
- `tickets` — troubleshooting submissions
- `notifications` — notification queue

### Cloudinary

File/image storage for:
- Question attachments
- Troubleshooting screenshots
- FAQ media assets

---

## User Journey Flows

### Journey 1: Student (Question Asker)

```
1. Browse FAQ (Search / Categories)
        │
2. Login / Sign Up
        │
3. Post Question
        │
4. AI Duplicate Detection
   ├── Yes → Show Similar FAQ / Question
   │         User Chooses: [Cancel] or [Continue]
   └── No  → Continue
        │
5. Question Added to Unresolved Queue
        │
6. Community Answers Collected
        │
7. AI Moderation (Spam / Abuse Check)
   ├── Pass → Valid Answer visible to student
   └── Flagged → Hidden / Sent for Review
        │
8. AI Collective Answer Generation
        │
9. Admin Review & Approval
   ├── Approve → Final Answer delivered to student
   └── Reject  → Removed from queue
        │
10. Answer added to FAQ Knowledge Base
```

---

### Journey 2: Student (Answer Provider)

**Goal:** Browse open questions and contribute answers to help others.

```
1. Log In
        │
2. Browse Open Questions Feed
        │
3. Select a Question to Answer
        │
4. Write and Submit Answer
        │
5. AI Moderation Check  ← Toxicity / spam filter runs automatically
   ├── Flagged → Answer Hidden Temporarily
   │             │
   │             ▼
   │         Moderator Reviews → Approve / Reject
   └── Passed
        │
6. Answer Published (visible to community)
        │
7. Admin Marks as Best Answer (if selected)
        │
8. Student Notified → Profile updated ✓
```

---

### Journey 3: Troubleshooting (Niche Issues)

For issues too specific or unique to fit the standard Q&A flow.

```
Troubleshooting Entry Point
        │
1. Create Ticket (Describe Issue)
        │
2. Upload Files / Screenshots (via Cloudinary)
        │
3. Discussion & Back-and-Forth (with Admin/Support)
        │
4. Admin / Support Responds
        │
5. Issue Resolved ✓ → Not added to FAQ Base
   (niche issues stay in ticket system only)
```

---

## API Design

Base path: `/api/v1`

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/questions` | List questions (filterable) |
| POST | `/questions` | Submit new question |
| GET | `/questions/:id` | Get question detail |
| POST | `/questions/:id/answers` | Submit answer to question |
| GET | `/faq` | Browse FAQ knowledge base |
| POST | `/tickets` | Submit troubleshooting ticket |
| GET | `/admin/queue` | Admin review queue |
| PATCH | `/admin/answers/:id/approve` | Approve answer |
| PATCH | `/admin/answers/:id/reject` | Reject answer |

### AI Endpoints (internal)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/duplicate-check` | Check question for duplicates |
| POST | `/ai/moderate` | Run moderation on content |
| POST | `/ai/generate-answer` | Generate collective answer |

---

## Security & Moderation

- **Authentication:** JWT-based auth on all protected routes
- **Role-based access control:** Student / Admin
- **AI moderation:** Every question and answer passes through spam/toxicity detection before publication
- **Admin review gate:** AI-generated answers and flagged content require human approval before going live
- **File uploads:** Validated and scoped to Cloudinary; no direct server storage

---

## Scalability Notes

- **Notification service** is pluggable — swap or add providers (email, push, in-app) without touching core logic
- **MongoDB Atlas** scales horizontally; index `questions` on `status`, `tags`, and `createdAt` for feed performance
- **AI calls** are async — duplicate detection and moderation should not block the request/response cycle; use a queue (e.g., BullMQ) for heavy AI jobs
- **Cloudinary** handles CDN and transformation out of the box
- **FAQ knowledge base** can be cached (Redis or in-memory) since it's read-heavy and infrequently updated
