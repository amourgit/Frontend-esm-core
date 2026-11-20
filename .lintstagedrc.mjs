// Le code tiers vendorisé (TweakCN dans le Theme Studio) est exclu d'eslint : voir .eslintignore.
// Les fichiers ignorés passés explicitement à eslint compteraient comme warnings (--max-warnings 0).
const VENDORED = '/esm-theme-studio-app/src/tweakcn/';

export default {
  '*.{ts,tsx}': (files) => {
    const linted = files.filter((file) => !file.includes(VENDORED));
    return linted.length ? [`eslint --cache --fix --max-warnings 0 ${linted.map((f) => `"${f}"`).join(' ')}`] : [];
  },
  '*.{css,ts,tsx}': 'prettier --write --list-different',
};
