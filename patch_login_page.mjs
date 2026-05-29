import fs from 'fs';
let content = fs.readFileSync('src/app/admin/login/page.tsx', 'utf8');

content = content.replace('disabled={!setupStatus.isConfigured}', 'disabled={!setupStatus.isConfigured && !params?.error?.includes("Too many login attempts")}');

fs.writeFileSync('src/app/admin/login/page.tsx', content);
