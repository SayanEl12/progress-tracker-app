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
- [ ] Implement hierarchical navigation UI
- [ ] Add validation and error handling

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
- [ ] Implement weekly calendar view
- [ ] Implement monthly calendar view
- [ ] Add historical record access
- [ ] Create past data browsing interface
- [ ] Add weekly conclusion review page

## Phase 7: Polish & Delivery
- [ ] Refine elegant UI design across all pages
- [ ] Implement responsive design
- [ ] Add loading states and error handling
- [ ] Write unit tests with Vitest
- [ ] Performance optimization
- [ ] Create checkpoint and prepare for deployment
