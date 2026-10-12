const fs = require('fs');
const path = require('path');

const ROOT_SRC = path.join(__dirname, '../src');

function getAllFiles(dir, exts = ['.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(full, exts));
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

const files = getAllFiles(ROOT_SRC);
console.log(`Inspecting ${files.length} source files...`);

const issues = [];

files.forEach(filePath => {
  const relPath = path.relative(path.join(__dirname, '..'), filePath);
  if (relPath.includes('translations.ts')) return; // translations dictionary handled separately

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Skip non-code / boilerplate
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('export type') ||
      trimmed.startsWith('export interface') ||
      trimmed.startsWith('console.') ||
      trimmed.includes('styles = StyleSheet.create') ||
      trimmed.startsWith('testID=')
    ) {
      return;
    }

    // Check 1: accessibilityLabel with literal English not governed by language/t()
    const accessMatch = trimmed.match(/accessibilityLabel\s*=\s*['"`]([A-Za-z\s?!]+)['"`]/);
    if (accessMatch && !trimmed.includes('language') && !trimmed.includes('t(')) {
      issues.push({ relPath, lineNum, type: 'Hardcoded accessibilityLabel', text: accessMatch[1], line: trimmed });
    }

    // Check 2: Alert.alert with literal English title not using t()
    const alertMatch = trimmed.match(/Alert\.alert\(\s*['"`]([A-Z][a-zA-Z\s?!]+)['"`]/);
    if (alertMatch && !trimmed.includes('t(')) {
      issues.push({ relPath, lineNum, type: 'Hardcoded Alert title', text: alertMatch[1], line: trimmed });
    }

    // Check 3: Raw JSX text containing Latin words (excluding type annotations, variables, icons)
    const jsxMatch = trimmed.match(/>([^<>{}]*[A-Za-z]{3,}[^<>{}]*)</);
    if (jsxMatch && !trimmed.includes('t(') && !trimmed.includes('Promise<') && !trimmed.includes('React.FC')) {
      const text = jsxMatch[1].trim();
      const allowed = ['NS', 'PT', 'URL', 'API', 'GPS', 'ID'];
      if (!allowed.includes(text) && !text.startsWith('http')) {
        issues.push({ relPath, lineNum, type: 'Raw JSX text', text, line: trimmed });
      }
    }

    // Check 4: stepInfo literal English without language check
    const stepInfoMatch = trimmed.match(/stepInfo\s*:\s*['"`]([A-Za-z\s–-]+)['"`]/);
    if (stepInfoMatch && !trimmed.includes('language') && !trimmed.includes('t(')) {
      issues.push({ relPath, lineNum, type: 'Hardcoded stepInfo', text: stepInfoMatch[1], line: trimmed });
    }

    // Check 5: Check English in parentheses in Hindi translations
    if (relPath.includes('symptomTranslations.ts') && trimmed.includes('hi:')) {
      const parenthetical = trimmed.match(/hi:\s*['"`].*?\(([A-Za-z\s–-]+)\).*?['"`]/);
      if (parenthetical) {
        issues.push({ relPath, lineNum, type: 'Parenthetical English in HI', text: parenthetical[1], line: trimmed });
      }
    }
  });
});

console.log(`\nIssues detected: ${issues.length}`);
issues.forEach(iss => {
  console.log(`[${iss.relPath}:${iss.lineNum}] (${iss.type}): "${iss.text}"`);
  console.log(`   > ${iss.line}\n`);
});
