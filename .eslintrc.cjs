module.exports = {
  env: {
    browser: true,
    commonjs: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    // Because we are setting "type": "module" in our package.json, all `.js` files are treated as modules
    // Sometimes we will want a commonjs file, like this eslint config, in which case we use the .cjs extension
    extraFileExtensions: ['.cjs'],
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-unused-vars': 0,
    'no-global-assign': 0,
    'no-undef': 0,
  },
};
