const fs = require('fs');
const path = require('path');

const TRANSLATIONS_PATH = path.join(__dirname, '../src/i18n/translations.ts');
const SCREENS_DIR = path.join(__dirname, '../src/screens');
const COMPONENTS_DIR = path.join(__dirname, '../src/components');

console.log('==================================================');
console.log('   NARISETU DOCTOR APP - I18N AUDIT UTILITY       ');
console.log('==================================================\n');

// 1. Audit translations.ts
const translationsContent = fs.readFileSync(TRANSLATIONS_PATH, 'utf-8');

// Parse interface keys
const interfaceMatch = translationsContent.match(/export interface Translations \{([\s\S]*?)\n\}/);
if (!interfaceMatch) {
  console.error('ERROR: Could not locate Translations interface');
  process.exit(1);
}

const interfaceKeys = [];
interfaceMatch[1].split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('//')) {
    const keyMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*string;/);
    if (keyMatch) {
      interfaceKeys.push(keyMatch[1]);
    }
  }
});

// Parse en dictionary keys
const enMatch = translationsContent.match(/en:\s*\{([\s\S]*?)\n\s*\},[\s\n]*hi:/);
if (!enMatch) {
  console.error('ERROR: Could not locate en translations block');
  process.exit(1);
}

const enEntries = {};
const enLines = enMatch[1].split('\n');
enLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('//')) {
    const m = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*(['"`])([\s\S]*?)\2,?\s*$/);
    if (m) {
      enEntries[m[1]] = m[3];
    }
  }
});

// Parse hi dictionary keys
const hiMatch = translationsContent.match(/hi:\s*\{([\s\S]*?)\n\s*\}\s*;/);
if (!hiMatch) {
  console.error('ERROR: Could not locate hi translations block');
  process.exit(1);
}

const hiEntries = {};
const hiLines = hiMatch[1].split('\n');
hiLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('//')) {
    const m = trimmed.match(/^([a-zA-Z0-9_]+)\s*:\s*(['"`])([\s\S]*?)\2,?\s*$/);
    if (m) {
      hiEntries[m[1]] = m[3];
    }
  }
});

const enKeys = Object.keys(enEntries);
const hiKeys = Object.keys(hiEntries);

console.log(`Interface Keys Count: ${interfaceKeys.length}`);
console.log(`English Translation Keys: ${enKeys.length}`);
console.log(`Hindi Translation Keys:   ${hiKeys.length}`);

// Compare interface vs en vs hi
const missingInEn = interfaceKeys.filter(k => !(k in enEntries));
const missingInHi = interfaceKeys.filter(k => !(k in hiEntries));
const extraInEn = enKeys.filter(k => !interfaceKeys.includes(k));
const extraInHi = hiKeys.filter(k => !interfaceKeys.includes(k));

console.log(`\nKey Parity Analysis:`);
console.log(`- Missing in EN: ${missingInEn.length} ${missingInEn.length ? JSON.stringify(missingInEn) : '✓'}`);
console.log(`- Missing in HI: ${missingInHi.length} ${missingInHi.length ? JSON.stringify(missingInHi) : '✓'}`);
console.log(`- Extra in EN (not in interface): ${extraInEn.length}`);
console.log(`- Extra in HI (not in interface): ${extraInHi.length}`);

// Check empty values
const emptyEn = enKeys.filter(k => !enEntries[k] || enEntries[k].trim() === '');
const emptyHi = hiKeys.filter(k => !hiEntries[k] || hiEntries[k].trim() === '');

console.log(`\nEmpty Values Check:`);
console.log(`- Empty EN values: ${emptyEn.length}`);
console.log(`- Empty HI values: ${emptyHi.length}`);

// Check for accidental parenthetical English in Hindi values
const parentheticalEnglish = [];
for (const [key, val] of Object.entries(hiEntries)) {
  const match = val.match(/\([A-Za-z\s–-]+\)/);
  if (match) {
    parentheticalEnglish.push({ key, val, match: match[0] });
  }
}
console.log(`\nParenthetical English in Hindi values: ${parentheticalEnglish.length}`);
if (parentheticalEnglish.length > 0) {
  parentheticalEnglish.forEach(item => {
    console.log(`  [!] Key "${item.key}": "${item.val}" -> contains "${item.match}"`);
  });
}

// 2. Scan Screen & Component source files for hardcoded English UI strings
console.log('\n==================================================');
console.log('   SOURCE CODE SCAN FOR HARDCODED UI STRINGS      ');
console.log('==================================================\n');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  const found = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      found.push(...scanDir(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();

        // Skip comments, imports, console, styles
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('import ') ||
          trimmed.startsWith('export ') ||
          trimmed.startsWith('console.') ||
          trimmed.startsWith('style=') ||
          trimmed.includes('styles = StyleSheet.create')
        ) {
          return;
        }

        // Check for raw Alert.alert("...", "...") with literal English strings
        const alertMatch = trimmed.match(/Alert\.alert\(\s*['"]([A-Z][a-zA-Z\s?!]+)['"]/);
        if (alertMatch && !trimmed.includes('t(')) {
          found.push({ file, lineNum, type: 'Alert Title', text: alertMatch[1], line: trimmed });
        }

        // Check for raw placeholder="..." with literal English
        const placeholderMatch = trimmed.match(/placeholder\s*=\s*['"]([A-Z][a-zA-Z\s?!.,]+)['"]/);
        if (placeholderMatch && !trimmed.includes('t(')) {
          found.push({ file, lineNum, type: 'Placeholder', text: placeholderMatch[1], line: trimmed });
        }

        // Check for raw <Text>...</Text> with literal English (excluding icons, variables, and expressions)
        const textMatch = trimmed.match(/<Text[^>]*>([A-Za-z][A-Za-z0-9\s.,?!:–—\(\)]+)<\/Text>/);
        if (textMatch && !trimmed.includes('{') && !trimmed.includes('t(')) {
          const inner = textMatch[1].trim();
          // Exclude brand NS monogram
          if (inner !== 'NS' && inner !== '✓') {
            found.push({ file, lineNum, type: '<Text>', text: inner, line: trimmed });
          }
        }
      });
    }
  }
  return found;
}

const screenIssues = scanDir(SCREENS_DIR);
const componentIssues = scanDir(COMPONENTS_DIR);
const allIssues = [...screenIssues, ...componentIssues];

console.log(`Scan completed across ${SCREENS_DIR} and ${COMPONENTS_DIR}`);
console.log(`Potential Hardcoded UI Strings Found: ${allIssues.length}`);

if (allIssues.length > 0) {
  allIssues.forEach(issue => {
    console.log(`  [Line ${issue.lineNum} in ${issue.file}] (${issue.type}): "${issue.text}"`);
    console.log(`     > ${issue.line}`);
  });
} else {
  console.log('✓ Zero hardcoded UI strings detected!');
}

console.log('\n==================================================');
console.log('   AUDIT SUMMARY                                  ');
console.log('==================================================');
console.log(`English translation keys: ${enKeys.length}`);
console.log(`Hindi translation keys:   ${hiKeys.length}`);
console.log(`Missing Hindi:            ${missingInHi.length}`);
console.log(`Missing English:          ${missingInEn.length}`);
console.log(`Empty translations:       ${emptyEn.length + emptyHi.length}`);
console.log(`Parenthetical English:    ${parentheticalEnglish.length}`);
console.log(`Hardcoded UI strings:     ${allIssues.length}`);
console.log('==================================================\n');

if (
  missingInHi.length > 0 ||
  missingInEn.length > 0 ||
  emptyEn.length > 0 ||
  emptyHi.length > 0 ||
  parentheticalEnglish.length > 0
) {
  console.error('❌ Audit Failed: Translation parity or quality errors found.');
  process.exit(1);
} else {
  console.log('✅ Audit Passed: 100% parity, 0 missing, 0 empty, 0 parenthetical English.');
}
