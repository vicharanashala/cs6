# AI-Assisted Collaborative FAQ Portal — Product Document (MVP)

---

## Overview

A multi-tenant, AI-assisted FAQ and moderation platform built on the MERN stack. It enables college communities and organizations to collaboratively build a structured knowledge base — where community answers are refined through AI moderation and admin review, and eventually promoted into permanent FAQs.

**Final Technical Classification:**
> AI-assisted collaborative FAQ and moderation platform with semantic search and workflow-driven moderation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT + bcrypt |
| AI / Search | Fuse.js |
| File Uploads | Cloudinary |

---

## System Architecture

```
React Frontend
      │
      ▼
Express API Layer
  ┌───┴──────────────────────────────────┐
  │         │            │               │
Auth   Question &    AI Services    Moderation
       Answer
  └───┬──────────────────────────────────┘
      │
      ▼
 MongoDB Atlas
```

Four core service modules sit behind the Express API layer — Authentication, Question & Answer, AI Services, and Moderation — all persisting to a single MongoDB Atlas instance.

---

## Data Model

```
Categories
  └── Questions
        ├── Tags
        ├── Views / Status
        └── Answers (many)
              └── Best Answer → FAQ
```

- Questions and FAQs share the same `Question` collection. A question is promoted to FAQ by setting `isFAQ = true` and linking the approved answer as the final answer.
- Support tickets live in a **separate** `SupportTicket` collection, fully isolated from the FAQ system.
- Database relationship for answers: **One Question → Many Answers**

---

## Complete Question Resolution Workflow

```
User Writes Question
        │
        ▼
AI Duplicate Detection       ← Fuse.js fuzzy match against existing FAQs/questions;
        │                       top similar matches shown to user before submission
        ▼
Question Stored              ← Saved in MongoDB with tags, category, status
        │
        ▼
Community Answers            ← Any authenticated user can submit an answer
        │
        ▼
AI Moderation                ← Toxicity / spam check; flagged content hidden temporarily
        │
        ▼
Admin Review                 ← Moderator approves / rejects / removes from dashboard
        │
        ▼
Best Answer Approved         ← Marked as the verified final answer
        │
        ▼
Converted to FAQ             ← isFAQ = true; approved answer linked; indexed for search
```

---

## User Journeys

Three primary actors interact with the platform: **Regular Users**, **Community Contributors**, and **Admins/Moderators**. Each has a distinct journey.

---

### Journey 1 — New User (Question Seeker)

> **Goal:** Find an answer to a question, or post one if it doesn't exist.

```
1. Land on Home Page
        │
        ▼
2. Search the FAQ / Browse Categories
        │
        ├─── Answer Found ──────────────────────────────────▶ Read FAQ → Done ✓
        │
        └─── No Answer Found
                │
                ▼
        3. Register / Log In
                │
                ▼
        4. Click "Ask a Question"
                │
                ▼
        5. Type Question Draft
                │
                ▼
        6. AI Shows Similar Questions   ← Fuse.js duplicate detection
                │
                ├─── Similar Question Exists ──────────────▶ View existing thread → Done ✓
                │
                └─── No Match
                        │
                        ▼
                7. Add Tags + Category → Submit
                        │
                        ▼
                8. Question Published (status: open)
                        │
                        ▼
                9. Receive Notification when Answer Posted
                        │
                        ▼
                10. Mark Helpful / View Best Answer → Done ✓
```

**Key touchpoints:**
- Search bar on the landing page (first interaction)
- Duplicate-suggestion modal before submission
- Email/in-app notification when their question is answered
- Best answer badge visible on the question thread

---

### Journey 2 — Community Contributor (Answer Provider)

> **Goal:** Browse open questions and contribute answers to help others.

```
1. Log In
        │
        ▼
2. Browse Open Questions Feed
        │
        ▼
3. Select a Question to Answer
        │
        ▼
4. Write and Submit Answer
        │
        ▼
5. AI Moderation Check          ← Toxicity / spam filter runs automatically
        │
        ├─── Flagged ──────────▶ Answer Hidden Temporarily
        │                               │
        │                               ▼
        │                       Moderator Reviews → Approve / Reject
        │
        └─── Passed
                │
                ▼
        6. Admin Verifies the Answer
                │
                ▼
        7. Answer Published (visible to community)
                │
                ▼
        8. Contributor Notified → Profile updated ✓
```

**Key touchpoints:**
- Open questions feed filtered by category/tag
- Answer editor with character limits and formatting
- Notification when their answer is selected as best
- Contributor profile showing approved answers

---

### Journey 3 — Admin / Moderator

> **Goal:** Review flagged content, approve best answers, and promote questions to FAQs.

```
1. Log In (Admin Role)
        │
        ▼
2. Open Moderation Dashboard
        │
        ├─── Flagged Content Queue
        │           │
        │           ▼
        │    Review Flagged Post
        │           │
        │           ├─── Approve  ──▶ Post restored to visible state
        │           ├─── Reject   ──▶ Post removed; user notified
        │           └─── Escalate ──▶ Forwarded to senior admin
        │
        ├─── Answered Questions Queue
        │           │
        │           ▼
        │    Review Answer Submissions
        │           │
        │           └─── Mark Best Answer ──▶ Question status → Resolved
        │
        └─── Resolved Questions Queue
                    │
                    ▼
             Promote to FAQ
                    │
                    ├─── Set isFAQ = true
                    ├─── Link approved answer as final answer
                    └─── FAQ indexed for search ✓
```

**Key touchpoints:**
- Moderation dashboard with priority queue (AI-assigned severity)
- One-click approve / reject / escalate on each flagged item
- FAQ promotion flow directly from the resolved question view
- Audit log of all moderation actions taken

---

### Journey 4 — User Filing a Support Ticket

> **Goal:** Report a sensitive or niche issue that doesn't belong in the public FAQ.

```
1. Log In
        │
        ▼
2. Navigate to Support / Help Section
        │
        ▼
3. Click "Create Support Ticket"
        │
        ▼
4. Fill in Issue Description
        │
        ▼
5. Attach Screenshots (uploaded to Cloudinary)
        │
        ▼
6. Submit Ticket
        │
        ▼
7. Ticket Created in SupportTicket Collection
        │           (isolated from FAQ system)
        ▼
8. Assigned to Moderator
        │
        ▼
9. Moderator Responds / Resolves
        │
        ▼
10. User Notified of Resolution ✓
```

**Key touchpoints:**
- Dedicated support form separate from the question-asking flow
- Cloudinary-powered screenshot upload with preview
- Ticket status tracker (open → in progress → resolved)
- All communication stays private within the ticket thread

---

### Journey 5 — Returning User (Knowledge Browser)

> **Goal:** Quickly look something up without necessarily posting anything.

```
1. Land on Home Page
        │
        ▼
2. Use Search Bar or Browse by Category/Tag
        │
        ▼
3. Find Relevant FAQ or Resolved Question
        │
        ▼
4. Read the Verified Answer
        │
        ├─── Helpful ──▶ Upvote or Share ✓
        │
        └─── Not Helpful ──▶ Report as Outdated / Ask Follow-up Question
```

**Key touchpoints:**
- Fast search with Fuse.js fuzzy matching
- Clear FAQ badge distinguishing verified answers from community answers
- One-click report option if an FAQ seems outdated or incorrect

---

## Features

### 1. Authentication

**Goal:** Allow secure login/register and role-based access control.

**Tech:** JWT, bcrypt, Express middleware, MongoDB

**Implementation:**
1. User submits login/register form from the React frontend
2. Express validates the input
3. Password hashed using bcrypt
4. JWT token generated after successful authentication
5. Token stored in frontend `localStorage`
6. Protected routes use auth middleware to verify the token

**Key APIs:**
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

---

### 2. Question Management

**Goal:** Allow users to ask and browse questions.

**Implementation:**
1. React form sends a `POST` request with the question data
2. Backend validates the question
3. Duplicate detection runs before saving
4. Question saved in MongoDB
5. Dynamic routes fetch question details on the frontend

**Features:**
- Tags
- Status tracking
- Similar questions suggestions

**Key APIs:**
```
POST /api/questions
GET  /api/questions
GET  /api/questions/:id
```

---

### 3. AI Duplicate Detection

**Goal:** Reduce repeated questions.

**Implementation:**
1. User types a question in the form
2. Frontend sends the draft query to the backend
3. Fuse.js compares it against all existing FAQs and questions
4. Backend returns the top similar matches
5. Frontend surfaces suggestions to the user before they submit

**Future upgrade:** Replace Fuse.js with embeddings and vector search for deeper semantic matching.

---

### 4. Answer Management

**Goal:** Allow community-based answering.

**Implementation:**
1. User submits an answer linked to a `questionId`
2. Answer stored in MongoDB with `questionId` reference
3. AI moderation checks for spam/toxicity
4. Moderator/admin verifies the answer
5. Approved answer marked as the best answer

**Database relationship:** One Question → Many Answers

---

### 5. Moderation System

**Goal:** Maintain content quality and remove abuse.

**Implementation:**
1. AI checks every submission for toxicity and spam
2. Flagged content hidden temporarily from public view
3. Moderator dashboard displays all flagged posts for review
4. Admin can approve, reject, or remove flagged content

**Content states:**
```
visible → flagged → under_review → rejected
                                 → approved
```

---

### 6. FAQ Conversion

**Goal:** Convert verified answers into structured, permanent FAQs.

**Implementation:**
1. Admin selects the best answer on a resolved question
2. Question marked as `isFAQ = true`
3. Approved answer linked as the final answer
4. FAQ indexed for future search discovery

**Architecture decision:** The same `Question` collection is reused for FAQs — no separate FAQ collection is needed.

---

### 7. Search

**Goal:** Fast FAQ and question discovery across the platform.

**Implementation:**
1. MongoDB text indexes enable keyword-based search
2. Filters applied by tags and keywords
3. Fuse.js used for fuzzy/semantic matching on top of keyword results

---

### 8. Report System

**Goal:** Allow users to report spam or irrelevant content.

**Implementation:**
1. User clicks the report button on a post
2. Report document created and saved in MongoDB
3. AI assigns a priority level to the report
4. Moderator reviews the flagged content
5. Action taken is logged against the report

**Report types:** Spam, abuse, misinformation, irrelevant content

---

### 9. Troubleshooting / Ticketing System

**Goal:** Handle niche or sensitive issues not suitable for the public FAQ system.

**Implementation:**
1. User creates a support ticket with a description of the issue
2. Screenshots uploaded to Cloudinary and attached to the ticket
3. Ticket assigned to a moderator for resolution
4. All ticket discussion remains fully isolated from the FAQ workflow

**Architecture:** Separate `SupportTicket` collection — no overlap with questions, answers, or FAQs.

---

## Development Order

| Step | Task |
|---|---|
| 1 | Project setup |
| 2 | MongoDB connection |
| 3 | Authentication |
| 4 | Question CRUD |
| 5 | Answer system |
| 6 | Admin moderation dashboard |
| 7 | FAQ conversion |
| 8 | Search + duplicate detection (Fuse.js) |
| 9 | Reports |
| 10 | UI optimization |
| 11 | Deployment |