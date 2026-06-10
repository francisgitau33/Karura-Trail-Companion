import fs from 'fs';
import path from 'path';

let hasErrors = false;

function reportError(msg) {
  console.error('[FAIL]', msg);
  hasErrors = true;
}

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        checkDir(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('.setHTML(')) {
        reportError(`${fullPath} contains unsafe .setHTML() call.`);
      }
      
      if (content.includes('target="_blank"') && !content.includes('rel="noopener noreferrer"')) {
        reportError(`${fullPath} contains target="_blank" without rel="noopener noreferrer".`);
      }
      
      if (content.includes('window.open(') && !content.includes('noopener') && !content.includes('noreferrer')) {
        reportError(`${fullPath} contains window.open without noopener,noreferrer.`);
      }
    }
  }
}


function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    reportError(`${label} missing at ${filePath}.`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function checkManagedGatesFoundation() {
  requireFile('migrations/008_managed_gates.sql', 'Managed gates migration');
  requireFile('src/lib/gates.ts', 'Managed gates library');
  requireFile('public/data/gates.geojson', 'Static gate GeoJSON');
  const seedScript = requireFile('scripts/seed-managed-gates.mjs', 'Managed gates seed script');

  if (seedScript) {
    if (!seedScript.includes('ON CONFLICT (stable_id) DO NOTHING')) {
      reportError('Managed gates seed script must use ON CONFLICT (stable_id) DO NOTHING.');
    }

    const credentialPatterns = [
      /postgres(?:ql)?:\/\/[^\s'"]+/i,
      /DATABASE_URL\s*=\s*['"][^'"]+['"]/,
      /password\s*=\s*['"][^'"]+['"]/i,
    ];

    for (const pattern of credentialPatterns) {
      if (pattern.test(seedScript)) {
        reportError('Managed gates seed script appears to contain hard-coded database credentials.');
      }
    }
  }
}

checkManagedGatesFoundation();

// Check source files
if (fs.existsSync('./src')) {
  checkDir('./src');
} else {
  console.log('[SKIP] No src directory found.');
}



// Check rate limit integrations
if (fs.existsSync('src/app/api/place-suggestions/route.ts')) {
  const content = fs.readFileSync('src/app/api/place-suggestions/route.ts', 'utf8');
  if (!content.includes('limiters.placeSuggestion.limit')) reportError('Missing rate limit check in place-suggestions route');
  if (!content.includes('!isRateLimitConfigured()')) reportError('Missing production rate limit check in place-suggestions route');
}
if (fs.existsSync('src/app/api/trail-suggestions/route.ts')) {
  const content = fs.readFileSync('src/app/api/trail-suggestions/route.ts', 'utf8');
  if (!content.includes('limiters.trailSuggestion.limit')) reportError('Missing rate limit check in trail-suggestions route');
  if (!content.includes('!isRateLimitConfigured()')) reportError('Missing production rate limit check in trail-suggestions route');
}
if (fs.existsSync('src/app/admin/login/actions.ts')) {
  const content = fs.readFileSync('src/app/admin/login/actions.ts', 'utf8');
  if (!content.includes('limiters.adminLogin.limit')) reportError('Missing rate limit check in admin login action');
  if (!content.includes('!isRateLimitConfigured()')) reportError('Missing production rate limit check in admin login action');
  if (content.includes('catch (error) {\n    console.error(\'Rate limit check failed for admin login:\', error);\n  }\n\n  const email =')) reportError('Admin login rate limit redirect swallowed by catch block');
}

// Ensure no patch scripts remain
const files = fs.readdirSync('.');
for (const file of files) {
  if (file.startsWith('patch_') && file.endsWith('.mjs')) {
    reportError(`Temporary patch file found: ${file}`);
  }
}

// Check headers in next.config.js
if (fs.existsSync('next.config.js')) {
  const config = fs.readFileSync('next.config.js', 'utf8');
  if (!config.includes('Content-Security-Policy')) reportError('Missing CSP in next.config.js');
  if (!config.includes('X-Content-Type-Options')) reportError('Missing X-Content-Type-Options in next.config.js');
  if (!config.includes('Referrer-Policy')) reportError('Missing Referrer-Policy in next.config.js');
  if (!config.includes('Permissions-Policy')) reportError('Missing Permissions-Policy in next.config.js');
  if (!config.includes('frame-ancestors \'none\'') && !config.includes('X-Frame-Options')) reportError('Missing frame protection in next.config.js');
  if (!config.includes('Strict-Transport-Security')) reportError('Missing HSTS in next.config.js');
} else {
  reportError('next.config.js not found.');
}


// Check for .env files
const rootFiles = fs.readdirSync('.');
for (const file of rootFiles) {
  if (file === '.env' || (file.startsWith('.env.') && file !== '.env.example')) {
    reportError(`Found potentially sensitive file: ${file}`);
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('[PASS] Static checks completed successfully.');
}
