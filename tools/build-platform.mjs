import { execFile as execFileCallback } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { dirname, join, relative, resolve, sep } from 'node:path';

const execFile = promisify(execFileCallback);

async function listFiles(directory, baseDirectory = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(path, baseDirectory));
    } else {
      files.push(relative(baseDirectory, path).split(sep).join('/'));
    }
  }
  return files;
}

async function getSourceCommit(projectRoot) {
  try {
    const result = await execFile('git', ['rev-parse', 'HEAD'], { cwd: projectRoot });
    return result.stdout.trim() || 'working-tree';
  } catch {
    return 'working-tree';
  }
}

export async function readProjectVersion(projectRoot) {
  const packageJson = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
  return packageJson.version;
}

export async function buildPlatform({
  projectRoot,
  profile,
  outputRoot,
  zipPath,
  transformIndex,
}) {
  const root = resolve(projectRoot);
  const output = resolve(outputRoot);
  const archive = resolve(zipPath);
  const sourceIndex = await readFile(join(root, 'index.html'), 'utf8');

  await rm(output, { recursive: true, force: true });
  await rm(archive, { force: true });
  await mkdir(output, { recursive: true });
  await cp(join(root, 'styles.css'), join(output, 'styles.css'));
  await cp(join(root, 'src'), join(output, 'src'), { recursive: true });
  await writeFile(
    join(output, 'index.html'),
    transformIndex ? transformIndex(sourceIndex) : sourceIndex,
    'utf8',
  );

  for (const path of profile.removePaths ?? []) {
    await rm(join(output, path), { recursive: true, force: true });
  }

  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const manifestPath = join(output, 'build-manifest.json');
  const sourceCommit = await getSourceCommit(root);
  const initialManifest = {
    schemaVersion: 1,
    game: packageJson.name,
    version: packageJson.version,
    platform: profile.platform,
    entrypoint: profile.entrypoint,
    externalUrls: profile.externalUrls ?? [],
    sourceCommit,
    files: [],
  };
  await writeFile(manifestPath, `${JSON.stringify(initialManifest, null, 2)}\n`, 'utf8');
  const files = await listFiles(output);
  const manifest = { ...initialManifest, files };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  await mkdir(dirname(archive), { recursive: true });
  await execFile('tar', [
    '-a',
    '-c',
    '-f',
    archive,
    '-C',
    output,
    ...files,
  ]);

  return { outputRoot: output, zipPath: archive, manifest };
}
