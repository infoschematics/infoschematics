import { defineInfoschematic } from '@infoschematics/domain-core'

// One editorial pipeline: the same four stages the homepage tells in prose,
// authored as serialisable data so every renderer can carry the story.
const stageCard = (
  code: string,
  id: string,
  label: string,
  detail: string,
  domain: string,
  stereotype: string,
  x: number,
) => ({
  code,
  detail,
  domain,
  id,
  label,
  placement: {
    box: { height: 120, width: 240, x, y: 230 },
    ports: { east: 1, west: 1 },
  },
  scope: 'system',
  scopes: ['system'],
  stereotype,
})

const connector = (code: string, id: string, source: string, target: string, x: number) => ({
  code,
  family: 'progression',
  id,
  label: { along: 0.5 },
  points: [
    { x, y: 290 },
    { x: x + 100, y: 290 },
  ],
  source,
  sourcePort: 'E1' as const,
  target,
  targetPort: 'W1' as const,
})

export const systemExample = defineInfoschematic({
  id: 'system-explained',
  title: 'A system, explained',
  subtitle: 'From observed signals to a shared view',
  synopsis:
    'Observation gathers signals, arrangement gives them structure, illumination draws out meaning, and the result is a view a whole team can share.',
  infoschematic: {
    viewBox: { height: 600, width: 1400, x: 0, y: 0 },
    appearance: {
      card: { compact: false, description: true, identity: true, stereotype: true },
      grid: 'major-plus-minor',
      surface: 'blueprint',
    },
    domains: [
      { color: '#9673a6', fill: '#0d1b2a', id: 'observe', label: 'Observe' },
      { color: '#6c8ebf', fill: '#0d1b2a', id: 'arrange', label: 'Arrange' },
      { color: '#b85450', fill: '#0d1b2a', id: 'illuminate', label: 'Illuminate' },
      { color: '#82b366', fill: '#0d1b2a', id: 'understand', label: 'Understand' },
    ],
    scopes: [
      {
        color: '#79c9ff',
        description: 'The system being explained',
        fill: '#0d1b2a',
        id: 'system',
        label: 'System',
        prefix: 'SYS',
      },
    ],
    flowFamilies: [
      {
        color: '#79c9ff',
        description: 'Each stage hands its result to the next',
        id: 'progression',
        label: 'Progresses to',
        prefix: 'STG',
      },
    ],
    lanes: [
      {
        appearance: { frame: 'solid', label: 'north-west', labelTreatment: 'notched' },
        height: 300,
        id: 'journey',
        label: 'Infoschematic',
        labelY: 168,
        panel: { height: 300, radius: 12, width: 1360, x: 20, y: 140 },
        y: 140,
        zones: [],
      },
    ],
    cards: [
      stageCard('OBS-01', 'signals', 'Signals', 'Facts, events and relationships', 'observe', 'Observe', 70),
      stageCard('MAP-02', 'structure', 'Structure', 'Systems, boundaries and flow', 'arrange', 'Arrange', 410),
      stageCard('LIT-03', 'meaning', 'Meaning', 'Stories, scenes and evidence', 'illuminate', 'Illuminate', 750),
      stageCard('SEE-04', 'shared-view', 'Shared view', 'Complexity made legible', 'understand', 'Understand', 1090),
    ],
    flows: [
      connector('SELECT', 'select', 'signals', 'structure', 310),
      connector('CONNECT', 'connect', 'structure', 'meaning', 650),
      connector('REVEAL', 'reveal', 'meaning', 'shared-view', 990),
    ],
  },
})
