# PhaseSwarm: Run

You are executing a **PhaseSwarm** - a multi-phase, multi-agent execution plan.

---

## CRITICAL RULE: ALWAYS USE AGENTS

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

### The Pattern After Every User Response:

```
1. Process their response
2. CHECK: Is there work to delegate?
3. YES → Launch agents NOW (don't ask, don't wait)
4. NO → Explicitly say "No delegation needed because [reason]"
```

### Agent Types Available:

| Agent | When to Use |
|-------|-------------|
| `Explore` | Research, understanding code |
| `general-purpose` | **Building features** (use this most) |
| `feature-dev:code-reviewer` | Reviewing completed code |
| `feature-dev:code-architect` | Planning architecture |

### How to Delegate:

```python
Task(
  subagent_type="general-purpose",
  prompt="""
Build [Feature Name] for Phase [N].

Context:
- Target file: [path]
- Reference: [V1 path if applicable]
- Rules: Read phaseswarm/phase-{N}.md
- Source PRD: [phaseswarm-folder]/[prd-filename]

Requirements:
[List from acceptance_criteria in JSON]

Available Tools (from config):
[List MCP servers from CLAUDE.md if any]
- mcp__exa__* for web search
- mcp__ref__* for documentation
- etc.

Available Skills (from config):
[List skills from CLAUDE.md if any]
- /commit for git commits
- etc.

Project-Specific Rules:
[Include any additional_instructions from config]

If Unclear Requirements:
- Read the source PRD at: [phaseswarm-folder]/[prd-filename]
- Look for relevant context in the original requirements
- If still unclear, document the ambiguity and ask the orchestrator

DO:
- Match the reference exactly
- Follow the phase rules
- Complete all acceptance criteria
- Use available MCP tools when helpful
- Follow project-specific rules
- Consult the PRD for unclear requirements

DO NOT:
- Redesign or "improve"
- Add unrequested features
- Skip any criteria
- Make assumptions when PRD has the answer
"""
)
```

### Parallel Builds (DO THIS):

Launch 2-4 agents in ONE message:

```python
# In a SINGLE message, multiple Task calls:
Task(subagent_type="general-purpose", prompt="Build Feature A...")
Task(subagent_type="general-purpose", prompt="Build Feature B...")
Task(subagent_type="general-purpose", prompt="Build Feature C...")
```

---

## SESSION INITIALIZATION PROTOCOL

**Follow this startup checklist every session to ensure rapid orientation:**

```
╔══════════════════════════════════════════════════════════════════╗
║  SESSION START CHECKLIST                                         ║
║                                                                  ║
║  1. Read progress.md - Understand prior work and session context ║
║  2. Run git log --oneline -10 - See recent commits               ║
║  3. Read phases.json - Check current phase status                ║
║  4. Read phase-N.json - Find incomplete features                 ║
║  5. Run git status - Check for uncommitted changes               ║
║  6. Run quality checks - Verify baseline is green                ║
║  7. Continue from incomplete features                            ║
╚══════════════════════════════════════════════════════════════════╝
```

If context was compacted/reset, this protocol ensures you can quickly resume.

---

## STARTUP SEQUENCE

Every session, do this FIRST:

### Step 0: Read Progress Checkpoint

**First**, read `progress.md` in the PhaseSwarm folder (if it exists):
```
Read: [phaseswarm-folder]/progress.md
```

This tells you:
- What was completed in the last session
- What's currently in progress
- Any session notes or discoveries
- How to recover if context was reset

Also read recent git history for additional context:
```bash
git log --oneline -10
```

### Step 1: Read the PhaseSwarm Registry

**Registry location:** `~/.phaseswarm-registry.json`

Read the registry to see all available PhaseSwarm projects.

**IMPORTANT: Filter by current working directory**

Only show projects where `project_root` matches the current working directory. This ensures users only see projects relevant to the codebase they're currently in.

```
cwd = current working directory
Filter projects where:
  - project.project_root exists (skip if empty)
  - project.project_root === cwd
  - OR cwd is under project_root
  - OR project_root is under cwd (user is in parent directory)
```

**If registry exists and has matching projects:**

Show the user a list of projects for this directory:
```
PhaseSwarm projects for this directory:

1. [Project Name] - Phase 3/5 in progress
   Last accessed: 2026-01-10

2. [Another Project] - Phase 1/8 in progress
   Last accessed: 2026-01-08

3. Other - Specify a different folder
```

Use AskUserQuestion to let them pick.

**If registry exists but NO projects match the current directory:**

Tell user: "No PhaseSwarm projects found for this directory. Would you like to specify a PhaseSwarm folder manually, or run `/phaseswarm-create` to create a new one?"

**If registry doesn't exist or is empty:**

Ask user: "No PhaseSwarm projects found in registry. Where is your PhaseSwarm folder?"

**If they pick "Other":**

Ask for the folder path, then offer to add it to the registry. When adding, set `project_root` to the current working directory.

### Step 1b: Check Branch Status

After selecting a project, check if user is on the correct branch:

```bash
# Get current branch
git branch --show-current

# Compare to registry's working_branch for this project
```

**If current branch ≠ working_branch:**

Ask the user:
```
You were working on branch '[working_branch]' last time.
You're currently on '[current_branch]'.

Options:
1. Switch to '[working_branch]' (recommended)
2. Stay on '[current_branch]' and update the registry
3. Let me specify a different branch
```

**If they choose to switch:**
```bash
cd [project_root]
git checkout [working_branch]
```

**If they choose to stay or specify different:**
Update the registry's `working_branch` for this project.

### Step 1c: Update Registry Access Time

After selecting a project and handling branch, update its `last_accessed` date in the registry.

### Step 2: Validate the PhaseSwarm Folder

**The folder MUST contain:**
- `CLAUDE.md` (master instructions)
- `phases.json` (phase registry)
- At least one `phase-*.md` and `phase-*.json` pair

If validation fails, tell user what's missing.

### Step 3: Read CLAUDE.md

```
Read: [selected-folder]/CLAUDE.md
```

This contains:
- User's configuration preferences
- Project paths
- Workflow customizations

### Step 4: Read phases.json

```
Read: [selected-folder]/phases.json
```

Find the phase where `"status": "in_progress"`.

### Step 5: Read current phase files

```
Read: [selected-folder]/phase-{N}-{name}.md   (rules)
Read: [selected-folder]/phase-{N}-{name}.json (tasks)
```

### Step 6: Handle Branch Strategy

Check `branch_strategy` in the config:

**"New branch"**:
- If not already on a phaseswarm branch, create one:
  ```bash
  git checkout -b phaseswarm/[project-name]
  ```

**"Current branch"**:
- Do nothing, use whatever branch you're on

**"Branch per phase"**:
- Check if on correct phase branch
- If not: `git checkout -b phaseswarm/phase-[N]-[name]`

**"Ask each time"**:
- Ask user: "Currently on branch [X]. Create new branch or continue here?"

### Step 7: Find incomplete features

Look for features where `"passes": false`.

### Step 8: Identify parallel batch

Find 2-4 features that:
- Are `passes: false`
- Don't depend on each other
- Can be built simultaneously

---

## EXECUTION LOOP

### Before Building: Confirm with User

Based on the `checkin_level` in config:

- **Frequent**: Ask before every feature
- **Moderate**: Ask before each batch (default)
- **Minimal**: Just notify, don't ask

Example:
> "I found these 3 features to build in parallel:
> 1. [Feature A]
> 2. [Feature B]
> 3. [Feature C]
>
> Ready to launch agents?"

### Building: ALWAYS Delegate

```python
# Launch ALL builds in parallel
Task(subagent_type="general-purpose", prompt="Build Feature A...")
Task(subagent_type="general-purpose", prompt="Build Feature B...")
Task(subagent_type="general-purpose", prompt="Build Feature C...")
```

**NEVER write code yourself. ALWAYS use Task tool.**

### After Building: Code Quality Checks (based on config)

Check `typescript_checking` and `linting` in config:

**TypeScript Checking:**
- **After each feature**: Run `[typecheck_command]` now
- **After each batch**: Run after all parallel builds complete
- **After each phase**: Skip for now, run at phase end
- **Never / N/A**: Skip

**Linting:**
- **After each feature**: Run `[lint_command]` now
- **After each batch**: Run after all parallel builds complete
- **After each phase**: Skip for now, run at phase end
- **Never**: Skip

If checks fail:
1. Note which feature caused the failure
2. Ask user: "TypeScript/lint error in [feature]. Should I fix it or skip?"
3. If fix: Delegate fix to agent, then re-run check
4. If skip: Mark feature as needing attention, continue

### After Code Quality: Browser Test (based on config)

Check `browser_testing` in CLAUDE.md:

- **Full visual**: Take screenshots, compare to reference
- **Functional only**: Navigate and verify it works
- **Skip browser**: Move directly to update
- **Ask each time**: Ask user preference

### After Testing: Verify Before Marking Complete

**IMPORTANT:** Before marking a feature as complete, verify it passes quality checks:

1. Run the configured quality checks (TypeScript/lint)
2. If browser testing is enabled, verify the feature works
3. If tests exist for this feature, run them
4. Only mark `passes: true` if all verification passes

```
VERIFICATION CHECKLIST:
[ ] Quality checks pass (tsc/lint if configured)
[ ] Browser test passes (if configured)
[ ] Feature tests pass (if they exist)
[ ] Feature matches acceptance criteria
```

If verification fails, keep `passes: false` and either:
- Fix the issue (delegate to agent)
- Note the failure in progress.md for later

### After Verification: Update JSON

For each passing feature:

```json
{
  "id": 1,
  "description": "Feature A",
  "passes": true,  // ← Update this
  "notes": "Completed [date]"
}
```

**DO THIS IMMEDIATELY. Don't batch updates.**

### After Updating: Write Progress Checkpoint

**After each agent batch completes**, update `progress.md`:

```markdown
# PhaseSwarm Progress Log

## Last Updated: [current date and time]

### Current Phase: [N] - [Phase Name]

### Completed This Session:
- [x] Feature [ID]: [Description]
- [x] Feature [ID]: [Description]

### In Progress:
- [ ] Feature [ID]: [Description] (just completed by agents)

### Next Up:
- Feature [ID]: [Description]
- Feature [ID]: [Description]

### Session Notes:
- [Any discoveries, decisions, or important context]
- [Reference files found, patterns noticed, etc.]

### If Context Resets:
1. Read this file for session context
2. Read phases.json for current phase/status
3. Read phase-N.json for incomplete features
4. Continue from "In Progress" items above
```

**This checkpoint enables recovery if context is compacted.**

### After Updating: Commit (based on config)

Check `commit_frequency`:

- **Per feature**: Commit after each feature
- **Per batch**: Commit after the batch
- **Per phase**: Wait until phase complete

### After Commit: Continue or Stop

Check if more features have `passes: false`:
- **YES** → Start next batch (go back to "Identify parallel batch")
- **NO** → Phase complete, handle based on `phase_mode`

---

## PHASE COMPLETION

When all features in a phase have `passes: true`:

### Based on phase_mode config:

**"Auto-continue"**:
1. Update phases.json (current phase → complete)
2. Set next phase → in_progress
3. Immediately continue to next phase

**"Stop and verify"**:
1. **Restart the dev server** for fresh testing:
   ```bash
   # Kill existing server if running
   # Start fresh server using the project's dev command
   # (from CLAUDE.md quick commands or package.json)
   ```
2. Notify user:
   ```
   Phase [N] complete! All features passing.

   🔄 Dev server restarted and ready for testing.

   Please test the following features:
   [List features completed in this phase]

   When done, let me know and I'll mark the phase as verified.
   ```
3. Wait for user to test
4. User confirms testing complete
5. Set `user_verified: true`
6. **Handle git actions** (see "Phase Completion Git Actions" below)
7. Then update phases.json and continue

**"Ask each time"**:
1. Ask: "Phase [N] complete. Should I continue to Phase [N+1] or wait for your testing?"
2. If they want to test: Restart server (same as "Stop and verify")
3. After user confirms testing: **Handle git actions** (see below)
4. Follow their preference

### Phase Completion Git Actions

**IMPORTANT:** After user confirms testing is complete, handle git based on `phase_completion_git` config:

**"commit_only"**:
```bash
git add .
git commit -m "Complete Phase [N]: [Phase Name]"
```

**"commit_push"**:
```bash
git add .
git commit -m "Complete Phase [N]: [Phase Name]"
git push
```

**"commit_push_pr"**:
```bash
git add .
git commit -m "Complete Phase [N]: [Phase Name]"
git push
gh pr create --title "Phase [N]: [Phase Name]" --body "Completed features:\n[list features]"
```
Return the PR URL to the user.

**"ask"**:
Ask user: "Phase [N] testing complete. What would you like to do?"
- Commit only
- Commit and push
- Commit, push, and create PR
- Skip git actions

Then execute their choice.

### Update phases.json:

```json
{
  "id": 3,
  "name": "Current Phase",
  "status": "complete",  // ← Was "in_progress"
  "done": 10,
  "total": 10
},
{
  "id": 4,
  "name": "Next Phase",
  "status": "in_progress",  // ← Was "not_started"
  "done": 0,
  "total": 8
}
```

### Update Registry:

Update `~/.phaseswarm-registry.json` for this project:
- `current_phase`: Set to new phase number
- `working_branch`: Update if branch changed (for "branch per phase" strategy)
- `last_accessed`: Update to now

### Handle "Branch Per Phase" Strategy:

If config has `branch_strategy: "branch_per_phase"`:
1. Commit all current work
2. Create new branch: `git checkout -b phaseswarm/phase-[N]-[name]`
3. Update registry's `working_branch`

### Move completed files:

```
phaseswarm/phase-3-name.md → phaseswarm/completed/
phaseswarm/phase-3-name.json → phaseswarm/completed/
```

---

## POST-QUESTION PROTOCOL

**This is the most important section.**

After the user answers ANY question:

```
╔════════════════════════════════════════════════════════════╗
║  1. Process their answer                                   ║
║  2. ASK YOURSELF: "Is there work to delegate?"             ║
║  3. If YES → Launch Task agents IMMEDIATELY                ║
║  4. If NO → Say "No delegation needed: [reason]"           ║
║  5. NEVER end turn without one of the above                ║
╚════════════════════════════════════════════════════════════╝
```

### Examples:

**User says "Yes, proceed"**
```
→ IMMEDIATELY launch Task agents for the batch
→ Don't ask another question
→ Don't summarize
→ Just delegate
```

**User says "Skip that feature"**
```
→ Update JSON to mark skipped
→ CHECK: Are there other features to build?
→ If YES → Launch agents for those
→ If NO → Move to next step
```

**User asks a question**
```
→ Answer their question
→ CHECK: Does answering change what needs building?
→ If YES → Launch agents
→ If NO → Ask what they want to do next
```

---

## REMINDERS

### Every 3 features, remind yourself:
- "Am I delegating or doing? I should be DELEGATING."
- "Did I update the JSON after the last feature?"
- "Am I building in parallel or one at a time?"

### If you catch yourself writing code:
- STOP immediately
- Delete what you wrote
- Use Task tool instead

### If you're about to ask a question:
- Is this question necessary?
- Could I just proceed and delegate?
- Am I stalling instead of building?

---

## RALPH LOOP COMPATIBILITY

If running via `/ralph-loop`, this workflow supports autonomous continuation:

**Completion Promise:** Output `<promise>PHASE_COMPLETE</promise>` when current phase is done.

**State Persistence:**
- Progress persists in `progress.md` and phase JSON files
- Git commits track all changes
- On context reset, read `progress.md` first

**Recovery Protocol:**
1. Read `progress.md` for session context
2. Read `phases.json` for current phase status
3. Read `phase-N.json` for incomplete features
4. Continue from "In Progress" items

---

## QUICK REFERENCE

```
START SESSION:
  Read progress.md (if exists) - session context
  Run git log --oneline -10 - recent commits for context
  Read ~/.phaseswarm-registry.json
  → Filter projects by current working directory (project_root)
  → Ask which project (only show matching projects)
  → Check branch: current vs registry's working_branch
  → If different: ask user to switch or stay
  → Update last_accessed
  → Read CLAUDE.md → phases.json → phase-N.md → phase-N.json

HANDLE BRANCH:
  Based on branch_strategy config
  Update registry working_branch if changed

FIND WORK:
  Features where passes: false

BUILD:
  Task(subagent_type="general-purpose", prompt="...")
  Launch 2-4 in parallel
  Include: MCP servers, skills, project rules in prompt

CODE QUALITY:
  Based on typescript_checking config → run typecheck_command
  Based on linting config → run lint_command
  If fail: Ask user to fix or skip

BROWSER TEST:
  Based on browser_testing config

VERIFY:
  Run quality checks (tsc/lint)
  Run feature tests if they exist
  Only mark complete if verification passes

UPDATE:
  Set passes: true in JSON (immediately!)
  Update registry current_phase if needed

CHECKPOINT:
  Update progress.md after each agent batch:
  - Completed features
  - In progress items
  - Session notes
  - Recovery instructions

COMMIT:
  Based on commit_frequency config

REPEAT:
  Until all passes: true

COMPLETE PHASE:
  Based on phase_mode config
  Run phase-level lint/typecheck if configured
  User tests → confirms complete
  → Git action based on phase_completion_git config:
    - commit_only: commit
    - commit_push: commit + push
    - commit_push_pr: commit + push + create PR
    - ask: ask user what to do
  Update registry status when project complete
```

---

## START NOW

1. Read `progress.md` (if exists) for session context
2. Run `git log --oneline -10` for recent commit context
3. Read `~/.phaseswarm-registry.json`
4. Filter to projects matching current working directory (`project_root`)
5. Show user their projects for this directory, ask which one
6. Load that project's files (CLAUDE.md, phases.json, phase-N files)
7. Run quality checks to verify baseline is green
8. Find incomplete features → Confirm batch → **DELEGATE TO AGENTS**
9. After agents complete → **VERIFY** → **UPDATE JSON** → **WRITE CHECKPOINT**
