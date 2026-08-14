import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const pagesDir = path.join(root, 'assets', 'qcf-pages');
const fontsDir = path.join(root, 'assets', 'fonts', 'qcf');
const files = (await readdir(pagesDir)).filter((name) => /^group-\d{2}\.json$/.test(name)).sort();
const pages = new Map();
const errors = [];

for (const file of files) {
  const group = JSON.parse(await readFile(path.join(pagesDir, file), 'utf8'));
  for (const [key, value] of Object.entries(group)) {
    const pageNumber = Number(key);
    if (pages.has(pageNumber)) errors.push(`Duplicate page ${pageNumber}`);
    pages.set(pageNumber, value);
  }
}

for (let pageNumber = 1; pageNumber <= 604; pageNumber += 1) {
  const page = pages.get(pageNumber);
  if (!page) {
    errors.push(`Missing page ${pageNumber}`);
    continue;
  }
  if (page.page !== pageNumber) errors.push(`Page key mismatch at ${pageNumber}`);
  if (!/^QCF4_(Hafs_\d{2}|QBSML)$/.test(page.font ?? '')) errors.push(`Invalid font on page ${pageNumber}`);
  const expectedLines = pageNumber <= 2 ? 8 : 15;
  if (!Array.isArray(page.lines) || page.lines.length !== expectedLines) {
    errors.push(`Page ${pageNumber} has ${page.lines?.length ?? 0} lines, expected ${expectedLines}`);
    continue;
  }
  for (const [lineIndex, line] of page.lines.entries()) {
    if (line.line !== lineIndex + 1 || !Array.isArray(line.words)) {
      errors.push(`Invalid line ${lineIndex + 1} on page ${pageNumber}`);
      continue;
    }
    for (const word of line.words) {
      if (!Number.isInteger(word.code) || typeof word.char !== 'string' || word.char.length === 0) {
        errors.push(`Invalid glyph on page ${pageNumber}, line ${line.line}`);
      } else if (word.char !== String.fromCodePoint(word.code)) {
        errors.push(`Glyph/code mismatch on page ${pageNumber}, line ${line.line}`);
      }
    }
  }
}

for (let number = 1; number <= 47; number += 1) {
  const name = `QCF4_Hafs_${String(number).padStart(2, '0')}_W.ttf`;
  try {
    const info = await stat(path.join(fontsDir, name));
    if (info.size < 100_000) errors.push(`Font ${name} is incomplete (${info.size} bytes)`);
  } catch {
    errors.push(`Missing font ${name}`);
  }
}
try {
  const qbsml = await stat(path.join(fontsDir, 'QCF4_QBSML.ttf'));
  if (qbsml.size < 10_000) errors.push('QCF4_QBSML.ttf is incomplete');
} catch {
  errors.push('Missing font QCF4_QBSML.ttf');
}

if (pages.size !== 604) errors.push(`Expected 604 pages, found ${pages.size}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${pages.size} Mushaf pages, 47 page fonts, and the Bismillah font.`);
}
