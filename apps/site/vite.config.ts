import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

// The path the schema's own $id declares. An editor resolves that URL literally, so publishing it anywhere
// else means every authored modeline points at a 404.
const schemaPath = '/schema/infoschematic.schema.json'
const schemaSource = new URL('../../packages/domain-core/schema/infoschematic.schema.json', import.meta.url)

/**
 * Publish the generated JSON Schema at its declared $id, in development and in the built site alike.
 *
 * It is read from the generated file rather than copied into `public/`, because a second committed copy drifts
 * silently and `self:schema:verify` already proves the generated one matches the runtime contract.
 */
const publishSchema = (): Plugin => ({
  name: 'infoschematics-publish-schema',
  configureServer(server) {
    server.middlewares.use(schemaPath, (_request, response) => {
      response.setHeader('Content-Type', 'application/schema+json')
      response.setHeader('Access-Control-Allow-Origin', '*')
      response.end(readFileSync(schemaSource))
    })
  },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: schemaPath.slice(1), source: readFileSync(schemaSource) })
  }
})

export default defineConfig({
  // Stamped at build time so the footer states when the site was last published.
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  envDir: projectRoot,
  plugins: [react(), publishSchema()],
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
