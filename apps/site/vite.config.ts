import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  envDir: projectRoot,
  plugins: [react()],
  resolve: {
    // The @infoschematics packages are path dependencies compiled from source:
    // without dedupe their own node_modules would supply a second React.
    dedupe: ['react', 'react-dom']
  },
  build: {
    emptyOutDir: true,
    outDir: fileURLToPath(new URL('./dist', import.meta.url))
  },
  server: {
    port: 4173,
    strictPort: false
  },
  test: {
    include: [
      fileURLToPath(new URL('./src/**/*.test.ts', import.meta.url)),
      fileURLToPath(new URL('./src/**/*.test.tsx', import.meta.url))
    ]
  }
})
