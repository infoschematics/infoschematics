import { defineInfoschematic } from '@infoschematics/domain-core'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Canvas } from './Canvas.tsx'
import './styles.css'

const config = defineInfoschematic({
  title: 'Responsive detail',
  infoschematic: {
    appearance: {
      card: { compact: true, description: true, identity: true, stereotype: true }
    },
    cards: [
      {
        code: 'CARD-001',
        detail: 'Optional explanatory detail',
        id: 'card',
        label: 'Responsive Card',
        placement: { box: { height: 100, width: 240, x: 180, y: 150 }, ports: {} },
        scope: 'scope',
        scopes: ['scope'],
        stereotype: 'service'
      }
    ],
    scopes: [{ color: '#2463eb', description: 'Cards', fill: '#dbeafe', id: 'scope', label: 'Scope', prefix: 'CARD' }],
    viewBox: { height: 400, width: 600, x: 0, y: 0 }
  }
})

test('responsive Card detail follows the measured Canvas size without losing accessible metadata', async () => {
  const full = await render(
    <div style={{ height: 400, width: 600 }}>
      <Canvas config={config} responsiveCardDetails />
    </div>
  )

  await expect.poll(() => full.container.querySelectorAll('[data-card-detail]').length).toBe(3)
  await full.unmount()

  const narrow = await render(
    <div style={{ height: 200, width: 300 }}>
      <Canvas config={config} responsiveCardDetails />
    </div>
  )

  await expect.poll(() => narrow.container.querySelector('[data-card-detail="description"]')).toBeNull()
  expect(narrow.container.querySelector('[data-card-detail="identity"]')).toBeNull()
  expect(narrow.container.querySelector('[data-card-detail="stereotype"]')).not.toBeNull()
  expect(narrow.container.querySelector('g.infoschematic-service')?.getAttribute('aria-label')).toBe(
    'CARD-001 · Responsive Card · service · Optional explanatory detail'
  )
})

test('omitting responsive detail preserves the authored treatment at the same narrow size', async () => {
  const output = await render(
    <div style={{ height: 120, width: 180 }}>
      <Canvas config={config} />
    </div>
  )

  await expect.poll(() => output.container.querySelectorAll('[data-card-detail]').length).toBe(3)
})
