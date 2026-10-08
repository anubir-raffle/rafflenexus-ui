import { defineConfig } from 'tsup';

export default defineConfig({
  // Two entry points: the main one stays free of MUI; /inputs needs the MUI peer dependencies.
  entry: { index: 'src/index.ts', inputs: 'src/inputs/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2019',
  external: ['react', 'react-dom', 'react/jsx-runtime', /^@mui\//, /^@emotion\//, /^@react-input\//, 'moment', 'react-final-form', 'final-form', 'react-hot-toast'],
  banner: { js: "'use client';" },
});
