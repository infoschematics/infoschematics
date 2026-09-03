import { copyFile, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDirectory = dirname(fileURLToPath(import.meta.url))
const distDirectory = resolve(packageDirectory, 'dist')
const extensionPattern = /(["'])(\.\.?\/[^"'\n]+)\.(cts|mts|tsx|ts)(["'])/g
const replacements = { cts: 'cjs', mts: 'mjs', ts: 'js', tsx: 'js' }

const rewriteDeclarations = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      await rewriteDeclarations(path)
    } else if (entry.name.endsWith('.d.ts')) {
      const source = await readFile(path, 'utf8')
      const rewritten = source.replace(
        extensionPattern,
        (_match, open, specifier, extension, close) =>
          `${open}${specifier}.${replacements[extension]}${close}`,
      )
      if (rewritten !== source) await writeFile(path, rewritten)
    }
  }
}

if (process.argv[2] === '--clean') {
  await rm(distDirectory, { force: true, recursive: true })
} else {
  await rewriteDeclarations(distDirectory)
  const assets = process.argv.slice(2)
  if (assets.length % 2 !== 0) throw new Error('Assets must be provided as source/destination pairs')
  for (let index = 0; index < assets.length; index += 2) {
    await copyFile(resolve(packageDirectory, assets[index]), resolve(packageDirectory, assets[index + 1]))
  }
}
