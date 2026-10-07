import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The demo imports the package source directly, so edits show up live with `npm run dev`.
export default defineConfig({ root: __dirname, base: './', plugins: [react()] });
