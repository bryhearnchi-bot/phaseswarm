# PhaseSwarm

**Multi-phase, multi-agent execution planning for Claude Code**

PhaseSwarm transforms your PRD (Product Requirements Document) into an executable, phase-by-phase plan that Claude Code orchestrates using parallel agents.

```
PRD Document → PhaseSwarm Plan → Parallel Agent Execution → Working Code
```

---

## What is PhaseSwarm?

PhaseSwarm is a methodology and toolset for breaking down large projects into manageable phases, then executing each phase using Claude Code's multi-agent capabilities. Instead of Claude writing code directly, it acts as an **orchestrator** that delegates work to specialized agents running in parallel.

### Key Features

- **Phase-based execution**: Break projects into logical phases with clear boundaries
- **Parallel agent orchestration**: Build 2-4 features simultaneously using Task agents
- **Progress tracking**: JSON-based task tracking with `passes: true/false` status
- **Configurable workflow**: Customize testing, commits, branching, and check-in frequency
- **Project registry**: Track multiple PhaseSwarm projects across your system
- **Branch tracking**: Automatically remembers and restores your working branch
- **Code quality checks**: Configurable TypeScript and lint checking
- **MCP & Skills integration**: Make your tools available to agents
- **Reference matching**: Optionally compare against a V1/reference implementation

---

## Installation

### Option 1: Quick Install (curl)

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR-USERNAME/phaseswarm/main/install.sh | bash
```

### Option 2: NPX (Node.js)

```bash
npx phaseswarm init
```

### Option 3: Manual Install

1. Create the commands directory in your project:
   ```bash
   mkdir -p .claude/commands
   ```

2. Copy the skill files:
   ```bash
   # From this repo
   cp commands/phaseswarm-create.md .claude/commands/
   cp commands/phaseswarm-run.md .claude/commands/
   ```

3. Create the global registry (optional, created automatically on first use):
   ```bash
   echo '{"registry_version": 1, "projects": []}' > ~/.phaseswarm-registry.json
   ```

### Verify Installation

Start a new Claude Code session and type:
```
/phaseswarm-create
```

If you see the setup wizard start, you're good to go!

---

## Usage

### Step 1: Write a PRD

Create a PRD document describing your project. This can be any format - markdown, text, etc. Include:
- Project overview
- Features to build
- Technical requirements
- Any phases or milestones

### Step 2: Create a PhaseSwarm

In Claude Code, run:

```
/phaseswarm-create
```

This will:
1. Ask for your PRD document location
2. Ask where to create the PhaseSwarm folder
3. Ask 16 configuration questions (see below)
4. Analyze your PRD and identify phases
5. Create the folder structure with all necessary files
6. Register the project in your global registry

### Step 3: Run the PhaseSwarm

In Claude Code, run:

```
/phaseswarm-run
```

This will:
1. Show your registered projects (if multiple)
2. Check if you're on the correct branch
3. Load the project's configuration
4. Find incomplete features
5. **Delegate work to parallel agents** (2-4 at a time)
6. Run code quality checks (based on config)
7. Track progress and update JSON files
8. Handle phase transitions automatically

### Step 4: Repeat Until Done

Keep running `/phaseswarm-run` in new sessions until all phases are complete. PhaseSwarm tracks your progress, so you can stop and resume anytime.

---

## Configuration Options (16 Questions)

When creating a PhaseSwarm, you'll be asked:

### Execution Settings

| # | Option | Choices | Description |
|---|--------|---------|-------------|
| 1 | Phase Mode | Auto-continue, Stop and verify, Ask each time | What happens after completing a phase |
| 2 | Agent Level | Maximum, Balanced, Minimal | How aggressively to use parallel agents |
| 3 | Browser Testing | Full visual, Functional only, Skip, Ask | Whether/how to test in browser |
| 4 | Code Review | Always, Per phase, Never | When to run code reviewer agent |

### Git Workflow

| # | Option | Choices | Description |
|---|--------|---------|-------------|
| 5 | Branch Strategy | New branch, Current, Per phase, Ask | Git branching behavior |
| 6 | Commit Frequency | Per feature, Per batch, Per phase | How often to commit |
| 7 | Check-in Level | Frequent, Moderate, Minimal | How often to confirm with you |

### Code Quality

| # | Option | Choices | Description |
|---|--------|---------|-------------|
| 8 | TypeScript Checking | After each feature/batch/phase, Never, N/A | When to run type checks |
| 9 | Linting | After each feature/batch/phase, Never | When to run linter |
| 10 | Commands | Free text | Your lint and typecheck commands |
| 11 | Dev Server | Free text | Command to start dev server (for testing) |

### Project Context

| # | Option | Choices | Description |
|---|--------|---------|-------------|
| 12 | Reference Project | Yes/No | Do you have a V1 to match? |
| 13 | Target Path | Free text | Where is your project? |

### Agent Environment

| # | Option | Choices | Description |
|---|--------|---------|-------------|
| 14 | MCP Servers | List | Which MCP servers should agents use? |
| 15 | Skills | List | Which skills should agents know about? |
| 16 | Additional Instructions | Free text | Custom rules for all agents |

---

## File Structure

After running `/phaseswarm-create`, you'll have:

```
your-project/
├── phaseswarm/                      # or custom folder name
│   ├── CLAUDE.md                    # Master instructions (read every session)
│   ├── phases.json                  # Phase registry and config
│   ├── phase-1-foundation.md        # Phase 1 rules
│   ├── phase-1-foundation.json      # Phase 1 tasks
│   ├── phase-2-features.md          # Phase 2 rules
│   ├── phase-2-features.json        # Phase 2 tasks
│   ├── ...                          # More phases
│   └── completed/                   # Archived completed phases
└── ...
```

Global registry at `~/.phaseswarm-registry.json` tracks all your projects:

```json
{
  "registry_version": 1,
  "projects": [
    {
      "name": "My Project",
      "path": "/path/to/phaseswarm",
      "project_root": "/path/to/project",
      "working_branch": "phaseswarm/my-project",
      "current_phase": 3,
      "total_phases": 8,
      "status": "active",
      "last_accessed": "2026-01-13"
    }
  ]
}
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHASESWARM WORKFLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐     │
│  │   PRD    │ ──> │ /phaseswarm- │ ──> │  PhaseSwarm      │     │
│  │ Document │     │    create    │     │  Folder Created  │     │
│  └──────────┘     └──────────────┘     └──────────────────┘     │
│                                                  │               │
│                                                  v               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    /phaseswarm-run                         │  │
│  │                                                            │  │
│  │  1. Select project from registry                          │  │
│  │  2. Check/switch to working branch                        │  │
│  │  3. Read phases.json → Find in_progress phase             │  │
│  │  4. Read phase-N.json → Find features (passes: false)     │  │
│  │  5. Identify 2-4 parallel features                        │  │
│  │  6. DELEGATE TO AGENTS (Task tool)                        │  │
│  │                         │                                  │  │
│  │                         v                                  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              PARALLEL AGENT EXECUTION               │  │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │  │
│  │  │  │ Agent 1 │  │ Agent 2 │  │ Agent 3 │  ...        │  │  │
│  │  │  │Feature A│  │Feature B│  │Feature C│             │  │  │
│  │  │  └────┬────┘  └────┬────┘  └────┬────┘             │  │  │
│  │  │       └──────────┬─┴────────────┘                  │  │  │
│  │  │                  v                                  │  │  │
│  │  │  ┌─────────────────────────────────────────────┐   │  │  │
│  │  │  │  TypeScript Check → Lint → Browser Test     │   │  │  │
│  │  │  │  → Update JSON → Commit (based on config)   │   │  │  │
│  │  │  └─────────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                         │                                  │  │
│  │                         v                                  │  │
│  │  More features?  YES → Loop back                          │  │
│  │                  NO  → Phase complete                      │  │
│  │                         │                                  │  │
│  │                         v                                  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  PHASE COMPLETE                                     │  │  │
│  │  │  • Restart dev server                               │  │  │
│  │  │  • Notify user for testing                          │  │  │
│  │  │  • Wait for verification                            │  │  │
│  │  │  • Move to next phase                               │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Orchestrator Pattern

PhaseSwarm enforces a critical pattern: **Claude is an orchestrator, not a builder.**

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   YOU ARE AN ORCHESTRATOR. YOU DO NOT WRITE CODE.             ║
║                                                               ║
║   After EVERY interaction, ask yourself:                      ║
║   "Should I delegate work to an agent right now?"             ║
║                                                               ║
║   If YES → Use Task tool IMMEDIATELY                          ║
║   If NO  → State why explicitly                               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

This ensures:
- **Maximum parallelization**: 2-4 agents working simultaneously
- **Context preservation**: Orchestrator stays lean, agents handle details
- **Consistent patterns**: All agents follow the same rules
- **Better results**: Fresh context for each agent task

---

## Branch Tracking

PhaseSwarm remembers your working branch. When you resume:

```
You were working on branch 'phaseswarm/my-project' last time.
You're currently on 'main'.

Options:
1. Switch to 'phaseswarm/my-project' (recommended)
2. Stay on 'main' and update the registry
3. Let me specify a different branch
```

For "branch per phase" strategy, PhaseSwarm automatically creates new branches when moving between phases.

---

## CLI Commands

After installing via npm:

```bash
# Install commands to current project
phaseswarm init

# List all registered projects
phaseswarm list

# Show help
phaseswarm help
```

---

## Example Session

```
You: /phaseswarm-create

Claude: Which PRD document should I convert?
You: ./docs/my-app-prd.md

Claude: Where should I create the PhaseSwarm folder?
You: Project root (./phaseswarm/)

Claude: [Asks 16 configuration questions...]

Claude: I've identified 5 phases from your PRD:
1. Foundation (4 features)
2. User Auth (6 features)
3. Dashboard (8 features)
4. API Integration (5 features)
5. Polish & Launch (3 features)

Does this look correct?

You: Yes

Claude: PhaseSwarm created! Run /phaseswarm-run to start building.

---

You: /phaseswarm-run

Claude: Found 1 project: "My App" - Phase 1/5 in progress

I found 4 features to build in parallel:
1. Base layout component
2. Navigation header
3. Footer component
4. Theme provider

Ready to launch agents?

You: Yes

Claude: [Launches 4 agents in parallel...]

[Agents complete]

Claude: All 4 features built. Running TypeScript check...
✓ No errors

Running lint...
✓ No warnings

Updating JSON and committing...

Phase 1 complete!

🔄 Dev server restarted and ready for testing.

Please test the following features:
- Base layout component
- Navigation header
- Footer component
- Theme provider

When done, let me know and I'll mark the phase as verified.
```

---

## Requirements

- Claude Code CLI
- Git (for branching features)
- Node.js 14+ (for npx installation, optional)

---

## Troubleshooting

### Skills not showing up
Skills are loaded at session start. If you just installed, start a new Claude Code session.

### "No PhaseSwarm projects found"
Run `/phaseswarm-create` first to create a project, or specify the folder path manually.

### Agents not being used
The skill has multiple reminders to use agents. If it's still not delegating, check that the CLAUDE.md file was created correctly.

### Branch conflicts
PhaseSwarm will ask before switching branches. If you have uncommitted changes, commit or stash them first.

---

## License

MIT

---

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

---

## Support

- GitHub Issues: [Report a bug](https://github.com/YOUR-USERNAME/phaseswarm/issues)
- Discussions: [Ask questions](https://github.com/YOUR-USERNAME/phaseswarm/discussions)
