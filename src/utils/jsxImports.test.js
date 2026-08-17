import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = new URL('../', import.meta.url).pathname;
const IGNORED_JSX_TAGS = new Set([
  'Bar',
  'BarChart',
  'Line',
  'LineChart',
  'Modal',
  'ResponsiveContainer',
  'Tooltip',
  'XAxis',
  'YAxis',
]);

function listJsxFiles(dir) {
  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return listJsxFiles(path);
    return path.endsWith('.jsx') ? [path] : [];
  });
}

function getImportedNames(source) {
  const imports = new Set();
  for (const match of source.matchAll(/import\s+([A-Z][\w]*)\s+from\s+['"][^'"]+['"]/g)) {
    imports.add(match[1]);
  }
  for (const match of source.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g)) {
    match[1]
      .split(',')
      .map(part => part.trim().split(/\s+as\s+/).pop().trim())
      .filter(name => /^[A-Z]/.test(name))
      .forEach(name => imports.add(name));
  }
  return imports;
}

test('JSX components used in pages and components are imported', () => {
  const failures = [];

  for (const file of listJsxFiles(SRC_DIR)) {
    const source = readFileSync(file, 'utf8');
    const importedNames = getImportedNames(source);
    const usedNames = [...source.matchAll(/<([A-Z][\w]*)\b/g)]
      .map(match => match[1])
      .filter(name => IGNORED_JSX_TAGS.has(name));

    for (const name of new Set(usedNames)) {
      if (!importedNames.has(name)) failures.push(`${file.replace(SRC_DIR, 'src/')}: ${name}`);
    }
  }

  assert.deepEqual(failures, []);
});
