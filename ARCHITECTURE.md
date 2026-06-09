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

A community-driven FAQ platform where students can post questions, community members can contribute answers, and admins curate a growing knowledge base. AI augments the platform at key points — detecting duplicates and moderating content.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| File Storage | Cloudinary |
| External AI | Google Gemini |
| API Layer | REST API |

---

## High-Level Architecture

```
Users (Students / Moderators / Admins / Superadmins)
        │
        ▼
  [Frontend — React]
        │
        ▼
  [REST API]
        │
        ┌────┴────┐
        ▼         ▼
 [Backend]  [AI Service Layer]
    │              │
    ├── Auth & User Management
    ├── Question Management     ◄──── Duplicate Detection (MongoDB Atlas Vector Search)
    ├── Answer Management       ◄──── Similar FAQ / Question Finder
    ├── FAQ Management          ◄──── Spam / Abuse Detection (Toxicity Check)
    ├── Admin & Review Mgmt
    ├── File Upload Service
    └── Notification (Pluggable)
         │
    ┌────┴──────────┐
    ▼               ▼
 [MongoDB Atlas]  [Cloudinary]   [Gemini AI]
```

---

## Frontend

Built with **React**. Serves user roles: `user` (Student), `moderator`, `admin`, and `superadmin`.

**Student / Guest-facing views:**
- FAQ Browse & Search (by keyword / category)
- Ask Question
- Questions Feed (open, unanswered questions)
- Answer Question
- Troubleshooting (niche issue reporting)

**Moderator / Admin / Superadmin-facing views:**
- Admin/Moderator Dashboard
- Review & Approval queue (moderation of answers and reports)
- User and category management controls

---

## Backend

Built with **Node.js + Express**. Exposes a RESTful API consumed by the frontend.

### Modules

**Auth & User Management**
- Registration, login, session/token management (JWT)
- Role-based access: `user` (Student), `moderator`, `admin`, and `superadmin`

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
- Review queue for flagged content and reported questions/answers
- Approve / reject answers and questions
- Mark best answers

**File Upload Service**
- Upload images/screenshots via Cloudinary or local temporary directories (with ClamAV antivirus TCP scanning)
- Attach files to questions or troubleshooting tickets

**Notification Service** *(Pluggable)*
- Notify users on answer, moderation decision, or ticket update
- Pluggable: supports email, in-app, or push (configurable)

---

## AI Service Layer

Integrates with **Google Gemini** (embeddings generation via `text-embedding-004`) and **MongoDB Atlas Vector Search**. Runs automatically at defined points in the user journey.

| Feature | Trigger | Behavior |
|---|---|---|
| Duplicate Detection | On question submission | MongoDB Atlas Vector Search across existing questions; shows matches if found |
| Similar FAQ / Question Finder | After duplicate check | Surfaces related FAQs the user may have missed |
| Spam / Abuse Detection | On answer/question submission | Flags content for review or auto-hides |

---

## Database & Storage

### MongoDB Atlas

Primary data store. Collections:

- `users` — profiles, roles, auth tokens, MFA secrets (`user`, `moderator`, `admin`, `superadmin`)
- `questions` — content, tags, status, author, timestamps
- `answers` — content, question ref, author, moderation status, votes
- `faqs` — approved knowledge base entries (promoted questions with linked best answer)
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
2. Login / Sign Up (Optionally configure Multi-Factor Authentication)
        │
3. Post Question
        │
4. AI Duplicate Detection (MongoDB Atlas Vector Search check)
   ├── Yes → Show Similar FAQ / Question
   │         User Chooses: [Cancel] or [Continue]
   └── No  → Continue
        │
5. Question Added to Unresolved Queue
        │
6. Community Answers Collected
        │
7. AI Moderation (Spam / Toxicity Check via toxic-bert)
   ├── Pass → Valid Answer visible to student
   └── Flagged → Hidden / Sent for Review
        │
8. Admin/Moderator Review & Approval
   ├── Approve → Final Answer delivered to student / Promoted to FAQ Base
   └── Reject  → Removed from queue
        │
9. Answer added to FAQ Knowledge Base
```

---

### Journey 2: Student (Answer Provider)

**Goal:** Browse open questions and contribute answers to help others.

```
1. Log In (OTP validation if MFA is enabled)
        │
2. Browse Open Questions Feed
        │
3. Select a Question to Answer
        │
4. Write and Submit Answer
        │
5. AI Moderation Check  ← toxicity & spam filters run automatically
   ├── Flagged → Answer Hidden Temporarily
   │             │
   │             ▼
   │         Moderator / Admin Reviews → Approve / Reject
   └── Passed
        │
6. Answer Published (visible to community in open questions detail view)
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
2. Upload Screenshots (Scanned for viruses via ClamAV)
        │
3. Discussion & Back-and-Forth (with Moderator/Admin/Support)
        │
4. Support Responds
        │
5. Issue Resolved ✓ → Ticket Closed (not promoted to public FAQ database)
```

---

## API Design

Base path: `/api`

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user profile |
| POST | `/auth/login` | Login, returns JWT (starts MFA flow if enabled) |
| POST | `/auth/login/mfa` | Submit TOTP MFA token |
| POST | `/auth/mfa/setup` | Generate TOTP MFA secret and QR code |
| POST | `/auth/mfa/verify` | Verify OTP token and enable MFA |
| POST | `/auth/mfa/disable` | Disable MFA for user |
| GET | `/questions` | List questions (supports cursor pagination and sorting) |
| POST | `/questions` | Submit new community question |
| GET | `/questions/:id` | Get question detail with answers |
| POST | `/questions/:id/answers` | Submit answer to question |
| GET | `/questions/faqs` | Browse official FAQ database |
| GET | `/cohort-pulse` | Fetch cohort lifecycle phase analytics (Trending FAQs, Rising Issues) |
| POST | `/tickets` | Submit new troubleshooting ticket |
| GET | `/moderation/queue` | Retrieve moderation review queue |
| PATCH | `/moderation/:targetId/approve` | Approve answer/content |
| PATCH | `/moderation/:targetId/reject` | Reject answer/content |

### AI Endpoints (internal checks)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/questions/duplicates` | Check title and body similarity against existing question embeddings |

---

## Security & Moderation

- **Authentication:** JWT-based stateless session management with access/refresh tokens.
- **Multi-Factor Authentication (MFA):** Secondary verification using standard TOTP algorithms with AES-256 encrypted database secrets.
- **Account Lockout Policy:** Protects against brute-force login attempts (account locks for 30 minutes after 5 consecutive failures).
- **Cross-Origin & CSRF Protections:** Double-submit cookie pattern validation for all state-changing endpoints alongside CORS credentials configuration.
- **Role-based Access Control:** Restrictions mapped to standard database roles: `user` (Student), `moderator`, `admin`, and `superadmin`.
- **AI Moderation Gate:** Automatic toxic language filters (toxic-bert) scan questions and answers before publication.
- **Content Sanitization:** Markdown and input HTML fields are sanitized against Cross-Site Scripting (XSS) injections using DOMPurify.
- **File Upload Protection:** Direct stream scanning of file uploads via TCP sockets connected to ClamAV daemon hosts to block malware distribution.

---

## Scalability Notes

- **Notification service** is pluggable — swap or add providers (email, push, in-app) without touching core logic.
- **MongoDB Atlas** scales horizontally; indexing is defined on `lifecycleBucket`, `status`, `category`, `isFAQ`, and `createdAt` to secure feed query efficiency.
- **AI calls** are modularized — embeddings search pipelines run directly inside MongoDB via Atlas Vector Search, minimizing external API dependencies.
- **Cloudinary** handles image delivery and transformations out of the box.
- **FAQ knowledge base** is read-heavy and cached locally/internally to optimize high deflection retrieval speeds.
