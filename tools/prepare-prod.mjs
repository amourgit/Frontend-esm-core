#!/usr/bin/env node
/**
 * Préparation de la PRODUCTION — tout ce qui se fait ENTRE `yarn build:prod` ET `yarn start:prod`, en une commande :
 *
 *   yarn prepare:prod
 *
 *   1. Applications compilées   les dist/ des apps du Core sont là (sinon : yarn build:prod)
 *   2. Configuration runtime    EGEN_CONFIG_FILE (s'il est défini) est lisible et valide — échec rapide, avant le reste
 *   3. Apps externes            yarn external:sync --strict : téléchargement, validation, verrou (si external-apps.json existe)
 *   4. Contrôle du verrou       yarn external:check : fichiers conformes aux empreintes SHA-256
 *   5. Précompression           tools/precompress.mjs (.br / .gz servis par serve-prod)
 *
 * Intégration À FROID : cette commande, puis (re)démarrage du Core. Chaque étape affiche son retour ; au premier
 * échec, la commande s'arrête avec le code 1, nomme l'étape fautive et indique quoi faire. Zéro dépendance.
 *
 * Options : --skip-precompress   ne pas précompresser (essai rapide)
 *           --no-color           sortie sans couleurs (aussi : NO_COLOR=1)
 * Variables : celles des outils appelés (EGEN_EXTERNAL_APPS, EGEN_EXTERNAL_DIR, EGEN_CONFIG_FILE…).
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RuntimeConfigError, loadRuntimeConfig } from './runtime-config.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS = join(ROOT, 'tools');

// ── .env (optionnel) : même chargement que serve-prod.mjs, process.env prioritaire ──
// Sans cela, EGEN_CONFIG_FILE & co. déclarés dans .env sont invisibles ici alors que
// start:prod les lit : la validation de la configuration runtime serait silencieusement
// sautée au lieu d'échouer vite.
function loadDotenv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
loadDotenv(resolve(ROOT, '.env.production'));
loadDotenv(resolve(ROOT, '.env'));

const env = process.env;
const args = new Set(process.argv.slice(2));
const SKIP_PRECOMPRESS = args.has('--skip-precompress');

const useColor = process.stdout.isTTY && !args.has('--no-color') && !env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = paint('1'), dim = paint('2'), green = paint('32'), red = paint('31'), yellow = paint('33'), cyan = paint('36');

const out = (s = '') => process.stdout.write(`${s}\n`);
const ok = (s) => out(`    ${green('✓')} ${s}`);
const ko = (s) => out(`    ${red('✗')} ${s}`);
const warn = (s) => out(`    ${yellow('⚠')} ${s}`);
const info = (s) => out(`    ${dim('•')} ${dim(s)}`);

/** Échec contrôlé d'une étape : message + conseil. */
class StepError extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }
}

/** Lance un outil Node, retransmet sa sortie indentée en direct, renvoie { code, lines }. */
function run(script, scriptArgs = []) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [join(TOOLS, script), ...scriptArgs], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const lines = [];
    let pending = '';
    const feed = (chunk) => {
      pending += chunk.toString('utf8');
      const parts = pending.split(/\r?\n/);
      pending = parts.pop();
      for (const l of parts) {
        if (!l.trim()) continue;
        lines.push(l);
        out(`      ${dim('│')} ${dim(l)}`);
      }
    };
    child.stdout.on('data', feed);
    child.stderr.on('data', feed);
    child.on('error', (e) => resolveRun({ code: 1, lines: [...lines, e.message] }));
    child.on('close', (code) => {
      if (pending.trim()) { lines.push(pending); out(`      ${dim('│')} ${dim(pending)}`); }
      resolveRun({ code: code ?? 1, lines });
    });
  });
}

// ── Les étapes ──────────────────────────────────────────────────────────────

const EXTERNAL_DIR = resolve(ROOT, env.EGEN_EXTERNAL_DIR || 'external-apps');
const EXTERNAL_DECL = resolve(ROOT, env.EGEN_EXTERNAL_APPS || 'external-apps.json');
const LOCK = join(EXTERNAL_DIR, 'external-apps.lock.json');
const hasExternals = () => existsSync(EXTERNAL_DECL);

function internalApps() {
  const dir = join(ROOT, 'packages/apps');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((n) => existsSync(join(dir, n, 'package.json')));
}
const hasDist = (app) => {
  try { return statSync(join(ROOT, 'packages/apps', app, 'dist')).isDirectory() && readdirSync(join(ROOT, 'packages/apps', app, 'dist')).length > 0; }
  catch { return false; }
};

function lockedExternals() {
  try { return Object.keys(JSON.parse(readFileSync(LOCK, 'utf8')).apps || {}); } catch { return []; }
}

const steps = [
  {
    title: 'Applications compilées',
    async run() {
      const apps = internalApps();
      const built = apps.filter(hasDist);
      const missing = apps.filter((a) => !hasDist(a));
      if (built.length === 0) {
        throw new StepError(
          apps.length ? `aucune des ${apps.length} apps du Core n'est compilée (dist/ absent)` : 'aucune app trouvée dans packages/apps',
          'Compiler d\'abord :  yarn build:prod',
        );
      }
      ok(`${built.length}/${apps.length} apps compilées`);
      if (missing.length) {
        const shown = missing.slice(0, 6).join(', ');
        warn(`${missing.length} app(s) sans dist/, ignorées au démarrage : ${shown}${missing.length > 6 ? ` … et ${missing.length - 6} autre(s)` : ''}`);
        info('Pour les inclure :  yarn build:prod');
      }
      return `${built.length}/${apps.length} apps`;
    },
  },
  {
    title: 'Configuration runtime',
    async run() {
      const file = env.EGEN_CONFIG_FILE;
      if (!file) {
        info('EGEN_CONFIG_FILE non défini : les apps configurables garderont leurs valeurs par défaut');
        return 'non définie';
      }
      let config;
      try {
        config = loadRuntimeConfig(resolve(ROOT, file)).config;
      } catch (e) {
        if (e instanceof RuntimeConfigError) throw new StepError(e.message, 'Corriger le fichier (JSON { "<nom de l\'app>": { … } }, voir egen-config.example.json).');
        throw e;
      }
      const names = Object.keys(config);
      ok(`${file} valide — ${names.length} app(s) configurée(s)${names.length ? ` : ${names.join(', ')}` : ''}`);
      return `${names.length} app(s)`;
    },
  },
  {
    title: 'Apps externes (synchronisation)',
    async run() {
      if (!hasExternals()) {
        info(`${env.EGEN_EXTERNAL_APPS || 'external-apps.json'} absent : aucune app externe à synchroniser`);
        return 'aucune';
      }
      const { code, lines } = await run('sync-external-apps.mjs', ['--strict']);
      if (code !== 0) {
        throw new StepError(
          'la synchronisation a échoué (voir ci-dessus)',
          'Vérifier l\'URL/la version dans external-apps.json, l\'accès réseau, puis relancer. Une app rejetée bloque la préparation (--strict).',
        );
      }
      const summary = lines.find((l) => /application\(s\) publiables/.test(l));
      ok(summary ? summary.replace(/^\[external-apps\]\s*/, '').replace(/ → .*$/, '') : 'synchronisation terminée');
      return summary ? (summary.match(/(\d+\/\d+)/) || ['', 'ok'])[1] + ' app(s)' : 'ok';
    },
  },
  {
    title: 'Contrôle du verrou',
    async run() {
      if (!hasExternals()) {
        info('sans objet (aucune app externe)');
        return 'sans objet';
      }
      const { code } = await run('sync-external-apps.mjs', ['--check']);
      if (code !== 0) {
        throw new StepError('le verrou n\'est plus conforme aux fichiers (dérive ou altération)', 'Relancer la préparation (la synchronisation reconstruit le verrou).');
      }
      ok('verrou conforme (empreintes SHA-256 vérifiées)');
      const locked = lockedExternals();
      const file = env.EGEN_CONFIG_FILE;
      if (locked.length && file) {
        let conf = {};
        try { conf = loadRuntimeConfig(resolve(ROOT, file)).config; } catch { /* déjà signalé à l'étape 2 */ }
        for (const name of locked) if (!(name in conf)) warn(`${name} : aucune entrée dans ${file} (valeurs par défaut)`);
      } else if (locked.length) {
        warn(`apps externes présentes mais EGEN_CONFIG_FILE non défini : ${locked.join(', ')}`);
      }
      return 'conforme';
    },
  },
  {
    title: 'Précompression',
    async run() {
      if (SKIP_PRECOMPRESS) {
        info('ignorée (--skip-precompress)');
        return 'ignorée';
      }
      const { code, lines } = await run('precompress.mjs');
      if (code !== 0) throw new StepError('la précompression a échoué (voir ci-dessus)', 'Relancer ; sinon --skip-precompress pour démarrer sans fichiers .br/.gz.');
      const summary = lines.find((l) => /fichiers/.test(l)) || 'terminée';
      ok(summary.replace(/^\[precompress\]\s*/, ''));
      return 'ok';
    },
  },
];

// ── Exécution ───────────────────────────────────────────────────────────────

const fmt = (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);
const t0 = Date.now();
const results = [];
let failed = null;

out();
out(bold('EGEN — préparation de la production') + dim('  (entre le build et le démarrage)'));
out(dim(`racine : ${ROOT}`));

for (const [i, step] of steps.entries()) {
  out();
  out(`${cyan(`[${i + 1}/${steps.length}]`)} ${bold(step.title)}`);
  if (failed) {
    info('non exécutée (étape précédente en échec)');
    results.push({ title: step.title, status: 'skipped' });
    continue;
  }
  const t = Date.now();
  try {
    const detail = await step.run();
    results.push({ title: step.title, status: 'ok', detail, ms: Date.now() - t });
  } catch (e) {
    const hint = e instanceof StepError ? e.hint : undefined;
    ko(red(e.message));
    if (hint) out(`      ${yellow('→')} ${hint}`);
    if (!(e instanceof StepError)) out(dim(String(e.stack || e)));
    failed = step.title;
    results.push({ title: step.title, status: 'failed', ms: Date.now() - t });
  }
}

out();
out(bold('Récapitulatif'));
for (const [i, r] of results.entries()) {
  const mark = r.status === 'ok' ? green('✓') : r.status === 'failed' ? red('✗') : dim('–');
  const detail = r.status === 'ok' ? dim(` ${r.detail} · ${fmt(r.ms)}`) : r.status === 'failed' ? red(` échec · ${fmt(r.ms)}`) : dim(' non exécutée');
  out(`  ${mark} ${i + 1}. ${r.title}${detail}`);
}
out();
if (failed) {
  out(red(bold(`Préparation INTERROMPUE à l'étape « ${failed} » (${fmt(Date.now() - t0)}).`)) + ' Le Core ne doit pas être démarré dans cet état.');
  process.exit(1);
}
const startCmd = `${env.EGEN_CONFIG_FILE ? `EGEN_CONFIG_FILE=${env.EGEN_CONFIG_FILE} ` : ''}yarn start:prod`;
out(green(bold(`Prêt en ${fmt(Date.now() - t0)}.`)) + ' Démarrer (ou redémarrer) le Core :');
out(`  ${bold(startCmd)}`);
out();
