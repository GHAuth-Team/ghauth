module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  globals: {
    CryptoJS: false,
    notyf: false,
    Notyf: false,
    skinview3d: false,
    bsCustomFileInput: false,
  },
  plugins: [
    'pug',
  ],
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'global-require': 0,
    'no-bitwise': 0,
    'max-len': 0,
    'no-console': 0,
    'no-useless-escape': 0,
    'no-await-in-loop': 0,
    'no-restricted-syntax': 0,
  },
};
