# 🎯 WORKFLOWS BMAD v6 - Mon Jeu .io

Ce fichier liste tous les workflows BMAD recommandés pour votre jeu, dans l'ordre optimal.

---

## 🚀 PHASE 1 : AUDIT (Semaine 1 - Jour 1)

### `*document-project`
**Agent** : BMad Builder
**Durée** : 30-45 min
**Input** : Votre projet complet
**Output** : Rapport d'audit complet

```markdown
### À copier/coller dans Claude/Cursor :
*document-project

### Répondez aux questions :
1. Type de projet ? → "Node.js game with real-time multiplayer"
2. Stack tech ? → "Node.js, Express, Socket.io, MongoDB, Canvas, Jest"
3. Taille du projet ? → "Medium (45+ tests, multiple modules)"
4. Principaux problèmes ? → "Describe any current pain points"
```

**Attendez** : Rapport analyse architecturale complète
**Puis** : Sauvegardez output dans `.bmad/outputs/audit-report.md`

---

## 🏗️ PHASE 2 : ARCHITECTURE (Semaine 1 - Jours 2-3)

### `*create-architecture`
**Agents** : Architect + Game Architect (custom)
**Durée** : 2-3 heures
**Input** : Audit report + project files
**Output** : C4/UML diagrams + refactoring plan

```markdown
### À copier/coller dans Claude/Cursor :
*create-architecture

### Contexte à fournir :
1. Current architecture structure (see .bmad/config/game-config.yaml)
2. Bottlenecks identified from audit
3. Key files location:
   - Procedural generation : utils/map.js
   - Collision detection : utils/collisions.js
   - Client logic : public/client.js
   - Game state : public/game-state.js
   - Game loop : public/game-loop.js
4. Design goals :
   - Improve modularity
   - Optimize real-time sync
   - Ensure 85% test coverage
   - Profile Canvas rendering

### Expected Output :
- C4 Model diagrams (current vs proposed)
- UML class diagrams for critical modules
- Refactoring priorities (with effort estimate)
- Socket.io optimization suggestions
- Procedural generation analysis
```

**Attendez** : Architecture diagrams + detailed refactoring plan
**Puis** : Review diagrams + create refactoring tasks

### `*create-tech-spec` (Optional but Recommended)
**Agent** : Tech Writer
**Durée** : 1 heure
**Input** : Architecture diagrams
**Output** : Updated tech spec documentation

```markdown
### À copier/coller :
*create-tech-spec

### Focus areas for your game :
1. Real-time synchronization protocol (client ↔ server via Socket.io)
2. Procedural map generation algorithm (with seed-based determinism)
3. Collision detection system (pixel-perfect at 60 FPS)
4. Game state structure (what syncs, what's local-only)
5. Leaderboard schema (MongoDB consistency model)
6. Player input validation (prevent cheating)
7. Shop transaction flow (atomic operations)
```

**Attendez** : Comprehensive tech spec
**Puis** : Use as reference for implementation

---

## ✅ PHASE 3 : TESTING (Semaine 2)

### `*run-test-design`
**Agent** : Test Architect
**Durée** : 1-1.5 heures
**Input** : Current test suite + architecture
**Output** : Test plan with coverage gaps

```markdown
### À copier/coller :
*run-test-design

### Context for your game :
1. Current tests: 45 tests in Jest
2. Test files location: tests/
3. Focus areas:
   - Unit tests: utils/ (map.js, collisions.js, game-logic.js)
   - Integration: Socket.io client-server sync
   - E2E: shop transitions, leaderboard updates, solo mode flow
   - Performance: game loop frame rate, map generation speed
4. Known gaps:
   - Procedural generation edge cases
   - Socket.io reconnection handling
   - Shop transaction atomicity
   - Leaderboard consistency under concurrent writes
   - Canvas rendering performance

### Expected Output :
- Matrix of test coverage by module
- Specific test cases to add
- Recommended fixture-based tests for real-time
- Coverage targets (aim for 85%+)
```

**Attendez** : Detailed test plan + coverage matrix
**Puis** : Use for implementation phase

### `*setup-test-framework`
**Agent** : Test Architect
**Durée** : 1.5-2 heures
**Input** : Test design + current jest.config.js
**Output** : Updated test setup + fixture templates

```markdown
### À copier/coller :
*setup-test-framework

### Your setup needs :
1. Jest 30.2.0 (already installed)
2. Current config: jest.config.js
3. Add fixture support for :
   - Socket.io mock server
   - MongoDB mock (memory-based)
   - Game state snapshots
   - Canvas mock
4. Coverage thresholds:
   - Statements: 85%
   - Branches: 80%
   - Functions: 85%
   - Lines: 85%
5. Add CI/CD hooks (GitHub Actions)

### Expected Output :
- Updated jest.config.js with fixtures
- Test templates for each module type
- GitHub Actions workflow (if deploying to Render.com)
- Coverage reporting setup
```

**Attendez** : Updated test framework + templates
**Puis** : Copy fixture templates to tests/

---

## 🔍 PHASE 4 : CODE REVIEW (Semaine 2)

### `*run-code-review`
**Agent** : Senior Developer
**Durée** : 1-2 heures
**Input** : Project codebase
**Output** : Quality audit + improvement suggestions

```markdown
### À copier/coller :
*run-code-review

### Focus areas for your game :
1. Code complexity analysis
   - Max cyclomatic complexity: 10
   - Max cognitive complexity: 15
2. Critical modules to review:
   - utils/collisions.js (must be efficient)
   - utils/map.js (must be deterministic)
   - public/client.js (must be responsive)
   - public/game-loop.js (must maintain 60 FPS)
3. Error handling review
   - Are all Socket.io errors caught?
   - Are all MongoDB errors handled?
   - Are inputs validated?
4. Security audit
   - No secrets in code (all in .env?)
   - Input validation for player actions
   - SQL injection / NoSQL injection prevention
5. Performance bottlenecks
   - Any N+1 queries to MongoDB?
   - Canvas rendering optimized?
   - Socket.io event handlers efficient?

### Expected Output :
- Quality scoring (per file/module)
- Critical issues list
- Suggested refactorings
- Performance optimization opportunities
```

**Attendez** : Quality report + refactoring suggestions
**Puis** : Create GitHub issues from critical findings

---

## 🚢 PHASE 5 : IMPLEMENTATION (Semaine 3+)

### Template pour chaque Feature

#### Step 1: `*create-product-brief`
**Agent** : Product Manager
**Durée** : 30-60 min

```markdown
*create-product-brief

Feature Name: [e.g., "Advanced Procedural Generation"]
Description: [What and why]
User Value: [Who benefits and how]
Success Metrics: [How to measure success]
Technical Constraints: [Latency, FPS, storage, etc.]
```

#### Step 2: `*create-story`
**Agent** : Analyst + Tech Writer
**Durée** : 30-45 min

```markdown
*create-story

PRD Reference: [Link to brief]
User Story: As a [role], I want [action] so that [benefit]
Acceptance Criteria: [List of testable conditions]
Technical Details: [Architecture, dependencies, edge cases]
Testing Strategy: [Unit, integration, E2E, performance]
Effort Estimate: [1/2/3/5/8 story points]
```

#### Step 3: `*implement-story`
**Agent** : Developer
**Durée** : Variable (depends on story points)

```markdown
*implement-story

Story ID: [from *create-story]
Acceptance Criteria: [Copy from story]
Current Code: [Relevant code snippets]
Approach: [How to implement]
Testing: [Write tests alongside code]

Monitor: 
- Code follows architecture
- Tests written before/with code
- Performance metrics met
- 0 console errors/warnings
```

#### Step 4: `*run-code-review` (before merge)
**Agent** : Senior Developer
**Durée** : 30-60 min

```markdown
*run-code-review

PR Changes: [Describe changes]
Acceptance Criteria Met: [Yes/No + details]
Test Coverage: [% coverage for new code]
Performance Impact: [Any degradation?]
Security: [Any new vulnerabilities?]
```

---

## 📋 FEATURE IMPLEMENTATION ORDER

### Feature 1 : Advanced Procedural Generation
**Effort** : 2-3 days
**Criticality** : HIGH
**Workflow** :
1. `*create-architecture` (refactor map.js section)
2. `*create-product-brief` (new generation system)
3. `*create-story` x3 (basic → advanced → edge cases)
4. `*implement-story` for each story
5. `*run-code-review` before merge

### Feature 2 : Shop System Optimization
**Effort** : 1-2 days
**Criticality** : HIGH
**Workflow** :
1. `*create-tech-spec` (shop transaction model)
2. `*create-product-brief`
3. `*create-story` x2
4. `*implement-story` + tests
5. `*run-code-review`

### Feature 3 : Leaderboard Consistency
**Effort** : 1-2 days
**Criticality** : MEDIUM
**Workflow** : Same as Feature 2

### Feature 4+ : Academy Leader, Mobile Refinement, etc.
**Follow same pattern** : Brief → Stories → Implementation → Review

---

## 🔧 SPECIAL WORKFLOWS

### For Quick Fixes (emergencies)
```markdown
*run-quick-flow

Bug: [Describe issue]
Impact: [Severity level]
Proposed Fix: [Your approach]
Testing: [How to verify]
```

### For Deep Analysis (stuck on problem)
```markdown
*conduct-research

Topic: [What to research]
Context: [Relevant code/situation]
Questions: [What you need to understand]
```

### For Brainstorming (new ideas)
```markdown
*run-brainstorming-session

Topic: [Feature/problem to brainstorm]
Current Approach: [What you're considering]
Constraints: [Technical/business limits]
Goal: [Ideal outcome]
```

---

## 📊 PROGRESS TRACKING

As you complete workflows, log them here:

```markdown
## Completed Workflows

- [ ] Document Project (audit)
- [ ] Create Architecture (design)
- [ ] Create Tech Spec (documentation)
- [ ] Run Test Design (test planning)
- [ ] Setup Test Framework (test infrastructure)
- [ ] Run Code Review (quality audit)
- [ ] Create Product Brief (Feature 1)
- [ ] Create Stories (Feature 1)
- [ ] Implement Stories (Feature 1)
- [ ] Run Code Review (Feature 1)
- [ ] Deploy to Render.com

## Current Phase
[Audit / Architecture / Testing / Implementation]

## Blockers
[List any issues]

## Next Steps
[What's coming next]
```

---

## 🆘 TROUBLESHOOTING

### Workflow seems stuck
- Check if you provided all required context
- Try breaking it into smaller pieces
- Use `*conduct-research` to understand better

### Output is too generic
- Provide more specific context about your game
- Include relevant code snippets
- Clarify your constraints and goals

### Need different agent expertise
- Combine agents (use multiple in same chat)
- Customize agents in `.bmad/agents/`
- Reference specific agent by name

### Git workflow integration
```bash
# After running workflow:
git add .
git commit -m "workflow: [workflow-name] - [brief description]"
git push

# Example:
git commit -m "workflow: create-architecture - refactor game loop and Socket.io sync"
```

---

## ✨ PRO TIPS

1. **Save BMAD outputs** : Copy into `.bmad/outputs/` for reference
2. **Version your plans** : After each phase, commit to git
3. **Iterate fast** : Don't wait for perfection, improve as you go
4. **Test early** : Add tests alongside implementation
5. **Monitor metrics** : Track coverage, performance, reliability
6. **Ask for help** : BMAD community discord if stuck

---

**Last Updated** : Jan 8, 2026
**Status** : Ready to launch
**Next Workflow** : `*document-project`
