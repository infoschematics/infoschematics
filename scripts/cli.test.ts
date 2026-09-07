import { describe, expect, it } from 'vitest'
import { type CliSpec, CliUsageError, formatUsage, parseCli } from './cli.ts'

const spec: CliSpec = {
  describe: 'Exercise the shared command-line contract.',
  flags: {
    all: { describe: 'Every operand.', kind: 'boolean' },
    out: { describe: 'Output pathname.', kind: 'string', short: 'o', value: 'path' },
    width: { describe: 'Pixel width.', kind: 'number', value: 'n' }
  },
  operands: { describe: 'Named subject.', name: 'subject' },
  run: 'ki:example',
  script: 'scripts/example.ts'
}

describe('parseCli', () => {
  it('separates operands from flags', () => {
    const parsed = parseCli(spec, ['alpha', '--all', 'beta'])
    expect(parsed.operands).toEqual(['alpha', 'beta'])
    expect(parsed.boolean('all')).toBe(true)
  })

  it('reads values from a following argument or an inline assignment', () => {
    expect(parseCli(spec, ['--out', 'reports/a.svg']).string('out')).toBe('reports/a.svg')
    expect(parseCli(spec, ['--out=reports/b.svg']).string('out')).toBe('reports/b.svg')
    expect(parseCli(spec, ['-o', 'reports/c.svg']).string('out')).toBe('reports/c.svg')
  })

  it('does not mistake a flag value for an operand', () => {
    const parsed = parseCli(spec, ['--width', '900', 'alpha'])
    expect(parsed.number('width')).toBe(900)
    expect(parsed.operands).toEqual(['alpha'])
  })

  it('defaults absent flags without inventing values', () => {
    const parsed = parseCli(spec, [])
    expect(parsed.boolean('all')).toBe(false)
    expect(parsed.string('out')).toBeUndefined()
    expect(parsed.number('width')).toBeUndefined()
    expect(parsed.help).toBe(false)
  })

  it('treats everything after -- as an operand', () => {
    expect(parseCli(spec, ['--', '--all']).operands).toEqual(['--all'])
    expect(parseCli(spec, ['--', '--all']).boolean('all')).toBe(false)
  })

  it('accepts --help and -h without a command-specific declaration', () => {
    expect(parseCli(spec, ['--help']).help).toBe(true)
    expect(parseCli(spec, ['-h']).help).toBe(true)
  })

  it('rejects misuse rather than ignoring it', () => {
    expect(() => parseCli(spec, ['--unknown'])).toThrow(CliUsageError)
    expect(() => parseCli(spec, ['-z'])).toThrow(CliUsageError)
    expect(() => parseCli(spec, ['--out'])).toThrow(/--out needs a value/)
    expect(() => parseCli(spec, ['--width', 'wide'])).toThrow(/--width needs a number, received wide/)
    expect(() => parseCli(spec, ['--all=yes'])).toThrow(/--all takes no value/)
  })

  it('refuses to read a flag as the wrong kind', () => {
    expect(() => parseCli(spec, []).string('all')).toThrow(/no string flag --all/)
  })
})

describe('formatUsage', () => {
  it('documents both invocations, the operand, and every flag including help', () => {
    const usage = formatUsage(spec)
    expect(usage).toContain('Usage: scripts/example.ts [subject...] [options]')
    expect(usage).toContain('   or: bun run ki:example -- [subject...] [options]')
    expect(usage).toContain('subject: Named subject.')
    expect(usage).toContain('-o, --out <path>')
    expect(usage).toContain('--width <n>')
    expect(usage).toContain('-h, --help')
  })
})
