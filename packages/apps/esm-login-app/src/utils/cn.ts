import classNames from 'classnames';

/** Concatène des classes conditionnelles (équivalent `cn` des composants Tailwind). */
export function cn(...inputs: classNames.ArgumentArray): string {
  return classNames(...inputs);
}
