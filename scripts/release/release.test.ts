import { describe, expect, it } from 'vitest'
import { type PackedPackage, publicEntrySpecifiers, validatePackedPackage } from './pack-smoke.ts'
import {
  type PackageManifest,
  type ReleasePackage,
  releasePackages,
  releaseRepositoryUrl,
  validateReleaseManifests
} from './packages.ts'

const dependencies: Readonly<Record<string, readonly string[]>> = {
  '@infoschematics/domain-core': ['@infoschematics/domain-model'],
  '@infoschematics/domain-model': [],
  '@infoschematics/render-svg': ['@infoschematics/domain-model', '@infoschematics/view-model'],
  '@infoschematics/view-canvas': ['@infoschematics/domain-model', '@infoschematics/view-model'],
  '@infoschematics/view-model': ['@infoschematics/domain-model'],
  '@infoschematics/view-present': [
    '@infoschematics/domain-model',
    '@infoschematics/view-canvas',
    '@infoschematics/view-model'
  ],
  '@infoschematics/view-studio': [
    '@infoschematics/domain-core',
    '@infoschematics/domain-model',
    '@infoschematics/view-canvas',
    '@infoschematics/view-model',
    '@infoschematics/view-present'
  ]
}

const manifestFor = (entry: ReleasePackage, version = '1.2.3'): PackageManifest => ({
  dependencies: Object.fromEntries((dependencies[entry.name] ?? []).map((name) => [name, version])),
  description: `${entry.name} package`,
  engines: { node: '>=22' },
  exports: { '.': { import: './dist/index.js', types: './dist/index.d.ts' } },
  license: 'MIT',
  name: entry.name,
  publishConfig: { access: 'public' },
  repository: { directory: entry.directory, type: 'git', url: releaseRepositoryUrl },
  type: 'module',
  version
})

describe('coordinated release manifests', () => {
  it('fixes seven packages in deterministic dependency-first order', () => {
    expect(releasePackages.map(({ name }) => name)).toEqual([
      '@infoschematics/domain-model',
      '@infoschematics/domain-core',
      '@infoschematics/view-model',
      '@infoschematics/render-svg',
      '@infoschematics/view-canvas',
      '@infoschematics/view-present',
      '@infoschematics/view-studio'
    ])
    expect(validateReleaseManifests(releasePackages.map((entry) => ({ entry, manifest: manifestFor(entry) })))).toEqual(
      []
    )
  })

  it('rejects independently versioned packages and drifting internal ranges', () => {
    const packages = releasePackages.map((entry) => ({ entry, manifest: manifestFor(entry) }))
    packages[1] = {
      entry: releasePackages[1] as ReleasePackage,
      manifest: { ...packages[1]?.manifest, version: '1.2.4' }
    }
    packages[2] = {
      entry: releasePackages[2] as ReleasePackage,
      manifest: {
        ...packages[2]?.manifest,
        dependencies: { '@infoschematics/domain-model': '^1.2.3' }
      }
    }
    packages[3] = {
      entry: releasePackages[3] as ReleasePackage,
      manifest: {
        ...packages[3]?.manifest,
        engines: { node: '>=20' },
        publishConfig: { access: 'restricted' },
        repository: { directory: 'packages/wrong', url: 'https://example.test/wrong.git' }
      }
    }

    const errors = validateReleaseManifests(packages)
    expect(errors.some((error) => error.includes('versions must move together'))).toBe(true)
    expect(errors.some((error) => error.includes('dependencies.@infoschematics/domain-model'))).toBe(true)
    expect(errors.some((error) => error.includes('repository.url'))).toBe(true)
    expect(errors.some((error) => error.includes('repository.directory'))).toBe(true)
    expect(errors.some((error) => error.includes('engines.node'))).toBe(true)
    expect(errors.some((error) => error.includes('publishConfig.access'))).toBe(true)
  })
})

describe('packed public package inspection', () => {
  const entry = releasePackages.find(({ name }) => name === '@infoschematics/view-canvas') as ReleasePackage
  const manifest: PackageManifest = {
    description: 'Canvas',
    engines: { node: '>=22' },
    exports: {
      '.': { import: './dist/index.js', types: './dist/index.d.ts' },
      './styles.css': './dist/styles.css'
    },
    license: 'MIT',
    files: ['dist'],
    name: entry.name,
    publishConfig: { access: 'public' },
    repository: { directory: entry.directory, type: 'git', url: releaseRepositoryUrl },
    type: 'module',
    version: '1.2.3'
  }

  it('accepts only runtime, declarations, CSS and package metadata', () => {
    expect(
      validatePackedPackage(entry, manifest, [
        'README.md',
        'dist/LICENSE',
        'dist/index.d.ts',
        'dist/index.js',
        'dist/styles.css',
        'package.json'
      ])
    ).toEqual([])
  })

  it('rejects source, tests, missing declarations and exports outside dist', () => {
    const invalid = {
      ...manifest,
      engines: { node: '>=20' },
      files: [],
      publishConfig: { access: 'restricted' },
      repository: { directory: 'packages/wrong', url: 'https://example.test/wrong.git' },
      exports: { '.': './src/index.ts', './styles.css': './src/styles.css' }
    }
    const errors = validatePackedPackage(entry, invalid, ['package.json', 'src/index.ts', 'src/index.test.ts'])

    expect(errors.some((error) => error.includes('source or test file'))).toBe(true)
    expect(errors.some((error) => error.includes('runtime JavaScript'))).toBe(true)
    expect(errors.some((error) => error.includes('declaration types'))).toBe(true)
    expect(errors.some((error) => error.includes('must target dist'))).toBe(true)
    expect(errors.some((error) => error.includes('files metadata'))).toBe(true)
    expect(errors.some((error) => error.includes('dist/LICENSE'))).toBe(true)
    expect(errors.some((error) => error.includes('repository.url'))).toBe(true)
    expect(errors.some((error) => error.includes('repository.directory'))).toBe(true)
    expect(errors.some((error) => error.includes('engines.node'))).toBe(true)
    expect(errors.some((error) => error.includes('publishConfig.access'))).toBe(true)
  })

  it('expands wildcard runtime exports into every clean-consumer import', () => {
    const packed: PackedPackage = {
      entry: releasePackages[2] as ReleasePackage,
      files: ['dist/geometry.d.ts', 'dist/geometry.js', 'dist/index.d.ts', 'dist/index.js', 'package.json'],
      manifest: {
        ...manifest,
        exports: {
          './*': { import: './dist/*.js', types: './dist/*.d.ts' }
        },
        name: '@infoschematics/view-model'
      },
      tarball: '/tmp/view-model.tgz'
    }

    expect(publicEntrySpecifiers(packed).javascript).toEqual([
      '@infoschematics/view-model/geometry',
      '@infoschematics/view-model/index'
    ])
  })
})
