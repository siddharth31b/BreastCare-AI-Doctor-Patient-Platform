const fs = require('fs');
const path = require('path');

const trPath = path.join(__dirname, '../src/i18n/translations.ts');
const trContent = fs.readFileSync(trPath, 'utf8');
const lines = trContent.split('\n');

const parameterizedKeys = {};
for (const line of lines) {
  const m = line.match(/^\s*([a-zA-Z0-9_]+):\s*['"`](.*\{[a-zA-Z_]+\}.*)['"`],?/);
  if (m) {
    parameterizedKeys[m[1]] = m[2];
  }
}

console.log('Parameterized keys found:', Object.keys(parameterizedKeys));

// Now search across all src files to see how each parameterized key is called
const srcDir = path.join(__dirname, '../src');
function walk(dir, list = []) {
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) {
      walk(p, list);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      list.push(p);
    }
  }
  return list;
}

const files = walk(srcDir).filter(f => !f.includes('translations.ts') && !f.includes('symptomTranslations.ts'));

console.log('\nChecking usage in source files:');
for (const key of Object.keys(parameterizedKeys)) {
  const pattern = new RegExp(`t\\(\\s*['"\`]${key}['"\`](?:\\s*,\\s*([^\\)]+))?\\)`, 'g');
  let found = false;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = pattern.exec(text)) !== null) {
      found = true;
      const relPath = path.relative(srcDir, file);
      const arg = m[1] ? m[1].trim() : 'NONE';
      console.log(`  ${key}: in ${relPath} -> args: ${arg}`);
    }
  }
  if (!found) {
    console.log(`  ${key}: NOT directly called with t('${key}')`);
  }
}
