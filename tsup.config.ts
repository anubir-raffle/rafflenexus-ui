import { defineConfig } from 'tsup';

export default defineConfig({
  // Three entry points: the main one stays free of MUI and SweetAlert2; /inputs and /alerts need their peer dependencies.
  entry: { index: 'src/index.ts', inputs: 'src/inputs/index.ts', alerts: 'src/alerts/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2019',
  external: ['react', 'react-dom', 'react/jsx-runtime', /^@mui\//, /^@emotion\//, /^@react-input\//, 'moment', 'react-final-form', 'final-form', 'react-hot-toast', /^sweetalert2/],
  banner: { js: "'use client';" },
});
