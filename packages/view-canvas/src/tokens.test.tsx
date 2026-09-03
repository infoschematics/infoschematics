import { readFile } from 'node:fs/promises'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { defineInfoschematic } from '@infoschematics/domain-core'
import { visualTokens } from '@infoschematics/view-model/tokens'

import { Canvas } from './Canvas.tsx'

const cssValue = (css: string, name: string) =>
  css.match(new RegExp(`${name}: ([^;]+);`))?.[1]

describe('Canvas visual tokens', () => {
  it('consumes only generated custom properties for shared CSS decisions', async () => {
    const styles = await readFile(new URL('./styles.css', import.meta.url), 'utf8')
    const generated = await readFile(
      new URL('../../view-model/src/tokens.generated.css', import.meta.url),
      'utf8',
    )

    expect(styles).toContain('@import "@infoschematics/view-model/tokens.css";')

    const references = [...styles.matchAll(/var\((--infoschematic-canvas-[a-z-]+)\)/g)].map(
      ([, name]) => name,
    )
    expect(references.length).toBeGreaterThan(0)
    for (const name of references) expect(cssValue(generated, name)).toBeDefined()

    expect(cssValue(generated, '--infoschematic-canvas-surfaces-backdrop')).toBe(
      visualTokens.canvas.surfaces.backdrop,
    )
    expect(cssValue(generated, '--infoschematic-canvas-flows-route-width')).toBe(
      String(visualTokens.canvas.flows.routeWidth),
    )
    expect(styles).toContain(
      'stroke-width: var(--infoschematic-canvas-flows-route-width);',
    )
    expect(styles).toContain(
      'stroke-width: var(--infoschematic-canvas-geometry-grid-minor-stroke-width);',
    )
    expect(styles).toContain(
      'stroke-width: var(--infoschematic-canvas-geometry-grid-major-stroke-width);',
    )
    expect(styles).toContain(
      '.infoschematic-svg.surface-neutral .infoschematic-backdrop',
    )
    expect(styles).toContain('fill: var(--infoschematic-canvas-output-backdrop);')
    expect(styles).toContain('stroke-dasharray: var(--infoschematic-canvas-surfaces-region-dash);')
    expect(styles).toContain('stroke-dasharray: var(--infoschematic-canvas-surfaces-region-dot);')
  })

  it('uses the manifest for component and editing-grid geometry', async () => {
    const source = await readFile(
      new URL('./InfoschematicDiagram.tsx', import.meta.url),
      'utf8',
    )
    const markup = renderToStaticMarkup(
      <Canvas
        config={defineInfoschematic({ title: 'Token geometry' })}
        grid
        mode="design"
      />,
    )

    expect(source).toContain('} = visualTokens.canvas.geometry')
    expect(source).not.toMatch(
      /const (?:addReach|attachmentReach|cornerRadius|dragThreshold|gridMajorSize|gridSize) = \d/,
    )
    expect(markup).toContain(
      `<pattern height="${visualTokens.canvas.geometry.gridSize}" id="infoschematic-grid-minor"`,
    )
    expect(markup).toContain(
      `<pattern height="${visualTokens.canvas.geometry.gridMajorSize}" id="infoschematic-grid-major"`,
    )
  })

  it('keeps authored Scope, Flow-family and Zone colours in rendered data', () => {
    const markup = renderToStaticMarkup(
      <Canvas
        config={defineInfoschematic({
          title: 'Authored colours',
          infoschematic: {
            cards: [
              {
                code: 'SCP-001',
                detail: 'Authored data',
                id: 'card',
                label: 'Card',
                placement: {
                  box: { height: 60, width: 120, x: 20, y: 30 },
                  ports: {},
                },
                scope: 'scope',
                scopes: ['scope'],
              },
            ],
            flowFamilies: [
              {
                color: '#a12345',
                description: 'Authored family',
                id: 'family',
                label: 'Family',
                prefix: 'FAM',
              },
            ],
            lanes: [
              {
                height: 120,
                id: 'lane',
                label: 'Lane',
                labelY: 18,
                panel: { height: 120, radius: 8, width: 180, x: 0, y: 0 },
                y: 0,
                zones: [
                  {
                    fill: '#c1d2e3',
                    id: 'zone',
                    label: 'Zone',
                    width: 180,
                    x: 0,
                  },
                ],
              },
            ],
            scopes: [
              {
                color: '#123456',
                description: 'Authored scope',
                fill: '#abcdef',
                id: 'scope',
                label: 'Scope',
                prefix: 'SCP',
              },
            ],
          },
        })}
      />,
    )

    expect(markup).toContain('fill="#abcdef"')
    expect(markup).toContain('stroke="#123456"')
    expect(markup).toContain('fill="#a12345"')
    expect(markup).toContain('fill="#c1d2e3"')
  })
})
