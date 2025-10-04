const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const targetExtensions = new Set(['.js', '.cjs', '.mjs']);

function isJavaScriptFile(filePath) {
  return targetExtensions.has(path.extname(filePath));
}

function collectFiles(startDir) {
  const files = [];
  const stack = [startDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }
        stack.push(entryPath);
      } else if (entry.isFile() && isJavaScriptFile(entryPath)) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

const v14OnlyIdentifiers = [
  'GatewayIntentBits',
  'Partials.',
  'Partials[',
  'PermissionsBitField',
  'ButtonBuilder',
  'ActionRowBuilder',
  'EmbedBuilder',
  'StringSelectMenuBuilder',
  'SelectMenuBuilder',
  'SlashCommandBuilder.from',
  'AttachmentBuilder',
  'ChannelType.',
  'ModalBuilder',
  'TextInputBuilder',
  'RoleSelectMenuBuilder',
  'UserSelectMenuBuilder',
  'MentionableSelectMenuBuilder'
];

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hits = [];
  for (const identifier of v14OnlyIdentifiers) {
    if (content.includes(identifier)) {
      hits.push(identifier);
    }
  }
  return hits;
}

const filesToCheck = collectFiles(repoRoot);
const report = [];

for (const file of filesToCheck) {
  const relativePath = path.relative(repoRoot, file);
  if (relativePath === path.join('scripts', 'check-discord-version.js')) {
    continue;
  }
  const identifiers = analyzeFile(file);
  if (identifiers.length > 0) {
    report.push({ file: relativePath, identifiers });
  }
}

if (report.length === 0) {
  console.log('✅ No Discord.js v14-specific identifiers detected.');
} else {
  console.log('⚠️ Potential Discord.js v14-specific identifiers found:');
  for (const { file, identifiers } of report) {
    console.log(`- ${file}: ${identifiers.join(', ')}`);
  }
  process.exitCode = 1;
}

const packageJsonPath = path.join(repoRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const discordVersion = packageJson.dependencies && packageJson.dependencies['discord.js'];
  if (discordVersion) {
    console.log(`Detected discord.js dependency version constraint: ${discordVersion}`);
  }
}
