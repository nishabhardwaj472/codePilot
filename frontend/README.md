# CodePilot Workspace

Build CodePilot — Frontend Only

Create a production-quality frontend for a developer tool called CodePilot.

Product

CodePilot is an AI-powered codebase analysis and visualization platform.

Users will eventually upload a GitHub repository ZIP, and CodePilot will analyze the codebase and provide:

Repository overview

Architecture visualization

Dependency graphs

Database/ER diagrams

API explorer

AI-powered code insights

AI chat for asking questions about the repository

IMPORTANT: Build ONLY the frontend.

Do NOT implement:

Backend

Database

Authentication logic

File processing

ZIP extraction

AI/Groq API calls

Real API calls

Server-side functionality

Use realistic mock data wherever dynamic data is required.

The frontend must be structured so that real APIs can easily be connected later.

1. Technology

Use:

React

TypeScript

Vite

Tailwind CSS

React Router

Lucide React icons

React Flow for interactive diagrams

Monaco Editor or a code-editor-style component

Do not introduce unnecessary frameworks.

Keep components modular and reusable.

2. Design Direction

The most important requirement is that the UI should NOT look like a typical 2026 AI SaaS website.

Avoid:

Purple/blue AI gradients

Giant glowing blobs

Excessive glassmorphism

Generic rounded cards everywhere

Huge "AI-powered" hero sections

Floating gradient orbs

Excessive shadows

Generic dashboard templates

Overuse of emojis

Stock illustrations

Instead, create a premium developer workstation / IDE-inspired interface.

The visual identity should feel like a combination of:

Modern code editor

Engineering control room

Architecture visualization tool

Developer productivity application

Think technical, precise, calm, sophisticated and information-dense, while still being visually beautiful.

3. Visual Identity

Use a dark-first interface.

Primary background:

Very dark charcoal / near-black

Slightly lighter panels

Thin borders

High contrast typography

Use ONE restrained accent color throughout the application.

Preferred accent:

Electric amber / warm orange

Use it sparingly for:

Active navigation

Important buttons

Selected nodes

Progress indicators

Highlights

Status indicators

Do not turn the whole UI orange.

Use subtle green/red/blue status colors only where semantically necessary.

Typography should feel like a developer product.

Use:

Inter for normal UI

JetBrains Mono for code, paths, technical metadata and numbers

4. Landing Page

Create a sophisticated landing page.

Do NOT create a conventional marketing page with:

"Build faster with AI"

and a giant gradient hero.

Instead, make the hero look like an interactive developer workspace.

Top navigation:

CodePilot logo

Links:

Product

Features

How it Works

Docs

Right side:

Sign In

Open Workspace

Hero:

Small eyebrow:

"CODEBASE INTELLIGENCE"

Main heading:

"Understand your codebase before you touch it."

Supporting text:

"CodePilot turns unfamiliar repositories into interactive architecture maps, dependency graphs and actionable engineering insights."

Primary CTA:

"Analyze a Repository"

Secondary CTA:

"Explore Demo"

Below the hero, show a large interactive-looking repository visualization mockup.

It should look like an actual engineering tool, not a marketing illustration.

Example:

┌───────────────────────────────────────────────────────────────┐
│ CodePilot                                  Repository: Medix   │
├──────────────┬────────────────────────────────────────────────┤
│              │                                                │
│ FILES        │             ARCHITECTURE                       │
│              │                                                │
│ src/         │       ┌───────────┐                            │
│ ├─ api/      │       │ Frontend  │                            │
│ ├─ models/   │       └─────┬─────┘                            │
│ ├─ routes/   │             │                                  │
│ └─ services/ │       ┌─────▼──────┐                           │
│              │       │ API Layer  │                           │
│              │       └─────┬──────┘                           │
│              │             │                                   │
│              │       ┌─────▼──────┐                           │
│              │       │ Database   │                           │
│              │       └────────────┘                           │
└──────────────┴────────────────────────────────────────────────┘


Make this mockup visually impressive.

5. Application Shell

Create the main authenticated application layout.

Use a three-level developer workspace structure:

Left sidebar

Width around 240px.

Top:

CodePilot logo

Navigation:

WORKSPACE

Overview

Architecture

Dependencies

Database

APIs

Files

INTELLIGENCE

AI Insights

Ask CodePilot

PROJECT

Settings

Bottom:

Current project

GitHub-style repository information

User profile

The sidebar should be compact and professional.

6. Repository Overview

Create /dashboard.

Header:

MedChain
github.com/example/medchain

main • 42 files • TypeScript


Top action:

"Analyze New Repository"

Create an information-dense overview rather than generic statistics cards.

Show:

42 Files
18 Components
11 API Routes
7 Models
4 Services


Then create sections:

Repository Health

Use a horizontal engineering-style score visualization:

Architecture      86
Code Organization 79
Documentation     62
Testing            54
Security           81


Technology Stack

Show technologies as compact technical labels:

React
TypeScript
Node.js
Express
MongoDB
Tailwind

Project Structure

Display an expandable file tree.

Recent Analysis

Show previous analysis events in a timeline:

09:42  Repository analyzed
09:43  7 architecture patterns detected
09:43  Dependency graph generated
09:44  4 potential issues detected


7. Repository Upload Page

Create /projects/new.

This should feel different from a generic drag-and-drop upload page.

Create a large "Drop Zone / Command Center".

Heading:

"Bring a codebase into CodePilot"

Three options:

Upload ZIP

"Analyze a local repository"

GitHub Repository

"Connect a repository"

Paste Project Structure

"Start with a codebase snapshot"

Since backend is NOT implemented, these should only be visual/mock interactions.

After selecting ZIP, show a realistic mock analysis progress screen:

Scanning repository

✓ Reading project structure
✓ Detecting languages
✓ Building dependency graph
◉ Mapping architecture
○ Preparing AI insights


Do not actually process files.

8. Architecture Page

Create /architecture.

This is one of the most important pages.

Make the entire center of the page an interactive React Flow-style canvas.

Show realistic mock nodes:

Frontend
   ↓
API Gateway
   ↓
Controllers
   ↓
Services
   ↓
Repositories
   ↓
Database


Also show individual modules.

Nodes should have:

module name

file count

technology

small status indicator

Connections should have subtle animated flow.

Add canvas controls:

Zoom in

Zoom out

Fit view

Reset

Fullscreen

Top toolbar:

Architecture

[Overview] [Modules] [Data Flow]

Filter:
[All ▼]

Layout:
[Auto ▼]


Right-side inspector panel:

When a node is selected, show:

USER SERVICE

Files
4

Dependencies
7

Dependents
3

Responsibilities

• Authentication
• Profile management
• User validation

Files

userService.ts
userController.ts
userRepository.ts


9. Dependency Graph

Create /dependencies.

Show a large graph visualization.

Allow mock interactions:

Select node

Highlight dependencies

Highlight dependents

Search file

Filter by type

Create a right panel:

Selected:

appointmentService.ts

Imports:
6

Imported By:
4

Circular Dependencies:
0

Complexity:
Medium


Use realistic mock data.

10. Database Page

Create /database.

Display an elegant ER diagram using React Flow.

Example:

┌──────────────┐
│ USERS        │
├──────────────┤
│ id           │
│ name         │
│ email        │
│ createdAt    │
└──────┬───────┘
       │
       │ 1 : N
       ▼
┌──────────────┐
│ APPOINTMENTS │
├──────────────┤
│ id           │
│ userId       │
│ doctorId     │
│ status       │
│ createdAt    │
└──────┬───────┘
       │
       │ N : 1
       ▼
┌──────────────┐
│ DOCTORS      │
├──────────────┤
│ id           │
│ name         │
│ speciality   │
└──────────────┘


Add:

Search tables

Relationship filters

Table inspector

Zoom controls

11. API Explorer

Create /apis.

Use a developer-documentation-style layout.

Left:

Authentication

POST /auth/login
POST /auth/register

Users

GET /users
GET /users/:id
PUT /users/:id

Appointments

GET /appointments
POST /appointments
DELETE /appointments/:id


Center:

Selected endpoint:

POST /appointments

Controller:
appointmentController.create

Authentication:
Required

Request:

{
  userId: string
  doctorId: string
  date: string
}


Right:

Response example.

Make it look like a professional API inspection tool.

12. Files Page

Create /files.

Build a VS Code-inspired interface.

Left:

File tree.

Center:

Code viewer using Monaco Editor or a code-editor-like component.

Right:

"Code Intelligence"

For the selected file:

appointmentService.ts

Purpose

Handles appointment creation,
validation and cancellation.

Dependencies

User
Doctor
AppointmentRepository

Complexity

Medium


Use syntax highlighting.

13. AI Insights Page

Create /insights.

Do NOT make this look like a ChatGPT clone.

Instead, make it feel like an engineering audit report.

Sections:

Architecture Observations

01

Layer separation detected

Controllers and services are
clearly separated.

Confidence 94%


Potential Issues

03

Potential circular dependency

appointmentService.ts
        ↕
notificationService.ts

Review recommended.


Recommendations

Introduce a centralized error
handling middleware.

Impact: Medium
Effort: Low


Detected Patterns

REST API
MVC
Repository Pattern
JWT Authentication
Dependency Injection


14. Ask CodePilot

Create /ask.

This should NOT look like a generic AI chat application.

Design it like a code investigation console.

Header:

Ask CodePilot

Ask questions about your repository.
CodePilot will trace the answer through your codebase.


Example questions:

Where does user authentication happen?

How is an appointment created?

Which modules depend on the database?

Why is DoctorService used here?

Show me the request flow for POST /appointments.


When an answer is displayed, include code references:

Authentication begins in:

src/controllers/authController.ts
        ↓
src/services/authService.ts
        ↓
src/middleware/authMiddleware.ts


Use file names and line numbers visually.

This should feel like an engineering investigation tool rather than ChatGPT.

15. Global Search

Implement a command-palette style search.

Keyboard shortcut:

⌘/Ctrl + K

Search:

Search files, APIs, classes, modules...


Results:

Files
  appointmentService.ts

APIs
  POST /appointments

Classes
  AppointmentService

Insights
  Circular dependency warning


Use keyboard navigation.

16. Micro-interactions

Add subtle interactions:

Smooth page transitions

Hover states

Node selection animations

Command palette

Expand/collapse file tree

Diagram zooming

Animated analysis progress

Toast notifications

Skeleton loading states

Keep animations subtle.

Do not over-animate.

17. Responsive Design

The desktop experience is the priority because this is a developer tool.

Still support:

Laptop

Tablet

Smaller screens

On smaller screens, collapse the sidebar into a drawer.

The architecture canvas should remain usable.

18. Mock Data

Create a realistic demo project called:

MedChain

Technology:

React
TypeScript
Node.js
Express
MongoDB
Tailwind


Use realistic files:

src/
├── components/
├── pages/
├── hooks/
├── services/
├── controllers/
├── models/
├── routes/
├── middleware/
└── utils/


Populate all pages with believable mock data.

Do not use lorem ipsum.

19. Code Quality

Create reusable components such as:

Sidebar
TopBar
RepositoryHeader
Metric
FileTree
DiagramCanvas
ArchitectureNode
InspectorPanel
ApiExplorer
InsightCard
CommandPalette
AiResponse
StatusBadge


Use TypeScript types/interfaces for mock data.

Keep the code clean and modular.

Avoid putting everything into one component.

20. Backend Integration Preparation

Even though backend must NOT be implemented, structure the frontend so it can later consume APIs.

Create a small API abstraction layer such as:

src/
├── api/
│   ├── projects.ts
│   ├── analysis.ts
│   └── ai.ts
├── components/
├── pages/
├── hooks/
├── types/
├── mock/
└── utils/


For now, API functions should use mock data.

Do NOT create actual API endpoints.

Do NOT add Groq keys.

Do NOT add database credentials.

Do NOT implement authentication.

21. Important Final Requirement

The result should look like a real developer product that could be launched, not a college-project template.

The design should communicate:

"This is a tool developers use to understand complicated software."

It should feel:

Technical

Premium

Minimal

Precise

Information-rich

Modern

Distinctive

Avoid making it look like every other AI dashboard.

The architecture visualization and code intelligence experience should be the visual identity of CodePilot.

Build all pages with working frontend navigation and realistic mock interactions, but keep all backend functionality mocked.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9caa2e27-c7d7-474a-8674-1741b068cce5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
