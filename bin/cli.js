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
const REGISTRY_FILE = path.join(os.homedir(), '.phaseswarm-registry.json');
const CLAUDE_DIR = path.join(process.cwd(), '.claude', 'commands');
const COMMANDS_SOURCE = path.join(__dirname, '..', 'commands');
const COMMANDS = ['phaseswarm-create.md', 'phaseswarm-run.md'];

/**
 * Initialize PhaseSwarm - copy commands to .claude/commands/
 */
function init() {
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

  // Step 3: Create registry if needed
  logInfo('Checking PhaseSwarm registry...');

  try {
    if (!fs.existsSync(REGISTRY_FILE)) {
      const registry = {
        registry_version: 1,
        created: new Date().toISOString(),
        projects: []
      };
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf8');
      logSuccess(`Created registry at ${REGISTRY_FILE}`);
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
  console.log(`Registry location: ${colors.green}${REGISTRY_FILE}${colors.reset}`);
  console.log('');
}

/**
 * List registered PhaseSwarm projects
 */
function list() {
  console.log('');
  log('PhaseSwarm Projects', 'cyan');
  log('===================', 'cyan');
  console.log('');

  try {
    if (!fs.existsSync(REGISTRY_FILE)) {
      logWarning('No registry found. Run "phaseswarm init" first.');
      console.log('');
      return;
    }

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

    // Sort by last_accessed (most recent first)
    const sortedProjects = [...registry.projects].sort((a, b) => {
      return new Date(b.last_accessed || 0) - new Date(a.last_accessed || 0);
    });

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
      console.log(`   Path: ${project.path}`);

      if (project.last_accessed) {
        const date = new Date(project.last_accessed);
        console.log(`   Last accessed: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      }

      if (project.prd_source) {
        console.log(`   PRD: ${project.prd_source}`);
      }

      console.log('');
    }

    console.log(`${colors.cyan}Registry: ${REGISTRY_FILE}${colors.reset}`);
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
  console.log('  phaseswarm <command>');
  console.log('');
  console.log('Commands:');
  console.log(`  ${colors.green}init${colors.reset}     Install PhaseSwarm commands to .claude/commands/`);
  console.log(`  ${colors.green}list${colors.reset}     List all registered PhaseSwarm projects`);
  console.log(`  ${colors.green}help${colors.reset}     Show this help message`);
  console.log('');
  console.log('After installation, use these commands in Claude Code:');
  console.log(`  ${colors.blue}/phaseswarm-create${colors.reset}  Create a new PhaseSwarm from a PRD`);
  console.log(`  ${colors.blue}/phaseswarm-run${colors.reset}     Execute an existing PhaseSwarm`);
  console.log('');
  console.log('Learn more: https://github.com/bryhearnchi-bot/phaseswarm');
  console.log('');
}

// Main entry point
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command.toLowerCase()) {
  case 'init':
  case 'install':
    init();
    break;

  case 'list':
  case 'ls':
  case 'projects':
    list();
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
