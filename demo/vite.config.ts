import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// The demo imports the package source directly, so edits show up live with `npm run dev`.
// Two pages: the design-system demo (index.html) and the Raffle Builder on its own (builder.html).
export default defineConfig({
  root: import.meta.dirname, base: './', plugins: [react()],
  build: { rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), builder: resolve(import.meta.dirname, 'builder.html') } } },
});
