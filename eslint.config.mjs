import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-plugin-prettier/recommended'; // Import Prettier config

const eslintConfig = defineConfig([
  ...nextVitals,
  prettierConfig, // Add Prettier config to the extends array
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '*.mjs']),
]);

export default eslintConfig;
