import type { TokenPath } from './types';

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export const pathKey = (path: TokenPath): string => path.join('.');
export const parsePathKey = (key: string): string[] => (key === '' ? [] : key.split('.'));

export function getIn(obj: unknown, path: TokenPath): unknown {
  let cur: unknown = obj;
  for (const seg of path) {
    if (!isPlainObject(cur)) return undefined;
    cur = cur[seg];
  }
  return cur;
}

export const hasIn = (obj: unknown, path: TokenPath): boolean => getIn(obj, path) !== undefined;

/** Écriture immutable : seuls les nœuds du chemin sont recopiés. */
export function setIn<T extends Record<string, unknown>>(obj: T, path: TokenPath, value: unknown): T {
  if (path.length === 0) throw new Error('setIn: chemin vide');
  const [head, ...rest] = path;
  const child = obj[head];
  const next = rest.length === 0 ? value : setIn(isPlainObject(child) ? child : {}, rest, value);
  return { ...obj, [head]: next } as T;
}

/** Suppression immutable ; les objets devenus vides sont élagués (un override réinitialisé disparaît du JSON). */
export function unsetIn<T extends Record<string, unknown>>(obj: T, path: TokenPath): T {
  if (path.length === 0 || !isPlainObject(obj)) return obj;
  const [head, ...rest] = path;
  if (!(head in obj)) return obj;
  const copy: Record<string, unknown> = { ...obj };
  if (rest.length === 0) {
    delete copy[head];
  } else {
    const child = unsetIn(copy[head] as Record<string, unknown>, rest);
    if (isPlainObject(child) && Object.keys(child).length === 0) delete copy[head];
    else copy[head] = child;
  }
  return copy as T;
}

export interface Leaf {
  path: string[];
  value: unknown;
}

/** Liste toutes les feuilles (valeurs non-objets, tableaux compris) d'un document. */
export function listLeaves(obj: unknown, prefix: string[] = []): Leaf[] {
  if (!isPlainObject(obj)) return prefix.length ? [{ path: prefix, value: obj }] : [];
  return Object.entries(obj).flatMap(([k, v]) => listLeaves(v, [...prefix, k]));
}

/** Chemins (clés) dont la valeur diffère entre `a` et `b` (ajout, modification, suppression). */
export function diffPaths(a: unknown, b: unknown): string[] {
  const left = new Map(listLeaves(a).map((l) => [pathKey(l.path), JSON.stringify(l.value)]));
  const right = new Map(listLeaves(b).map((l) => [pathKey(l.path), JSON.stringify(l.value)]));
  const keys = new Set([...left.keys(), ...right.keys()]);
  return [...keys].filter((k) => left.get(k) !== right.get(k)).sort();
}
