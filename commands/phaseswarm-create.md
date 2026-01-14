# PhaseSwarm: Create Plan from PRD

You are creating a **PhaseSwarm** - a multi-phase, multi-agent execution plan from a PRD document.

---

## STEP 1: Get the PRD and Folder Location

Ask the user TWO things using AskUserQuestion:

**Question 1:** "Which PRD or plan document should I convert into a PhaseSwarm?"
- Free text for file path

**Question 2:** "Where should I create the PhaseSwarm folder?"
- Options:
  - "Project root" - Create `./phaseswarm/` in current directory
  - "Custom location" - I'll specify the path
  - "Named folder" - Create `./phaseswarm-[project-name]/` in current directory

If they choose custom location, ask for the path.

**IMPORTANT:** Always create a dedicated folder. Never put PhaseSwarm files loose in a directory. The folder structure will be:

```
[chosen-location]/
├── CLAUDE.md                 ← Master instructions
├── phases.json               ← Phase registry
├── phase-1-[name].md         ← Phase 1 rules
├── phase-1-[name].json       ← Phase 1 tasks
├── phase-2-[name].md         ← Phase 2 rules
├── phase-2-[name].json       ← Phase 2 tasks
│   ... (more phases)
└── completed/                ← Archived phases go here
```

Wait for their response. Read the PRD file they provide.

---

## STEP 2: Ask Configuration Questions

Before creating the CLAUDE.md, ask the user these questions to customize how they want to work. Use the AskUserQuestion tool with multiple questions:

### Question Set 1: Execution Style
```
1. Phase Completion Mode
   - "Auto-continue" - Automatically start next phase after current completes
   - "Stop and verify" - Stop after each phase for your manual testing
   - "Ask each time" - Ask me whether to continue after each phase

2. Agent Delegation Level
   - "Maximum" - Always use agents for everything (recommended)
   - "Balanced" - Use agents for building, I'll handle simple tasks
   - "Minimal" - Only use agents for complex multi-file changes
```

### Question Set 2: Testing Preferences
```
3. Browser Testing
   - "Full visual" - Screenshot comparison with V1/reference
   - "Functional only" - Just verify it works, don't compare visuals
   - "Skip browser" - No browser testing, just code review
   - "Ask each time" - Ask me per feature

4. Code Review
   - "Always" - Run code reviewer agent after every feature
   - "Per phase" - Run code reviewer once per phase
   - "Never" - Skip code review
```

### Question Set 3: Git & Communication
```
5. Branch Strategy
   - "New branch" - Create a new branch for this PhaseSwarm (e.g., phaseswarm/[project-name])
   - "Current branch" - Use whatever branch I'm currently on
   - "Branch per phase" - Create a new branch for each phase
   - "Ask each time" - Ask me at the start of each phase

6. Commit Frequency
   - "Per feature" - Commit after each feature passes
   - "Per batch" - Commit after each parallel batch
   - "Per phase" - One commit per phase

7. Phase Completion Git Action
   - "Commit only" - Just commit after phase testing is complete
   - "Commit and push" - Commit and push to remote after phase testing
   - "Commit, push, and PR" - Commit, push, and create a pull request after each phase
   - "Ask each time" - Ask me what to do after each phase

8. User Check-ins
   - "Frequent" - Confirm before every action
   - "Moderate" - Confirm before batches, not individual features
   - "Minimal" - Only confirm at phase boundaries
```

### Question Set 4: Code Quality Checks
```
9. TypeScript Checking (if applicable)
   - "After each feature" - Run tsc after every feature
   - "After each batch" - Run tsc after parallel batch completes
   - "After each phase" - Run tsc once per phase
   - "Never" - Skip TypeScript checks
   - "N/A" - Not a TypeScript project

10. Linting
    - "After each feature" - Run lint after every feature
    - "After each batch" - Run lint after parallel batch completes
    - "After each phase" - Run lint once per phase
    - "Never" - Skip linting

11. Lint/TypeCheck Commands (free text)
    - What command runs your linter? (e.g., "npm run lint", "pnpm lint")
    - What command runs TypeScript check? (e.g., "npm run typecheck", "tsc --noEmit")

12. Dev Server Command (free text)
    - What command starts your dev server? (e.g., "npm run dev", "pnpm dev")
    - This will be used to restart the server before user testing phases
```

### Question Set 5: Project Context
```
13. Do you have a reference project to match? (V1/existing version)
    - "Yes" - I'll ask for the path
    - "No" - Building from scratch

14. What's the V2/target project path?
    (Free text response)
```

If they have a reference project, ask for the path.

### Question Set 6: Agent Environment & Tools
```
15. MCP Servers
    Ask: "Do you have MCP servers configured that agents should use?"
    - "Yes" - I'll ask which ones
    - "No" - Skip this

    If yes, ask: "Which MCP servers should agents have access to? (comma-separated)"
    Examples: "exa, ref, chrome-devtools, supabase"

    These will be documented in CLAUDE.md so agents know they're available.

16. Available Skills
    Ask: "Are there existing skills/slash commands agents should know about?"
    - "Yes" - I'll ask which ones
    - "No" - Skip this

    If yes, ask: "Which skills should agents be able to use? (comma-separated)"
    Examples: "commit, review-pr, frontend-design"

17. Additional Instructions
    Ask: "Any additional rules or instructions you want ALL agents to follow?"

    Free text - user can add:
    - Coding style preferences
    - File naming conventions
    - Architecture patterns to follow
    - Things to avoid
    - Project-specific requirements

    These get added to a "Project-Specific Rules" section in CLAUDE.md.
```

---

## STEP 3: Analyze the PRD

Read through the PRD and identify:
1. **Phases** - Major milestones or sections of work
2. **Features per phase** - Individual tasks within each phase
3. **Dependencies** - Which phases block others
4. **Technical requirements** - Stack, tools, patterns mentioned

---

## STEP 4: Create the PhaseSwarm Folder Structure

Create these files in a `phaseswarm/` folder (or ask user for preferred location):

### 4a. Create CLAUDE.md

This is the master instructions file. Customize based on their answers:

```markdown
# PhaseSwarm: [Project Name]

> **READ THIS FILE FIRST** at the start of every session.

---

## Your Configuration

### Execution Settings
- **Phase Mode**: [their answer]
- **Agent Level**: [their answer]
- **Browser Testing**: [their answer]
- **Code Review**: [their answer]
- **Branch Strategy**: [their answer]
- **Commit Frequency**: [their answer]
- **Phase Completion Git**: [their answer - commit_only, commit_push, commit_push_pr, or ask]
- **Check-in Level**: [their answer]

### Code Quality
- **TypeScript Checking**: [their answer]
- **Linting**: [their answer]
- **TypeCheck Command**: `[their command or N/A]`
- **Lint Command**: `[their command or N/A]`
- **Dev Server Command**: `[their command]`

### Project Paths
- **Reference Project**: [path or "None"]
- **Target Project**: [path]

---

## Available Tools & Skills

### MCP Servers
[If user specified MCP servers, list them here with brief descriptions]

Example:
- `mcp__exa__*` - Web search and code context
- `mcp__ref__*` - Documentation search
- `mcp__chrome-devtools__*` - Browser automation

Use these tools when they would help complete tasks.

### Skills
[If user specified skills, list them here]

Example:
- `/commit` - Create git commits
- `/frontend-design` - Generate frontend components

Agents can invoke these with the Skill tool when appropriate.

---

## Project-Specific Rules

[If user provided additional instructions, include them here]

Example:
- Use functional components, not class components
- All API calls go through the `/lib/api` module
- Follow the existing naming convention: `kebab-case` for files
- Never use `any` type in TypeScript

---

## CRITICAL: ALWAYS USE AGENTS

**YOU ARE AN ORCHESTRATOR, NOT A BUILDER.**

After EVERY interaction (including answering questions), you MUST:
1. Check if there's work to delegate
2. If yes → Use Task tool with agents
3. If no → Continue the workflow

### The Rule
```
QUESTION ANSWERED → CHECK FOR WORK → DELEGATE TO AGENTS
```

Never let a conversation turn pass without checking if you should delegate.

### Agent Types
| Type | Use For |
|------|---------|
| `Explore` | Understanding code, research |
| `general-purpose` | Building features, writing code |
| `feature-dev:code-reviewer` | Reviewing completed code |

### Delegation Template
```
Task(
  subagent_type="general-purpose",
  prompt="Build [Feature] for Phase [N]..."
)
```

---

## Workflow

[Customized based on their preferences]

### For Each Feature:
1. Read `phases.json` → Find current `in_progress` phase
2. Read `phase-{N}.md` → Understand rules
3. Read `phase-{N}.json` → Find features with `passes: false`
4. **DELEGATE** → Use Task tool to build (NEVER build yourself)
5. [Browser test if configured]
6. [Code review if configured]
7. Update JSON → Set `passes: true`
8. [Commit based on frequency setting]
9. **Repeat**

### Phase Completion:
[Based on their phase mode preference]

---

## Quick Commands

```bash
# Start dev server
[to be filled in]

# Reference project
[their V1 path or N/A]

# Target project
[their V2 path]
```

---

## Post-Question Reminder

After asking ANY question and receiving an answer:

1. ✅ Process their answer
2. ✅ Check: "Is there work I should delegate?"
3. ✅ If yes: Launch agents IMMEDIATELY
4. ✅ If no: Continue to next workflow step

**NEVER end a turn without either delegating work or explicitly stating why there's nothing to delegate.**
```

### 4b. Create phases.json

```json
{
  "project": "[Name from PRD]",
  "created": "[today's date]",
  "last_updated": "[today's date]",
  "config": {
    "phase_mode": "[their answer]",
    "agent_level": "[their answer]",
    "browser_testing": "[their answer]",
    "code_review": "[their answer]",
    "branch_strategy": "[their answer]",
    "commit_frequency": "[their answer]",
    "phase_completion_git": "[commit_only|commit_push|commit_push_pr|ask]",
    "checkin_level": "[their answer]",
    "typescript_checking": "[their answer]",
    "linting": "[their answer]",
    "typecheck_command": "[their command or null]",
    "lint_command": "[their command or null]",
    "dev_command": "[their command]",
    "mcp_servers": ["exa", "ref", "chrome-devtools"],
    "skills": ["commit", "frontend-design"],
    "additional_instructions": "[their free text or null]"
  },
  "phases": [
    // Generated from PRD analysis
  ]
}
```

### 4c. Create phase-{N}-{name}.md for each phase

Rules and context for that phase, extracted from PRD.

### 4d. Create phase-{N}-{name}.json for each phase

Task list with `passes: false` for each feature.

---

## STEP 5: Confirm with User

Show them:
1. The phases you identified
2. The features per phase
3. Ask: "Does this breakdown look correct? Should I adjust anything?"

Make any requested changes.

---

## STEP 6: Create the Files Using Agents

**DELEGATE file creation to agents in parallel.** Do NOT create files yourself.

### 6a. Create the folder structure first
```bash
mkdir -p [phaseswarm-folder]/completed
```

### 6b. Launch parallel agents to create files

In a SINGLE message, launch multiple Task agents:

```python
# Create CLAUDE.md and phases.json yourself (small, config-heavy)
# But delegate ALL phase files to agents in parallel:

Task(
  subagent_type="general-purpose",
  prompt="""
Create PhaseSwarm files for Phase 1: [Phase Name]

Create these two files:
1. [folder]/phase-1-[slug].md - Rules file with:
   - Phase overview from PRD section [X]
   - Technical requirements
   - Acceptance criteria patterns
   - V1/V2 path mappings

2. [folder]/phase-1-[slug].json - Task tracking with:
   - All features from PRD section [X]
   - Each feature has: id, category, priority, description, file, v1_reference, acceptance_criteria, passes: false

PRD Content for this phase:
[Paste relevant PRD section]

Config:
[Include relevant config settings]
"""
)

Task(
  subagent_type="general-purpose",
  prompt="Create PhaseSwarm files for Phase 2: [Phase Name]..."
)

Task(
  subagent_type="general-purpose",
  prompt="Create PhaseSwarm files for Phase 3: [Phase Name]..."
)

# Launch as many as needed - one agent per phase
```

### 6c. Create CLAUDE.md and phases.json yourself

These are small config files that need the full context from all the questions. Create them directly with Write tool while agents work on phase files.

### 6d. Wait for agents to complete

All phase files will be created in parallel, much faster than sequential creation.

---

## STEP 7: Register the PhaseSwarm

Add this project to the PhaseSwarm registry so `/phaseswarm-run` can find it.

**Registry location:** `~/.phaseswarm-registry.json` (user's home directory)

If the registry doesn't exist, create it:
```json
{
  "registry_version": 1,
  "projects": []
}
```

Add the new project to the registry:
```json
{
  "registry_version": 1,
  "projects": [
    {
      "name": "[Project Name from PRD]",
      "path": "[absolute path to phaseswarm folder]",
      "created": "[today's date]",
      "last_accessed": "[today's date]",
      "status": "active",
      "current_phase": 1,
      "total_phases": [N],
      "prd_source": "[path to original PRD]",
      "working_branch": "[branch name if new branch was created, or current branch]",
      "project_root": "[CURRENT WORKING DIRECTORY - see note below]"
    }
  ]
}
```

**IMPORTANT: `project_root` field**

The `project_root` field is CRITICAL for filtering. Set it to the **current working directory** (where the user ran `/phaseswarm-create`). This ensures:
- `/phaseswarm-run` only shows projects relevant to the current codebase
- Users don't accidentally pick the wrong project when working in different directories
- The registry stays organized even with many projects across different codebases

```
project_root = current working directory (e.g., /Users/name/projects/my-app)
```

If branch_strategy was "New branch", create the branch now and store its name.

---

## STEP 8: Provide Next Steps

Tell the user:
> "PhaseSwarm created! Your plan is ready in `[folder path]`.
>
> To start building, run: `/phaseswarm-run`
>
> Phases identified:
> 1. [Phase 1 name] - [X features]
> 2. [Phase 2 name] - [X features]
> ...
>
> First phase is set to `in_progress`. Ready when you are!"

---

## Remember

- ASK all configuration questions BEFORE creating files
- CUSTOMIZE the CLAUDE.md based on their answers
- ALWAYS include the "Post-Question Reminder" section
- NEVER skip the user confirmation step
