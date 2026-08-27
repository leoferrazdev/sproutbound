import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// O gate validava o código-fonte e a evidência manual contra o HEAD e nunca olhava o que
// havia dentro de submission/. Os pacotes ficaram 15 commits atrás — eram literalmente o
// build recusado, sem campaign.js, sem biome-transition.js, sem pause.js — e nada
// reclamava. Com os itens manuais marcados, o gate teria autorizado enviar o artefato que
// causou a segunda recusa.

function manifests() {
  const dir = path.join(ROOT, 'submission');
  const encontrados = [];
  if (!fs.existsSync(dir)) return encontrados;
  (function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'build-manifest.json') encontrados.push(full);
    }
  })(dir);
  return encontrados;
}

function head() {
  try { return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return null; }
}

test('todo pacote em submission/ declara o commit atual', () => {
  const commit = head();
  if (!commit) return; // sem git não há o que provar; o gate reprova por conta própria
  const encontrados = manifests();
  assert.ok(encontrados.length > 0, 'nenhum build-manifest.json em submission/');
  for (const file of encontrados) {
    const relativo = path.relative(ROOT, file).replace(/\\/g, '/');
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(manifest.sourceCommit, commit, `${relativo} foi gerado de outro commit`);
  }
});

test('o pacote do CrazyGames contém os módulos da campanha', () => {
  // Comparar hash prova origem; esta prova conteúdo. Um manifesto pode estar certo e o
  // empacotador ter esquecido um arquivo novo — foi assim que a lista de módulos cresceu.
  const dir = path.join(ROOT, 'submission', 'sproutbound-quality-0.2.0-crazygames-build');
  assert.ok(fs.existsSync(dir), 'pacote do CrazyGames ausente; rode npm run build:all');
  for (const modulo of ['campaign.js', 'biome-transition.js', 'pause.js', 'stage.js']) {
    assert.ok(
      fs.existsSync(path.join(dir, 'src', 'game', modulo)),
      `${modulo} não está no pacote; ele é do build recusado`,
    );
  }
});

test('submission/ não guarda pacote de uma rodada anterior', () => {
  // A pasta que uma pessoa abre para subir arquivo não pode conter build antigo. Arquivar
  // preserva o histórico; deixar ali é risco de envio por engano.
  const dir = path.join(ROOT, 'submission');
  const entradas = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => /\.zip$/i.test(e.name) || (e.isDirectory() && /-build$/.test(e.name)))
    .map((e) => e.name);
  const forasteiros = entradas.filter((nome) => !nome.startsWith('sproutbound-quality-0.2.0-'));
  assert.deepEqual(forasteiros, [], `artefatos de outra rodada em submission/: ${forasteiros.join(', ')}`);
});
