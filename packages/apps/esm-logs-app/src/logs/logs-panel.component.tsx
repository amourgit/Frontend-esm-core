import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, Copy, Download, Pause, Play, Search, Trash2, WrapText } from 'lucide-react';
import { parseAnsi, stripAnsi } from './ansi';
import { clearLogs, LOG_LEVELS, setLogsPaused, useLogs, type LogConnection, type LogLevel, type LogLine } from './log-store';
import styles from './logs-panel.scss';

// =============================================================================
//  LOGS SYSTÈME — contenu de la zone basse
//
//  Affiche, en temps réel, la sortie complète du terminal (`egen develop`) et la console du
//  navigateur : couleurs d'origine (ANSI) conservées, niveaux colorés (erreur, avertissement,
//  succès, info, debug), filtres, recherche, pause, copie et export.
// =============================================================================

const PAGE = 1500;
const ALL = '*';


const pad = (n: number, size = 2) => String(n).padStart(size, '0');
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

const LogRow = React.memo(function LogRow({ line, wrap }: { line: LogLine; wrap: boolean }) {
  const segments = useMemo(() => parseAnsi(line.message), [line.message]);
  return (
    <div className={styles.row} data-level={line.level} data-wrap={wrap} role="listitem">
      <time className={styles.time}>{formatTime(line.ts)}</time>
      <span className={styles.source} title={line.source}>
        {line.source}
      </span>
      <span className={styles.message}>
        {segments.map((segment, index) => (
          <span
            key={index}
            style={{ color: segment.color }}
            data-bold={segment.bold || undefined}
            data-dim={segment.dim || undefined}
            data-italic={segment.italic || undefined}
            data-underline={segment.underline || undefined}
          >
            {segment.text}
          </span>
        ))}
      </span>
    </div>
  );
});

const LogsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { lines, counts, connection, paused, pending } = useLogs();

  const [query, setQuery] = useState('');
  const [enabled, setEnabled] = useState<Record<LogLevel, boolean>>({ error: true, warn: true, success: true, info: true, debug: true });
  const [source, setSource] = useState(ALL);
  const [wrap, setWrap] = useState(true);
  const [follow, setFollow] = useState(true);
  const [limit, setLimit] = useState(PAGE);
  const listRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query);

  const sources = useMemo(() => Array.from(new Set(lines.map((line) => line.source))).sort(), [lines]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return lines.filter(
      (line) =>
        enabled[line.level] &&
        (source === ALL || line.source === source) &&
        (needle === '' || stripAnsi(line.message).toLowerCase().includes(needle) || line.source.toLowerCase().includes(needle)),
    );
  }, [lines, enabled, source, deferredQuery]);

  const visible = filtered.length > limit ? filtered.slice(filtered.length - limit) : filtered;

  // Suivi du bas : actif tant que l'utilisateur n'a pas remonté dans la liste.
  useEffect(() => {
    const el = listRef.current;
    if (follow && el) el.scrollTop = el.scrollHeight;
  }, [visible, follow]);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  }, []);

  const toggleLevel = (level: LogLevel) => setEnabled((current) => ({ ...current, [level]: !current[level] }));

  const asText = () =>
    filtered.map((line) => `${new Date(line.ts).toISOString()} [${line.source}] ${line.level.toUpperCase()} ${stripAnsi(line.message)}`).join('\n');

  const copy = () => void navigator.clipboard?.writeText(asText());

  const download = () => {
    const url = URL.createObjectURL(new Blob([asText()], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `egen-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.panel} aria-label={t('logs', 'Logs système')}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search', 'Rechercher dans les logs')}
            aria-label={t('search', 'Rechercher dans les logs')}
          />
        </label>

        <div className={styles.levels} role="group" aria-label={t('levels', 'Niveaux')}>
          {LOG_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={styles.chip}
              data-level={level}
              aria-pressed={enabled[level]}
              onClick={() => toggleLevel(level)}
            >
              {levelLabel(level, t)}
              <b>{counts[level]}</b>
            </button>
          ))}
        </div>

        <select className={styles.select} value={source} onChange={(event) => setSource(event.target.value)} aria-label={t('source', 'Source')}>
          <option value={ALL}>{t('allSources', 'Toutes les sources')}</option>
          {sources.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <div className={styles.actions}>
          <button type="button" className={styles.iconButton} onClick={() => setLogsPaused(!paused)} aria-pressed={paused} title={paused ? t('resume', 'Reprendre') : t('pause', 'Pause')}>
            {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          </button>
          <button type="button" className={styles.iconButton} onClick={() => setWrap(!wrap)} aria-pressed={wrap} title={t('wrap', 'Retour à la ligne')}>
            <WrapText size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              setFollow(true);
              const el = listRef.current;
              if (el) el.scrollTop = el.scrollHeight;
            }}
            aria-pressed={follow}
            title={t('follow', 'Suivre les nouveaux logs')}
          >
            <ArrowDownToLine size={15} aria-hidden="true" />
          </button>
          <button type="button" className={styles.iconButton} onClick={copy} title={t('copy', 'Copier')}>
            <Copy size={15} aria-hidden="true" />
          </button>
          <button type="button" className={styles.iconButton} onClick={download} title={t('download', 'Télécharger (.log)')}>
            <Download size={15} aria-hidden="true" />
          </button>
          <button type="button" className={styles.iconButton} onClick={clearLogs} title={t('clear', 'Effacer')}>
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={listRef} className={styles.list} role="list" onScroll={onScroll} data-testid="logs-list">
        {filtered.length > visible.length && (
          <button type="button" className={styles.more} onClick={() => setLimit(limit + PAGE)}>
            {t('older', '{{n}} lignes plus anciennes — afficher', { n: filtered.length - visible.length })}
          </button>
        )}
        {visible.map((line) => (
          <LogRow key={line.uid} line={line} wrap={wrap} />
        ))}
        {visible.length === 0 && <p className={styles.empty}>{lines.length === 0 ? t('empty', 'En attente de logs…') : t('noMatch', 'Aucun log ne correspond aux filtres')}</p>}
      </div>

      <footer className={styles.status}>
        <span className={styles.connection} data-state={connection}>
          {connectionLabel(connection, t)}
        </span>
        <span>{t('lineCount', '{{shown}} / {{total}} lignes', { shown: filtered.length, total: lines.length })}</span>
        {paused && <span className={styles.paused}>{t('pausedPending', 'En pause — {{n}} en attente', { n: pending })}</span>}
      </footer>
    </section>
  );
};

// Appels t() littéraux : l'extracteur i18next ne sait pas lire des clés calculées.
function levelLabel(level: LogLevel, t: (key: string, fallback: string) => string): string {
  switch (level) {
    case 'error':
      return t('levelError', 'Erreurs');
    case 'warn':
      return t('levelWarn', 'Avertissements');
    case 'success':
      return t('levelSuccess', 'Succès');
    case 'info':
      return t('levelInfo', 'Infos');
    default:
      return t('levelDebug', 'Debug');
  }
}

function connectionLabel(state: LogConnection, t: (key: string, fallback: string) => string): string {
  switch (state) {
    case 'live':
      return t('connLive', 'Terminal connecté — temps réel');
    case 'connecting':
      return t('connConnecting', 'Connexion au terminal…');
    case 'unavailable':
      return t('connUnavailable', 'Terminal indisponible (reconnexion impossible)');
    default:
      return t('connDisabled', 'Console du navigateur uniquement (lancer avec egen develop pour le terminal)');
  }
}

export default LogsPanel;
