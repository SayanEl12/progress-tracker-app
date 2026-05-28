# Progress Tracker - TODO

## Phase 1: Database Schema
- [x] Define Prisma schema with all entities (Campo, Misión, Objetivo, Meta, Trackeable, Note, AIPoint, WeeklyConclusion)
- [x] Create and apply database migrations
- [x] Add database query helpers in server/db.ts

## Phase 2: Hierarchical CRUD Operations
- [x] Create Campo management (CRUD)
- [x] Create Misión management (CRUD)
- [x] Create Objetivo management (CRUD)
- [x] Create Meta management (CRUD)
- [x] Create Trackeable management (CRUD)
- [x] Implement hierarchical navigation UI
- [x] Add validation and error handling

## Phase 3: Daily Calendar & Trackeables
- [x] Build daily calendar view component
- [x] Implement Trackeable registration (binary and numeric types) - Backend
- [x] Create daily Notes system - Backend
- [x] Add date navigation and day selection
- [x] Implement Trackeable value storage and calculation - Backend

## Phase 4: AI Integration
- [x] Implement AIPoint daily evaluation button - Backend
- [x] Create LLM integration for daily scoring (1-10) - Backend
- [x] Implement automatic weekly conclusion generation - Backend
- [x] Add structured output parsing from LLM responses - Backend
- [x] Store AIPoint scores and conclusions in database

## Phase 5: Progress Calculation & Dashboards
- [x] Implement Meta progress formula (a × AIPoints + b × Trackeables) - Backend
- [x] Implement Objetivo progress (average of Metas) - Backend
- [x] Implement Misión progress (average of Objetivos) - Backend
- [x] Implement Campo progress (average of Misiones) - Backend
- [x] Create configurable weight parameters (a, b) per Meta - Backend
- [ ] Build dashboard overview with progress bars - Frontend
- [ ] Create progress visualization components - Frontend

## Phase 6: Calendar Views & History
- [ ] Implement weekly calendar view - En progreso
- [ ] Implement monthly calendar view - En progreso
- [ ] Add historical record access - En progreso
- [ ] Create past data browsing interface - En progreso
- [ ] Add weekly conclusion review page - En progreso

## Phase 7: Polish & Delivery
- [x] Refine elegant UI design across all pages
- [x] Implement responsive design
- [x] Add loading states and error handling
- [x] Write unit tests with Vitest (20 tests pasando)
- [x] Performance optimization
- [x] Create checkpoint and prepare for deployment
