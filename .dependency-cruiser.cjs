/**
 * The seams of the source, stated as rules rather than habits.
 *
 * Carried over from the first realisation (5g-emerge-ibc-2026, IBC2026-DBD-018):
 * the baseline states today's boundaries, and every move tightens these rules
 * in the same commit that makes it.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'A cycle is two owners disagreeing about who is on top.',
      severity: 'error',
      from: {},
      to: { circular: true }
    },
    {
      name: 'app-is-mounted-not-borrowed',
      comment:
        "src/app is the realisation's composition root: the entry mounts it, and nothing else reaches into it.",
      severity: 'error',
      from: { path: '^workspaces/app/src', pathNot: '^workspaces/app/src/(app|index\\.ts)' },
      to: { path: '^workspaces/app/src/app' }
    },
    {
      name: 'entry-stays-thin',
      comment: 'src/index.ts only exports the public surface: the app, and nothing else.',
      severity: 'error',
      from: { path: '^workspaces/app/src/index\\.ts$' },
      to: { pathNot: '^workspaces/app/src/app|node_modules' }
    },
    {
      name: 'diagram-stays-generic',
      comment:
        "src/diagram is the framework side: geometry, ports, routing, guides. It never learns the realisation's nouns.",
      severity: 'error',
      from: { path: '^workspaces/core/src' },
      to: { path: '^workspaces/(model|app)/src' }
    },
    {
      name: 'model-stays-framework-neutral',
      comment: 'The product model may use core primitives and never reaches into a UI adapter.',
      severity: 'error',
      from: { path: '^workspaces/model/src' },
      to: { path: '^workspaces/app/src' }
    },
    {
      name: 'library-stays-reusable',
      comment:
        "src/library is reusable authored artwork: it may reach the framework's geometry, never this realisation's model or data.",
      severity: 'error',
      from: { path: '^workspaces/app/src/library' },
      to: { path: '^workspaces/app/src/app' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.base.json' }
  }
}
