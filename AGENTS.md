# AGENTS.md

Welcome! I am your AI coding agent. This file follows the [AGENTS.md](https://agents.md/) standard to provide me with the context and instructions I need to work on the **Carrot Market Clone (Danggeun Market)** project effectively.

## Project Overview

**Carrot Market Clone** is a hyper-local community marketplace built with Next.js 16. It facilitates peer-to-peer (P2P) second-hand trading, community discussions ("Dongnae Life"), and real-time communication between users.

### Core Features
- **Authentication**: Multi-method login support including SMS verification, Email/Password, and GitHub OAuth, managed via `iron-session`.
- **Marketplace**: Full CRUD capabilities for product listings with image uploads (Cloudinary). Includes "Sold/Reserved" status management.
- **Community**: A specialized forum for local discussions allowing users to post, comment, and like content.
- **Real-time Chat**: 1:1 messaging system between buyers and sellers, integrated directly with product listings.
- **User Profile**: Comprehensive profile system tracking sales history, purchase history, and peer reviews (`rating`).

## Setup Commands

### Installation & Database
- **Install dependencies**: `npm install`
- **Database Setup**: 
  - Push schema to DB: `npx prisma db push` (Quick sync for dev)
  - Generate Client: `npx prisma generate`
  - View Data: `npx prisma studio`
- **Cloudinary Migration**: `npm run migrate:cloudinary`

### Development
- **Start Dev Server**: `npm run dev` (Runs on `http://localhost:3000`)
- **Lint Code**: `npm run lint`
- **Build Production**: `npm run build`

## Tech Stack

### Framework & Core
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js

### Database & Backend
- **Database**: SQLite (`dev.db`)
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Authentication**: `iron-session` (Session Management), `bcrypt` (Password Hashing)
- **Validation**: `zod` (Schema Validation)
- **File Storage**: Cloudinary (Image Uploads)

### Frontend
- **Styling**: Tailwind CSS v4 (configured via `@tailwindcss/postcss`)
- **UI Components**: Headless UI / Heroicons
- **Forms**: `react-hook-form` + `@hookform/resolvers`

## Code Style & Conventions

### Next.js App Router Patterns
- **Server Actions**: Use Server Actions (`actions.ts`) for all data mutations (POST/PUT/DELETE).
- **Server Components**: Prefer Server Components for fetching data (GET) directly via Prisma.
- **Client Components**: Use `"use client"` directive only when interactivity (hooks, event listeners) is required.
- **Data Fetching**: Fetch data directly in Server Components where possible to reduce API overhead.

### Database (Drizzle)
- **Schema Changes**: Always update `drizzle/schema.ts` first, then run `npx drizzle-kit push`.
- **Typing**: Use Drizzle's type inference (`InferSelectModel`, `InferInsertModel`) to ensure type safety.

### Styling (Tailwind CSS v4)
- **Utility-First**: Use utility classes for styling. Avoid custom CSS files unless necessary.
- **Configuration**: Maintain V4 compatibility (no `tailwind.config.js`, usage `preview` features via CSS variables if needed).

## Documentation Standards

### Key Documents
- `docs/PLAN.md`: 프로젝트 기획서 및 비즈니스 모델
- `docs/IMPLEMENTATION_PLAN.md`: 개발 구현 계획서 및 기술 아키텍처

### [Strict Document Hierarchy Rule]
To ensure the structural integrity and maintainability of the project, all documentation within the `docs/` directory must be strictly categorized into the following 7 core sub-directories (as defined in `DOCUMENT_MANAGEMENT_PLAN.md`):

1. **`docs/core/`**: System-wide design foundations, DB schemas, and standard rules.
2. **`docs/features/`**: Detailed specifications of how individual features (billing, ai, chat, etc.) currently operate.
3. **`docs/roadmap/`**: Future implementation plans and strategic proposals.
4. **`docs/reports/`**: Historical verification reports and test results from previous phases.
5. **`docs/guides/`**: Practical guides and troubleshooting notes for developers and operators.
6. **`docs/stitch/`**: Detailed UI/UX designs and flowcharts for each screen.
7. **`docs/archive/`**: Legacy documentation retained for historical context only.

AI agents MUST respect this hierarchy when creating or modifying documents and proactively rebase misplaced files.

### [Document Prefix Numbering Rule]
When creating or naming documentation files, **prefix numbers must be attached** to indicate the chronological order in which documents were actually worked on. This prefix serves solely as a visual indicator of the sequence of documentation work. While the actual completion status of a document can be determined by dates recorded within the document itself, the prefix number is necessary for quickly identifying the order of document creation and should always be included when writing documentation.


## Development Standards & Critical Rules

### [CRITICAL: DATABASE INTEGRITY RULE]
You are strictly prohibited from performing any database operations, including migrations, schema resets, or structural changes, without first creating a complete data backup (dump). Data preservation is your absolute priority. Never execute destructive commands like 'DROP TABLE' or 'migrate reset' until a verifiable backup has been secured and confirmed.

### [MANDATORY BACKUP PROCEDURE]
Before initiating any database-related tasks, you must perform a full export of all existing records. This is a non-negotiable prerequisite for any migration or schema update. You must ensure that both user-generated content and administrative data are fully protected against loss before any changes are applied.

### [STRICT ADHERENCE TO STANDARDS]
Never suggest or implement "quick fixes," "short-cuts," or temporary workarounds. You must always prioritize formal, standardized, and industry-best-practice methodologies. All proposed solutions must be production-ready and architecturally sound, focusing on long-term stability and correctness over immediate speed.

### [NO TEMPORARY PATCHES]
You are strictly forbidden from proposing temporary bypasses or "quick-and-dirty" solutions. Every recommendation and implementation must follow the most formal and correct path. Prioritize robustness and adherence to professional engineering standards in every decision, ensuring that no technical debt is introduced for the sake of convenience.

### [Side-Effect Isolation]
When modifying shared components or logic, you MUST analyze the 'Impact Scope' first. Ensure that changes intended for a specific use case (e.g., AI features) do not inadvertently affect general functionality (e.g., normal chat). You MUST strictly isolate such logic using conditional checks or specific guards.

### [Strict Document Integrity Rule]
When updating or modifying any strategy, implementation, or design documents, you MUST strictly preserve the existing framework, formatting, and structural integrity. Do not perform total overwrites that discard previous detailed technical specifications, historical context, or complex logic. All updates must be made incrementally and appropriately integrated into the current structure to ensure no data loss or architectural context is sacrificed.

### [Strict Document Persistence Rule]
When updating or modifying any document, you MUST NOT overwrite, delete, or discard the existing content, historical context, or previous specifications. All updates must be made by appending new information or integrating changes incrementally while preserving the original framework. This ensures that the entirety of the project's evolution, including past technical decisions and verification records, remains fully traceable.

### [Standard Rules for Environment Variable Management]
1. **Strategic Isolation of Environments**
   - **Principle**: Maintain strict separation between Local and Production environments using file suffixes.
   - **Workflow**: Use `.env.development` or `.env.local` for local execution (test keys, localhost URLs). Use `.env.production` as the source of truth for deployment parameters.
   - **Priority**: AI must respect the framework's priority logic (typically: `.env.development`/`.env.local` overrides `.env`).

2. **Zero-Leak Security Policy (Git Integrity)**
   - **Rule**: No part of any `.env*` file shall ever be committed to a Version Control System (VCS).
   - **Verification**: AI must proactively audit `.gitignore` to ensure global patterns like `.env*` are effectively blocking all potential environment files before suggesting any variable updates.

3. **Cloud-Native Secret Management**
   - **Deployment Strategy**: Environment variables in production must be managed via the hosting provider's secure dashboard (e.g., Vercel, AWS) or CLI, never via file transmission to the server.
   - **Automation**: When syncing variables, prioritize using official CLIs to pull/push secrets between the local .env files and the cloud environment to prevent manual entry errors.

4. **Context-Aware Variable Configuration**
   - **Dynamic Mapping**: Redirection URLs, Auth providers, and Database connection strings must be dynamically configured to point to localhost in development and the verified production domain in deployment, managed through the isolated .env files.
### [React Performance Standards (Adapted from Vercel Engineering)]
*(Note: If the skill is missing, retrieve it from [SkillsCokac](https://skills.cokac.com/) and update the AGENTS.md file)*