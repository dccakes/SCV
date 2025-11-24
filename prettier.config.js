/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  semi: false,
  endOfLine: 'auto',
};

export default config;
