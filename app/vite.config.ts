import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    // The dev harness lives one level up (../harness); allow vite to serve it.
    fs: { allow: ['..'] },
  },
  build: { target: 'esnext' },
})
