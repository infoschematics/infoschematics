import { describe, expect, it } from 'vitest'
import { formatInfoschematicIssue, infoschematicFormatOf, parseInfoschematic } from './parse.ts'
import { serialiseInfoschematicJson, serialiseInfoschematicYaml } from './serialise.ts'

const json =
  '{ "id": "TWO", "title": "Two syntaxes", "diagram": { "bounds": { "x": 0, "y": 0, "width": 10, "height": 20 } } }'
const yaml = 'id: TWO\ntitle: Two syntaxes\ndiagram:\n  bounds: { x: 0, y: 0, width: 10, height: 20 }\n'

const issuesOf = (text: string, pathname = 'infoschematic.yaml') => {
  const parsed = parseInfoschematic(text, { pathname })
  if (parsed.ok) throw new Error('expected the document to be rejected')
  return parsed.issues
}

describe('infoschematicFormatOf', () => {
  it('recognises YAML and JSON paths as one YAML-based format', () => {
    expect(infoschematicFormatOf('a/b.yaml')).toBe('yaml')
    expect(infoschematicFormatOf('a/b.YML')).toBe('yaml')
    expect(infoschematicFormatOf('a/b.json')).toBe('yaml')
    expect(infoschematicFormatOf('a/b.ts')).toBeUndefined()
    expect(infoschematicFormatOf('a.json/b')).toBeUndefined()
  })
})

describe('parseInfoschematic', () => {
  it('normalises YAML and JSON syntax through the same parser', () => {
    const fromJson = parseInfoschematic(json)
    const fromYaml = parseInfoschematic(yaml)
    expect(fromJson.ok && fromYaml.ok).toBe(true)
    if (!fromJson.ok || !fromYaml.ok) return
    expect(fromJson.model).toEqual(fromYaml.model)
    expect(fromYaml.model.diagram.cards).toEqual([])
  })

  it('uses a pathname only to address diagnostics', () => {
    expect(parseInfoschematic(yaml, { pathname: 'infoschematic.json' }).ok).toBe(true)
    expect(issuesOf('title: 4\n', 'broken.yaml')[0]?.document).toBe('broken.yaml')
  })

  it('reports syntax and contract faults through one issue shape', () => {
    const syntax = issuesOf('title: [unclosed\n')
    expect(syntax[0]?.path).toBe('')
    expect(syntax[0]?.message).toMatch(/^Malformed YAML: /)

    const wrongType = issuesOf('id: WRONG\ntitle: Wrong\ndiagram:\n  bounds: { x: 0, y: 0, width: wide, height: 20 }\n')
    expect(wrongType.map((issue) => issue.path)).toEqual(['diagram.bounds.width'])
  })

  it('names missing canonical fields', () => {
    expect(issuesOf('title: No id or diagram\n').map((issue) => issue.path)).toEqual(['id', 'diagram'])
  })

  it('reports referential faults the shape alone cannot catch', () => {
    const document = [
      'id: DANGLING',
      'title: Dangling',
      'diagram:',
      '  bounds: { x: 0, y: 0, width: 10, height: 10 }',
      '  cards:',
      '    - id: A',
      '      label: A',
      '      bounds: { x: 0, y: 0, width: 1, height: 1 }',
      '  flows:',
      '    - id: F',
      '      source: { element: A, port: E1 }',
      '      target: { element: MISSING, port: W1 }',
      ''
    ].join('\n')
    expect(issuesOf(document)[0]?.message).toMatch(/references unknown id: MISSING/)
  })

  it('admits only JSON-compatible YAML values', () => {
    expect(issuesOf(yaml.replace('id: TWO', 'id: .inf'))[0]?.message).toMatch(/finite JSON number/)
    expect(issuesOf(yaml.replace('id: TWO', 'id: !runtime TWO'))[0]?.message).toMatch(/Malformed YAML/)
    expect(
      issuesOf(
        '&root\nid: TWO\ntitle: Cyclic\ndiagram: { bounds: { x: 0, y: 0, width: 1, height: 1 } }\ncycle: *root\n'
      )[0]?.message
    ).toMatch(/Cyclic YAML aliases/)
  })

  it('lets a document point an editor at its schema', () => {
    const document =
      '{ "$schema": "./x.json", "id": "EDITOR", "title": "Editor", "diagram": { "bounds": { "x": 0, "y": 0, "width": 1, "height": 1 } } }'
    expect(parseInfoschematic(document).ok).toBe(true)
  })

  it('emits YAML for authoring and deterministic JSON for interchange', () => {
    const parsed = parseInfoschematic(yaml)
    if (!parsed.ok) throw new Error('fixture should parse')

    expect(parseInfoschematic(serialiseInfoschematicYaml(parsed.model))).toEqual(parsed)
    expect(parseInfoschematic(serialiseInfoschematicJson(parsed.model))).toEqual(parsed)
    expect(JSON.parse(serialiseInfoschematicJson(parsed.model)).diagram.bounds).toBe('0 0 10 20')
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
