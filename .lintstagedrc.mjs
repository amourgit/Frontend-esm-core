export default {
  '*.{ts,tsx}': 'eslint --cache --fix --max-warnings 0',
  '*.{css,ts,tsx}': 'prettier --write --list-different',
};
