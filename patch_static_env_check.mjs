import fs from 'fs';
let content = fs.readFileSync('scripts/static-checks.mjs', 'utf8');

const updatedEnvCheck = `
// Check for .env files
const rootFiles = fs.readdirSync('.');
for (const file of rootFiles) {
  if (file === '.env' || (file.startsWith('.env.') && file !== '.env.example')) {
    reportError(\`Found potentially sensitive file: \${file}\`);
  }
}
`;

content = content.replace(/\/\/ Check for \.env files[\s\S]*?(?=if \(hasErrors\))/m, updatedEnvCheck + '\n');
fs.writeFileSync('scripts/static-checks.mjs', content);
