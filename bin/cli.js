#!/usr/bin/env node

/**
 * PhaseSwarm CLI
 * Multi-phase, multi-agent execution planning for Claude Code
 *
 * Usage:
 *   npx phaseswarm init    - Install PhaseSwarm commands to .claude/commands/
 *   npx phaseswarm list    - List registered PhaseSwarm projects
 *   npx phaseswarm help    - Show help
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}[PhaseSwarm]${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}[PhaseSwarm]${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`${colors.blue}[PhaseSwarm]${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}[PhaseSwarm]${colors.reset} ${message}`);
}

// Paths
const GLOBAL_REGISTRY_FILE = path.join(os.homedir(), '.phaseswarm-registry.json');
const LOCAL_REGISTRY_FILE = path.join(process.cwd(), '.phaseswarm-registry.json');
const CLAUDE_DIR = path.join(process.cwd(), '.claude', 'commands');
const COMMANDS_SOURCE = path.join(__dirname, '..', 'commands');
const COMMANDS = ['phaseswarm-create.md', 'phaseswarm-run.md'];

/**
 * Helper to prompt user for input
 */
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Get the active registry file (local takes precedence)
 * Reads registry_type from file to handle edge cases
 */
function getRegistryFile() {
  // Check local first
  if (fs.existsSync(LOCAL_REGISTRY_FILE)) {
    try {
      const content = JSON.parse(fs.readFileSync(LOCAL_REGISTRY_FILE, 'utf8'));
      return { path: LOCAL_REGISTRY_FILE, type: content.registry_type || 'local' };
    } catch {
      return { path: LOCAL_REGISTRY_FILE, type: 'local' };
    }
  }
  // Then check global
  if (fs.existsSync(GLOBAL_REGISTRY_FILE)) {
    try {
      const content = JSON.parse(fs.readFileSync(GLOBAL_REGISTRY_FILE, 'utf8'));
      return { path: GLOBAL_REGISTRY_FILE, type: content.registry_type || 'global' };
    } catch {
      return { path: GLOBAL_REGISTRY_FILE, type: 'global' };
    }
  }
  return null;
}

/**
 * Initialize PhaseSwarm - copy commands to .claude/commands/
 */
async function init() {
  console.log('');
  log('======================================', 'cyan');
  log('    PhaseSwarm Initializer', 'cyan');
  log('    Multi-Phase Agent Orchestration', 'cyan');
  log('======================================', 'cyan');
  console.log('');

  // Step 1: Create .claude/commands directory
  logInfo('Creating .claude/commands directory...');

  try {
    if (!fs.existsSync(CLAUDE_DIR)) {
      fs.mkdirSync(CLAUDE_DIR, { recursive: true });
      logSuccess(`Created ${CLAUDE_DIR}`);
    } else {
      logWarning(`Directory already exists: ${CLAUDE_DIR}`);
    }
  } catch (err) {
    logError(`Failed to create directory: ${err.message}`);
    process.exit(1);
  }

  // Step 2: Copy command files
  logInfo('Installing PhaseSwarm commands...');

  for (const cmd of COMMANDS) {
    const sourcePath = path.join(COMMANDS_SOURCE, cmd);
    const targetPath = path.join(CLAUDE_DIR, cmd);

    try {
      // Check if source exists
      if (!fs.existsSync(sourcePath)) {
        logError(`Source file not found: ${sourcePath}`);
        logError('Package may be corrupted. Try reinstalling.');
        process.exit(1);
      }

      // Check if target already exists
      if (fs.existsSync(targetPath)) {
        logWarning(`${cmd} already exists, overwriting...`);
      }

      // Copy file
      const content = fs.readFileSync(sourcePath, 'utf8');
      fs.writeFileSync(targetPath, content, 'utf8');
      logSuccess(`Installed ${cmd}`);

    } catch (err) {
      logError(`Failed to install ${cmd}: ${err.message}`);
      process.exit(1);
    }
  }

  // Step 3: Ask about registry location
  console.log('');
  log('Registry Setup', 'cyan');
  log('--------------', 'cyan');
  console.log('');
  console.log('PhaseSwarm tracks projects in a registry file.');
  console.log('');
  console.log(`  ${colors.green}1. Local${colors.reset}  - Registry in this project only (./.phaseswarm-registry.json)`);
  console.log(`            Only this project's PhaseSwarm will be tracked here.`);
  console.log('');
  console.log(`  ${colors.blue}2. Global${colors.reset} - Registry for all projects (~/.phaseswarm-registry.json)`);
  console.log(`            All PhaseSwarm projects across your system will be tracked.`);
  console.log('');

  let registryChoice = await prompt(`Choose registry location (1=local, 2=global) [1]: `);

  // Default to local if empty or invalid
  const useLocal = registryChoice !== '2' && registryChoice !== 'global' && registryChoice !== 'g';
  const REGISTRY_FILE = useLocal ? LOCAL_REGISTRY_FILE : GLOBAL_REGISTRY_FILE;
  const registryType = useLocal ? 'local' : 'global';

  console.log('');
  logInfo(`Setting up ${registryType} registry...`);

  try {
    if (!fs.existsSync(REGISTRY_FILE)) {
      const registry = {
        registry_version: 1,
        registry_type: registryType,
        created: new Date().toISOString(),
        projects: []
      };
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf8');
      logSuccess(`Created ${registryType} registry at ${REGISTRY_FILE}`);
    } else {
      logWarning(`Registry already exists at ${REGISTRY_FILE}`);
    }
  } catch (err) {
    logError(`Failed to create registry: ${err.message}`);
    // Non-fatal - continue
  }

  // Step 4: Verify installation
  logInfo('Verifying installation...');

  let allOk = true;
  for (const cmd of COMMANDS) {
    const targetPath = path.join(CLAUDE_DIR, cmd);
    if (fs.existsSync(targetPath)) {
      logSuccess(`  Found: ${targetPath}`);
    } else {
      logError(`  Missing: ${targetPath}`);
      allOk = false;
    }
  }

  if (fs.existsSync(REGISTRY_FILE)) {
    logSuccess(`  Found: ${REGISTRY_FILE}`);
  } else {
    logWarning(`  Missing: ${REGISTRY_FILE} (optional)`);
  }

  if (!allOk) {
    logError('Installation incomplete. Please check errors above.');
    process.exit(1);
  }

  // Success message
  console.log('');
  log('======================================', 'green');
  logSuccess('PhaseSwarm installed successfully!');
  log('======================================', 'green');
  console.log('');
  console.log('Usage:');
  console.log('');
  console.log(`  1. Create a PhaseSwarm from a PRD:`);
  log(`     /phaseswarm-create`, 'blue');
  console.log('');
  console.log(`  2. Run an existing PhaseSwarm:`);
  log(`     /phaseswarm-run`, 'blue');
  console.log('');
  console.log(`Commands installed to: ${colors.green}${CLAUDE_DIR}${colors.reset}`);
  console.log(`Registry (${registryType}): ${colors.green}${REGISTRY_FILE}${colors.reset}`);
  if (useLocal) {
    console.log('');
    logInfo(`Note: Add ${colors.yellow}.phaseswarm-registry.json${colors.reset} to .gitignore if you don't want to track it.`);
  }
  console.log('');
}

/**
 * List registered PhaseSwarm projects
 * @param {boolean} showAll - Show all projects regardless of cwd
 */
function list(showAll = false) {
  console.log('');
  log('PhaseSwarm Projects', 'cyan');
  log('===================', 'cyan');
  console.log('');

  const cwd = process.cwd();

  // Find registry (local takes precedence over global)
  const registryInfo = getRegistryFile();

  try {
    if (!registryInfo) {
      logWarning('No registry found. Run "phaseswarm init" first.');
      console.log('');
      return;
    }

    const REGISTRY_FILE = registryInfo.path;
    const registryType = registryInfo.type;

    const content = fs.readFileSync(REGISTRY_FILE, 'utf8');
    let registry;
    try {
      registry = JSON.parse(content);
    } catch (err) {
      logError(`Registry file is corrupted: ${err.message}`);
      logInfo('Recreate with: phaseswarm init');
      process.exit(1);
    }

    if (!registry.projects || registry.projects.length === 0) {
      logInfo('No projects registered yet.');
      console.log('');
      console.log('To create a PhaseSwarm project, run /phaseswarm-create in Claude Code.');
      console.log('');
      return;
    }

    // Filter projects by current working directory (unless --all flag or local registry)
    let filteredProjects = registry.projects;

    // For local registries, always show all projects in that registry (they're already scoped)
    // For global registries, strictly filter to only projects in the current repository
    if (!showAll && registryType === 'global') {
      filteredProjects = registry.projects.filter(project => {
        const projectRoot = project.project_root || '';
        if (!projectRoot) return false; // Skip projects without project_root

        // Strict filtering: only show projects where:
        // - cwd exactly equals project_root, OR
        // - cwd is a subdirectory of project_root (we're inside the project)
        // Do NOT show projects where project_root is under cwd (sibling projects)
        return projectRoot === cwd || cwd.startsWith(projectRoot + path.sep);
      });
    }

    // Sort by last_accessed (most recent first)
    const sortedProjects = [...filteredProjects].sort((a, b) => {
      return new Date(b.last_accessed || 0) - new Date(a.last_accessed || 0);
    });

    if (sortedProjects.length === 0) {
      logInfo(`No PhaseSwarm projects found for this directory.`);
      console.log(`   Current directory: ${cwd}`);
      console.log('');
      console.log(`Use ${colors.cyan}phaseswarm list --all${colors.reset} to see all projects.`);
      console.log('');
      return;
    }

    // Show registry info
    console.log(`Registry: ${colors.cyan}${REGISTRY_FILE}${colors.reset} (${registryType})`);
    console.log('');

    if (registryType === 'local') {
      console.log(`${colors.green}Showing all projects in local registry${colors.reset}`);
    } else if (!showAll) {
      console.log(`Showing projects for: ${colors.cyan}${cwd}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}(Showing all projects)${colors.reset}`);
    }
    console.log('');

    for (let i = 0; i < sortedProjects.length; i++) {
      const project = sortedProjects[i];
      const num = i + 1;

      // Status indicator
      let statusIcon, statusColor;
      if (project.status === 'complete') {
        statusIcon = '[DONE]';
        statusColor = 'green';
      } else if (project.status === 'active') {
        statusIcon = `[Phase ${project.current_phase}/${project.total_phases}]`;
        statusColor = 'yellow';
      } else {
        statusIcon = `[${project.status || 'unknown'}]`;
        statusColor = 'reset';
      }

      console.log(`${colors.bold}${num}. ${project.name}${colors.reset} ${colors[statusColor]}${statusIcon}${colors.reset}`);
      console.log(`   PhaseSwarm: ${project.path}`);

      if ((showAll || registryType === 'global') && project.project_root) {
        console.log(`   Project root: ${project.project_root}`);
      }

      if (project.last_accessed) {
        const date = new Date(project.last_accessed);
        console.log(`   Last accessed: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      }

      if (project.prd_source) {
        console.log(`   PRD: ${project.prd_source}`);
      }

      console.log('');
    }

    if (!showAll && registryType === 'global' && registry.projects.length > sortedProjects.length) {
      console.log(`${colors.yellow}(${registry.projects.length - sortedProjects.length} other projects hidden - use --all to see all)${colors.reset}`);
    }
    console.log('');

  } catch (err) {
    logError(`Failed to read registry: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Show help
 */
function help() {
  console.log('');
  log('PhaseSwarm - Multi-phase, multi-agent execution planning for Claude Code', 'cyan');
  console.log('');
  console.log('Usage:');
  console.log('  phaseswarm <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log(`  ${colors.green}init${colors.reset}     Install PhaseSwarm commands to .claude/commands/`);
  console.log(`  ${colors.green}list${colors.reset}     List PhaseSwarm projects for current directory`);
  console.log(`  ${colors.green}help${colors.reset}     Show this help message`);
  console.log('');
  console.log('Options:');
  console.log(`  ${colors.yellow}--all, -a${colors.reset}  Show all projects (for 'list' command)`);
  console.log('');
  console.log('Examples:');
  console.log('  phaseswarm list          List projects for current directory');
  console.log('  phaseswarm list --all    List all registered projects');
  console.log('');
  console.log('After installation, use these commands in Claude Code:');
  console.log(`  ${colors.blue}/phaseswarm-create${colors.reset}  Create a new PhaseSwarm from a PRD`);
  console.log(`  ${colors.blue}/phaseswarm-run${colors.reset}     Execute an existing PhaseSwarm`);
  console.log('');
  console.log('Learn more: https://github.com/bryhearnchi-bot/phaseswarm');
  console.log('');
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  // Check for --all flag
  const hasAllFlag = args.includes('--all') || args.includes('-a');

  switch (command.toLowerCase()) {
    case 'init':
    case 'install':
      await init();
      break;

    case 'list':
    case 'ls':
    case 'projects':
      list(hasAllFlag);
      break;

    case 'help':
    case '--help':
    case '-h':
      help();
      break;

    default:
      logError(`Unknown command: ${command}`);
      console.log('');
      console.log('Run "phaseswarm help" for usage information.');
      process.exit(1);
  }
}

main().catch(err => {
  logError(`Unexpected error: ${err.message}`);
  process.exit(1);
});
