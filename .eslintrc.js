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
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    'no-unused-vars': 'warn'
  },
};
