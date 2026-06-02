# OruLabs: Production-Ready Tech Stack & Implementation Blueprint

## Part 1: The Winning Tech Stack

Based on your PRD requirements—real-time WebSocket synchronization, multi-tenant architecture, role-based access control, and Google SSO integration—here's the stack optimized for scalability and developer velocity:

### **Frontend Stack**
- **Framework**: Next.js 15 (App Router) with React 19
- **Real-Time State**: TanStack Query v5 + Zustand (for local state) + Socket.IO client
- **UI Components**: Shadcn/ui with Tailwind CSS 4
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Charts/Data Viz**: Recharts (lightweight, real-time friendly)

**Why this combination:**
- Next.js provides server-side rendering, API routes, and edge middleware for workspace isolation
- TanStack Query handles async data sync without Redux boilerplate
- Zustand keeps live UI state (participant avatars, active module) fast and predictable
- Shadcn/ui ensures Material Design–inspired aesthetics without bloat
- Socket.IO client integrates seamlessly with the backend

### **Backend Stack**
- **Runtime**: Node.js 22.x with Bun (package manager + test runner)
- **Framework**: Hono.js (ultra-lightweight, perfect for monolithic + API patterns)
- **Real-Time Engine**: Socket.IO v4 on Hono with custom adapters
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Cache/Sessions**: Redis 7.x (for live state, session management, WebSocket scaling)
- **Authentication**: Better Auth (supports Google OAuth 2.0 + JWT tokens)
- **File Storage**: Cloudflare R2 (for training recordings, exported CSVs)
- **Email**: Resend (for training invitations, session digests)
- **Async Jobs**: BullMQ (for post-session analytics, CSV exports)
- **Deployment**: Hostinger VPS or Railway.app for easy Docker scaling

**Why Hono + Bun over Express/Nest:**
- Hono is 50% faster on concurrent connections than Express
- Built-in middleware for CORS, compression, rate limiting
- Type-safe route definitions (TypeScript-first)
- Bun is 3x faster at startup and test execution than Node
- Minimal boilerplate—pure focus on business logic

### **Database Schema (PostgreSQL + Drizzle ORM)**

Your core tables:

```
Users
├─ id (PK)
├─ email (UNIQUE)
├─ name
├─ avatar_url
├─ auth_provider (google)
├─ created_at
└─ updated_at

Workspaces
├─ id (PK)
├─ name
├─ owner_id (FK → Users)
├─ created_at
└─ settings (JSONB)

WorkspaceMembers
├─ workspace_id (FK)
├─ user_id (FK)
├─ role (owner | member)
├─ joined_at
└─ (PK: workspace_id + user_id)

Trainings
├─ id (PK)
├─ workspace_id (FK)
├─ title
├─ category (atl | maker_space | ict_cal)
├─ description
├─ scheduled_at
├─ current_active_module_id (FK → TrainingModules, nullable)
├─ session_status (draft | live | completed)
├─ join_token (UNIQUE)
├─ created_by (FK → Users)
├─ created_at
└─ updated_at

TrainingFacilitators
├─ training_id (FK)
├─ user_id (FK)
├─ role (lead_trainer | full_editor | partial_editor | facilitation_support)
├─ assigned_modules (TEXT[] for partial editors)
└─ (PK: training_id + user_id)

TrainingParticipants
├─ training_id (FK)
├─ user_id (FK)
├─ joined_at
├─ connection_status (online | offline)
├─ last_heartbeat
└─ (PK: training_id + user_id)

TrainingModules
├─ id (PK)
├─ training_id (FK)
├─ title
├─ module_type (quiz | whiteboard | reflection | matrix | custom)
├─ position (for ordering)
├─ is_unlocked (boolean, default false)
├─ is_always_on (boolean, default false)
├─ config (JSONB: tool-specific settings)
├─ created_at
└─ updated_at

ParticipantResponses
├─ id (PK)
├─ training_id (FK)
├─ module_id (FK)
├─ user_id (FK)
├─ response_data (JSONB)
├─ submitted_at
└─ indexed on (training_id, module_id, user_id)

TrainingAnalytics
├─ training_id (PK/FK)
├─ total_participants
├─ avg_completion_time
├─ attendance_log (JSONB: timeline)
├─ quiz_aggregates (JSONB)
└─ created_at
```

---

## Part 2: Directory Structure & Project Layout

```
OruLabs/
├── monorepo.json                    # Workspace configuration
├── .env.local                       # Local secrets (gitignored)
├── .env.example                     # Template for secrets
├── docker-compose.yml               # PostgreSQL, Redis, MailHog for local dev
│
├── apps/
│   ├── web/                         # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/              # Auth group routes
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── callback/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   │   ├── layout.tsx       # RoleGate middleware
│   │   │   │   ├── workspaces/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── page.tsx           # Workspace home
│   │   │   │   │   │   └── settings/page.tsx  # Workspace admin
│   │   │   │   │   └── new/page.tsx
│   │   │   │   └── trainings/
│   │   │   │       ├── [id]/
│   │   │   │       │   ├── studio/            # Canvas Builder
│   │   │   │       │   │   ├── page.tsx       # Agenda co-creation
│   │   │   │       │   │   ├── components/
│   │   │   │       │   │   │   ├── ModuleCard.tsx
│   │   │   │       │   │   │   ├── DragDropZone.tsx
│   │   │   │       │   │   │   └── ToolLibraryPanel.tsx
│   │   │   │       │   │   └── utils/moduleDragLogic.ts
│   │   │   │       │   ├── live/              # Live Training Room
│   │   │   │       │   │   ├── page.tsx
│   │   │   │       │   │   ├── components/
│   │   │   │       │   │   │   ├── ParticipantGrid.tsx
│   │   │   │       │   │   │   ├── AgendaPane.tsx
│   │   │   │       │   │   │   ├── ActiveModuleRenderer.tsx
│   │   │   │       │   │   │   ├── ControlPanel.tsx
│   │   │   │       │   │   │   └── PulseMonitor.tsx
│   │   │   │       │   │   └── hooks/
│   │   │   │       │   │       ├── useWebSocketSync.ts
│   │   │   │       │   │       └── useLiveModuleState.ts
│   │   │   │       │   ├── analytics/page.tsx # Post-session review
│   │   │   │       │   └── settings/page.tsx
│   │   │   │       └── new/page.tsx
│   │   │   ├── join/
│   │   │   │   └── [token]/page.tsx           # Public join link
│   │   │   ├── error.tsx
│   │   │   ├── not-found.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── RoleGate.tsx                # Permission enforcement
│   │   │   │   └── WorkspaceSelector.tsx
│   │   │   ├── tools/                          # Reusable tool templates
│   │   │   │   ├── QuizRenderer.tsx
│   │   │   │   ├── WhiteboardCanvas.tsx
│   │   │   │   ├── MatrixEditor.tsx
│   │   │   │   ├── ReflectionJournal.tsx
│   │   │   │   ├── StickyNotePad.tsx
│   │   │   │   └── ActivityCardGrid.tsx
│   │   │   └── modals/
│   │   │       ├── CreateWorkspaceModal.tsx
│   │   │       └── InviteTeamModal.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWorkspace.ts
│   │   │   ├── useSocket.ts                   # Socket.IO wrapper
│   │   │   └── useRolePermissions.ts
│   │   ├── lib/
│   │   │   ├── api-client.ts                   # tRPC or axios wrapper
│   │   │   ├── socket.ts                       # Socket.IO initialization
│   │   │   ├── auth.ts                         # JWT + session handling
│   │   │   ├── permissions.ts                  # Role-based access logic
│   │   │   └── validators.ts                   # Zod schemas for forms
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── tailwind.config.ts
│   │   ├── public/
│   │   │   └── assets/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── api/                          # Hono Backend
│       ├── src/
│       │   ├── index.ts              # Hono app entry
│       │   ├── middleware/
│       │   │   ├── auth.ts           # JWT verification + user inject
│       │   │   ├── workspace.ts      # Workspace isolation + tenant detection
│       │   │   ├── roleGuard.ts      # Permission checks
│       │   │   └── errorHandler.ts
│       │   ├── routes/
│       │   │   ├── auth.ts           # POST /api/auth/login, /callback, /logout
│       │   │   ├── workspaces.ts     # CRUD for workspaces
│       │   │   ├── trainings.ts      # CRUD for training sessions
│       │   │   ├── modules.ts        # Module unlock logic, state updates
│       │   │   ├── participants.ts   # Join, leave, attendance tracking
│       │   │   ├── responses.ts      # Quiz/form/whiteboard submissions
│       │   │   ├── analytics.ts      # CSV exports, aggregations
│       │   │   └── templates.ts      # Tool library CRUD
│       │   ├── socket/
│       │   │   ├── handlers.ts       # Event listeners (join, disconnect, etc.)
│       │   │   ├── namespaces.ts     # Per-training WebSocket namespaces
│       │   │   ├── state.ts          # Live room state (in-memory + Redis)
│       │   │   └── broadcasts.ts     # Room-wide notifications
│       │   ├── db/
│       │   │   ├── schema.ts         # Drizzle schema definitions
│       │   │   ├── client.ts         # PostgreSQL connection pool
│       │   │   └── migrations/       # SQL migration files
│       │   ├── services/
│       │   │   ├── auth.service.ts   # Google OAuth, JWT generation
│       │   │   ├── training.service.ts
│       │   │   ├── module.service.ts
│       │   │   ├── participant.service.ts
│       │   │   ├── analytics.service.ts
│       │   │   └── email.service.ts  # Resend integration
│       │   ├── jobs/
│       │   │   ├── exportAnalytics.job.ts
│       │   │   └── sendSessionDigest.job.ts
│       │   ├── utils/
│       │   │   ├── jwt.ts
│       │   │   ├── validators.ts     # Input validation
│       │   │   └── logger.ts
│       │   └── types/
│       │       ├── index.ts          # Shared TypeScript types
│       │       └── socket.ts         # Socket.IO event schemas
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── setup.ts              # Test utilities
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                         # Shared code
│   ├── types/                        # Shared TypeScript definitions
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── training.ts
│   │   └── socket.ts
│   ├── validators/                   # Shared Zod validators
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── training.ts
│   │   └── forms.ts
│   └── utils/                        # Utility functions
│       ├── cn.ts
│       ├── dateFormat.ts
│       └── permissions.ts
│
├── docs/
│   ├── ARCHITECTURE.md               # System design
│   ├── SOCKET_EVENTS.md             # WebSocket protocol
│   ├── API.md                       # REST endpoint spec
│   ├── DEPLOYMENT.md                # VPS, Docker, secrets
│   └── CONTRIBUTING.md
│
├── docker-compose.yml
├── .gitignore
├── .prettierrc
├── .eslintrc.json
├── turbo.json                        # Monorepo task orchestration
└── package.json                      # Root workspace config
```

---

## Part 3: Core Implementation Patterns

### **3.1 Real-Time Sync Engine (The Heart)**

**WebSocket Event Flow:**

```typescript
// Backend: Socket.IO Namespace per Training
io.of('/training/:trainingId').on('connection', (socket) => {
  const { trainingId } = socket.handshake.auth;
  const userId = socket.data.userId; // From JWT middleware
  
  // Participant joins
  socket.on('participant:join', async (data) => {
    await db.insert(TrainingParticipants).values({
      training_id: trainingId,
      user_id: userId,
      joined_at: new Date(),
    });
    
    const currentModule = await db.query.Trainings
      .findFirst({ where: eq(Trainings.id, trainingId) })
      .select({ current_active_module_id: true });
    
    // Inject into live activity
    socket.emit('module:unlock', {
      moduleId: currentModule.current_active_module_id,
      payload: await getModuleState(currentModule.current_active_module_id),
    });
  });
  
  // Trainer unlocks module
  socket.on('module:unlock', async (data) => {
    const { moduleId } = data;
    
    // Check role permission
    const canUnlock = await checkPermission(userId, trainingId, 'unlock_modules');
    if (!canUnlock) throw new Error('Unauthorized');
    
    // Update DB state
    await db.update(Trainings)
      .set({ current_active_module_id: moduleId })
      .where(eq(Trainings.id, trainingId));
    
    // Broadcast to all participants
    io.of(`/training/${trainingId}`).emit('module:unlocked', {
      moduleId,
      payload: await getModuleState(moduleId),
    });
  });
  
  // Participant submits response
  socket.on('response:submit', async (data) => {
    const { moduleId, responseData } = data;
    
    await db.insert(ParticipantResponses).values({
      training_id: trainingId,
      module_id: moduleId,
      user_id: userId,
      response_data: responseData,
      submitted_at: new Date(),
    });
    
    // Aggregate and broadcast to trainer
    const aggregated = await getModuleAggregates(moduleId);
    socket.to(`trainer:${trainingId}`).emit('data:aggregate', aggregated);
  });
  
  socket.on('disconnect', async () => {
    await db.update(TrainingParticipants)
      .set({ connection_status: 'offline', last_heartbeat: new Date() })
      .where(and(
        eq(TrainingParticipants.training_id, trainingId),
        eq(TrainingParticipants.user_id, userId)
      ));
  });
});
```

**Frontend Hook:**

```typescript
// hooks/useSocket.ts
import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAtom } from 'jotai';
import { activeModuleAtom, participantGridAtom } from '@/lib/atoms';

export function useSocket(trainingId: string, token: string) {
  const [activeModule, setActiveModule] = useAtom(activeModuleAtom);
  const [participantGrid, setParticipantGrid] = useAtom(participantGridAtom);
  
  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/training/${trainingId}`, {
      auth: { token, trainingId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    socket.on('module:unlocked', (data) => {
      setActiveModule({ id: data.moduleId, ...data.payload });
    });
    
    socket.on('participant:joined', (data) => {
      setParticipantGrid((prev) => [...prev, data.participant]);
    });
    
    socket.on('data:aggregate', (data) => {
      setActiveModule((prev) => ({ ...prev, aggregateData: data }));
    });
    
    return () => socket.disconnect();
  }, [trainingId, token]);
}
```

### **3.2 Multi-Tenant Isolation (Database Level)**

**Middleware Pattern:**

```typescript
// middleware/workspace.ts
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

export const workspaceTenantMiddleware = (app: Hono) => {
  app.use('*', async (c, next) => {
    // Extract workspace ID from request (header, URL param, or subdomain)
    const workspaceId = c.req.header('X-Workspace-ID') 
      || c.req.query('workspace_id')
      || extractFromSubdomain(c.req.url);
    
    if (!workspaceId) {
      return c.json({ error: 'Missing workspace ID' }, 400);
    }
    
    // Verify user has access to this workspace
    const userId = c.get('userId'); // From JWT middleware
    const membership = await db.query.WorkspaceMembers.findFirst({
      where: and(
        eq(WorkspaceMembers.workspace_id, workspaceId),
        eq(WorkspaceMembers.user_id, userId)
      ),
    });
    
    if (!membership) {
      return c.json({ error: 'Workspace not found' }, 404);
    }
    
    // Attach to context for all downstream handlers
    c.set('workspaceId', workspaceId);
    c.set('userRole', membership.role);
    
    // All queries automatically filtered by workspace
    await next();
  });
};

// Usage in routes
app.get('/trainings', workspaceTenantMiddleware, async (c) => {
  const workspaceId = c.get('workspaceId');
  const trainings = await db.query.Trainings.findMany({
    where: eq(Trainings.workspace_id, workspaceId), // Enforced isolation
  });
  return c.json(trainings);
});
```

### **3.3 Role-Based Permission Checks**

```typescript
// lib/permissions.ts
const PERMISSIONS: Record<TrainingRole, string[]> = {
  lead_trainer: ['unlock_modules', 'edit_agenda', 'pause_room', 'export_data', 'assign_roles'],
  full_editor: ['edit_agenda', 'view_data'],
  partial_editor: ['view_assigned_modules', 'view_data'],
  facilitation_support: ['pause_room', 'view_data'],
};

export async function checkPermission(
  userId: string,
  trainingId: string,
  permission: string
): Promise<boolean> {
  const facilitator = await db.query.TrainingFacilitators.findFirst({
    where: and(
      eq(TrainingFacilitators.training_id, trainingId),
      eq(TrainingFacilitators.user_id, userId)
    ),
  });
  
  if (!facilitator) return false;
  
  return PERMISSIONS[facilitator.role].includes(permission);
}

// Usage in routes
app.post('/trainings/:id/modules/:moduleId/unlock', async (c) => {
  const { id: trainingId, moduleId } = c.req.param();
  const userId = c.get('userId');
  
  const canUnlock = await checkPermission(userId, trainingId, 'unlock_modules');
  if (!canUnlock) return c.json({ error: 'Forbidden' }, 403);
  
  // Unlock logic...
});
```

### **3.4 Google OAuth + Better Auth Setup**

```typescript
// api/src/routes/auth.ts
import { betterAuth } from 'better-auth';
import { googleProvider } from 'better-auth/social-providers';

const auth = new betterAuth({
  database: {
    type: 'postgres',
    url: process.env.DATABASE_URL,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURL: `${process.env.API_URL}/api/auth/callback/google`,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh on daily use
  },
});

app.post('/auth/signin/google', async (c) => {
  // Redirect to Google OAuth consent screen
  const { url } = await auth.api.signInWithOAuth({
    provider: 'google',
    callbackURL: c.req.query('redirect') || '/workspaces',
  });
  return c.redirect(url);
});

app.get('/auth/callback/google', async (c) => {
  const code = c.req.query('code');
  const { user, session } = await auth.api.signInWithOAuth({
    provider: 'google',
    code,
  });
  
  // Create JWT token
  const token = await createJWT(user.id);
  
  // Set secure HTTP-only cookie
  c.header('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict`);
  
  return c.redirect('/workspaces');
});
```

---

## Part 4: Development & Deployment Setup

### **4.1 Local Development (Docker Compose)**

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: OruLabs
      POSTGRES_PASSWORD: localdev123
      POSTGRES_DB: OruLabs
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7
    ports:
      - '6379:6379'

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://OruLabs:localdev123@postgres:5432/OruLabs
      REDIS_URL: redis://redis:6379
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
    ports:
      - '3001:3001'
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.dev
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - '3000:3000'
    depends_on:
      - api
```

### **4.2 Getting Started (Step-by-Step)**

```bash
# 1. Clone and install
git clone <repo>
cd OruLabs
bun install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with Google OAuth credentials

# 3. Start services
docker-compose up -d

# 4. Run migrations
cd apps/api
bun run migrate

# 5. Start dev servers (parallel)
cd ../..
bun run dev
# Frontend: http://localhost:3000
# API: http://localhost:3001
```

### **4.3 Production Deployment (Hostinger VPS)**

```bash
# Hostinger VPS Setup

# 1. Create app user
sudo adduser OruLabs
sudo usermod -aG docker OruLabs

# 2. Clone repo
cd /opt
sudo git clone <repo> OruLabs
cd OruLabs

# 3. Setup environment
sudo nano .env.prod
# DATABASE_URL=postgresql://user:pass@postgres:5432/OruLabs
# REDIS_URL=redis://redis:6379
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# API_URL=https://api.OruLabs.com
# NEXT_PUBLIC_API_URL=https://api.OruLabs.com

# 4. Build and start
docker-compose -f docker-compose.prod.yml up -d

# 5. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d api.OruLabs.com -d app.OruLabs.com

# 6. Configure Nginx reverse proxy (included in docker-compose.prod.yml)
```

---

## Part 5: Key Implementation Priorities (In Order)

### **Phase 1: Foundation (Weeks 1–2)**
1. Set up monorepo, PostgreSQL schema, Hono skeleton
2. Implement Google OAuth + JWT middleware
3. Build Workspace + TrainingFacilitators RBAC
4. Create basic dashboard pages (Next.js layout + nav)

### **Phase 2: Core Features (Weeks 3–5)**
1. WebSocket integration (Socket.IO + Hono)
2. Module unlock flow + real-time broadcast
3. Participant join logic (with latecomer injection)
4. Basic tool rendering (Quiz, Whiteboard stubs)

### **Phase 3: Tools & Collaboration (Weeks 6–8)**
1. Implement all tool types (Quiz, Whiteboard, Matrix, Reflection, Sticky Notes)
2. Live aggregation + trainer dashboard charts
3. Participant grid + status indicators

### **Phase 4: Polish & Analytics (Weeks 9–10)**
1. CSV export functionality (BullMQ jobs)
2. Post-training analytics page
3. Email notifications (Resend)
4. Error handling + logging

### **Phase 5: Hardening & Deployment (Weeks 11–12)**
1. Load testing (k6 + WebSocket stress tests)
2. Security audit (OWASP top 10, auth flow)
3. Monitoring (Datadog or Sentry)
4. VPS deployment + auto-scaling

---

## Part 6: Libraries & Dependencies Summary

### **Frontend (apps/web)**
```json
{
  "next": "^15.1.0",
  "react": "^19.0.0",
  "tailwindcss": "^4.0.0",
  "shadcn-ui": "latest",
  "framer-motion": "^11.0.0",
  "socket.io-client": "^4.7.0",
  "@tanstack/react-query": "^5.28.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.51.0",
  "zod": "^3.22.0",
  "jotai": "^2.6.0",
  "recharts": "^2.12.0"
}
```

### **Backend (apps/api)**
```json
{
  "hono": "^4.0.0",
  "socket.io": "^4.7.0",
  "drizzle-orm": "^0.29.0",
  "drizzle-kit": "^0.21.0",
  "better-auth": "^1.3.0",
  "postgres": "^3.4.0",
  "redis": "^4.6.0",
  "bullmq": "^5.0.0",
  "resend": "^3.0.0",
  "zod": "^3.22.0",
  "pino": "^8.17.0"
}
```

---

## Part 7: Quick Reference: What to Code First

**To get your first "hello world" sync working:**

1. **apps/api/src/index.ts** → Hono app + Socket.IO server
2. **apps/api/src/db/schema.ts** → Drizzle schema
3. **apps/api/src/socket/handlers.ts** → Connection + module:unlock event
4. **apps/web/hooks/useSocket.ts** → Client-side Socket.IO wrapper
5. **apps/web/app/(dashboard)/trainings/[id]/live/page.tsx** → UI that listens to socket events

Once these 5 files are working, you have the backbone. Everything else is feature expansion.

---

## Summary

- **Frontend:** Next.js + Shadcn/ui + TanStack Query + Socket.IO
- **Backend:** Hono + Socket.IO + PostgreSQL + Drizzle ORM + Better Auth
- **Cache/Sessions:** Redis
- **Deployment:** Hostinger VPS + Docker
- **Database:** PostgreSQL 16 with row-level security for tenant isolation
- **Auth:** Google OAuth via Better Auth, JWT tokens for API
- **File Storage:** Cloudflare R2
- **Email:** Resend

This stack avoids over-engineering, scales horizontally, and keeps TypeScript tight across frontend and backend. No unnecessary abstractions, no AI-generated boilerplate. Pure, focused implementation.

**Ready to code? Start with the Backend Index file and the Database Schema. Those are your load-bearing walls.**
