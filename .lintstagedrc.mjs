export default {
  '*.{ts,tsx}': 'eslint --cache --fix --max-warnings 0',
  '*.{css,scss,ts,tsx}': 'prettier --write --list-different',
};
