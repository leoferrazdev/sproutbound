import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative, resolve } from 'node:path';

const ignoredDirectories = new Set(['.git', 'node_modules', 'tests']);
const releaseExtensions = new Set(['.css', '.html', '.js', '.json', '.svg']);
const maxBytes = 8 * 1024 * 1024;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...await collectFiles(join(directory, entry.name)));
      }
      continue;
    }
    if (releaseExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase())) {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}

export async function auditBuild(projectRoot) {
  const root = resolve(projectRoot);
  const files = await collectFiles(root);
  let totalBytes = 0;
  const violations = [];

  for (const file of files) {
    const metadata = await stat(file);
    totalBytes += metadata.size;
    const content = await readFile(file, 'utf8');
    const displayPath = relative(root, file);

    if (/https?:\/\//i.test(content)) {
      violations.push(`${displayPath}: external URL reference`);
    }
    if (/\bconsole\.log\s*\(/.test(content)) {
      violations.push(`${displayPath}: console.log is not allowed in release files`);
    }
  }

  if (totalBytes > maxBytes) {
    violations.push(`release files total ${totalBytes} bytes; limit is ${maxBytes} bytes`);
  }

  return { ok: violations.length === 0, files, totalBytes, violations };
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  const projectRoot = resolve(import.meta.dirname, '..');
  const result = await auditBuild(projectRoot);
  if (!result.ok) {
    process.stderr.write(`${result.violations.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Build audit passed: ${result.files.length} files, ${result.totalBytes} bytes.\n`);
  }
}
