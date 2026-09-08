import { describe, expect, it } from 'vitest'
import { formatInfoschematicIssue, infoschematicFormatOf, parseInfoschematic } from './parse.ts'

const json = '{ "title": "Two formats", "infoschematic": { "viewBox": { "x": 0, "y": 0, "width": 10, "height": 20 } } }'
const yaml = 'title: Two formats\ninfoschematic:\n  viewBox: { x: 0, y: 0, width: 10, height: 20 }\n'

const issuesOf = (text: string, pathname: string) => {
  const parsed = parseInfoschematic(text, { pathname })
  if (parsed.ok) throw new Error('expected the document to be rejected')
  return parsed.issues
}

describe('infoschematicFormatOf', () => {
  it('reads the format from the extension and admits nothing else', () => {
    expect(infoschematicFormatOf('a/b.json')).toBe('json')
    expect(infoschematicFormatOf('a/b.yaml')).toBe('yaml')
    expect(infoschematicFormatOf('a/b.YML')).toBe('yaml')
    expect(infoschematicFormatOf('a/b.toml')).toBeUndefined()
    expect(infoschematicFormatOf('a.json/b')).toBeUndefined()
  })
})

describe('parseInfoschematic', () => {
  it('normalises either format into the same config', () => {
    const fromJson = parseInfoschematic(json, { format: 'json' })
    const fromYaml = parseInfoschematic(yaml, { format: 'yaml' })
    expect(fromJson.ok && fromYaml.ok).toBe(true)
    if (!fromJson.ok || !fromYaml.ok) return
    expect(fromJson.config).toEqual(fromYaml.config)
    expect(fromJson.config.infoschematic.appearance).toEqual({
      surface: 'neutral',
      grid: 'none',
      card: { compact: false, identity: false, stereotype: false, description: false }
    })
  })

  it('infers the format from a pathname and addresses diagnostics to it', () => {
    expect(parseInfoschematic(yaml, { pathname: 'infoschematic.yaml' }).ok).toBe(true)
    expect(issuesOf('title: 4\n', 'broken.yaml')[0]?.document).toBe('broken.yaml')
  })

  it('refuses to guess a parser it was never given', () => {
    expect(issuesOf(json, 'infoschematic.toml')[0]?.message).toMatch(/no supported extension/)
    const parsed = parseInfoschematic(json)
    expect(parsed.ok).toBe(false)
  })

  it('reports unparseable syntax in the same shape as a contract violation', () => {
    const jsonSyntax = issuesOf('{ "title": }', 'a.json')
    expect(jsonSyntax).toHaveLength(1)
    expect(jsonSyntax[0]?.path).toBe('')
    expect(jsonSyntax[0]?.message).toMatch(/^Malformed JSON: /)

    const yamlSyntax = issuesOf('title: [unclosed\n', 'a.yaml')
    expect(yamlSyntax[0]?.path).toBe('')
    expect(yamlSyntax[0]?.message).toMatch(/^Malformed YAML: /)
  })

  it('names the path of a value of the wrong type', () => {
    const document = 'title: Wrong\ninfoschematic:\n  viewBox: { x: 0, y: 0, width: wide, height: 20 }\n'
    expect(issuesOf(document, 'a.yaml').map((issue) => issue.path)).toEqual(['infoschematic.viewBox.width'])
  })

  it('names a missing required field', () => {
    expect(issuesOf('subtitle: No title\n', 'a.yaml').map((issue) => issue.path)).toEqual(['title'])
  })

  it('reports a referential fault the shape alone cannot catch', () => {
    const document = [
      'title: Dangling',
      'infoschematic:',
      '  cards:',
      '    - id: a',
      '      code: A',
      '      label: A',
      '      detail: A',
      '      scopes: []',
      '      scope: core',
      '      domain: missing',
      '      placement: { box: { x: 0, y: 0, width: 1, height: 1 } }',
      ''
    ].join('\n')
    expect(issuesOf(document, 'a.yaml')[0]?.message).toMatch(/references unknown Domain: missing/)
  })

  it('lets a document point an editor at its schema without failing strict validation', () => {
    expect(parseInfoschematic('{ "$schema": "./x.json", "title": "Editor" }', { format: 'json' }).ok).toBe(true)
  })
})

describe('formatInfoschematicIssue', () => {
  it('renders one printable line, whether or not the document is named', () => {
    expect(formatInfoschematicIssue({ path: 'title', message: 'Required', document: 'a.yaml' })).toBe(
      'a.yaml:title Required'
    )
    expect(formatInfoschematicIssue({ path: '', message: 'Malformed YAML' })).toBe('<document> Malformed YAML')
  })
})
