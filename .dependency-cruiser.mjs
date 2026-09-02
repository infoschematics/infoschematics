/**
 * Architectural dependency rules for the Infoschematics workspace families.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
const config = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'A cycle is two owners disagreeing about who is on top.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'studio-is-mounted-not-borrowed',
      comment: "src/app is Studio's composition root: entry mounts it, nothing else reaches into it.",
      severity: 'error',
      from: {
        path: '^packages/view-studio/src',
        pathNot: '^packages/view-studio/src/(app|index\\.ts)',
      },
      to: { path: '^packages/view-studio/src/app' },
    },
    {
      name: 'entry-stays-thin',
      comment: 'src/index.ts only exports the public Studio surface.',
      severity: 'error',
      from: { path: '^packages/view-studio/src/index\\.ts$' },
      to: { pathNot: '^packages/view-studio/src/app|node_modules' },
    },
    {
			name: 'view-model-stays-generic',
			comment: 'The view model may consume domain data, but never application, authored-example or deployment code.',
			severity: 'error',
			from: { path: '^packages/view-model/src' },
			to: {
				path: '^(packages|apps|examples)/',
				pathNot: '^packages/(domain-model|view-model)/src',
			},
		},
		{
			name: 'domain-model-has-no-workspace-dependencies',
			comment: 'The serialisable domain contract is the dependency root and imports no other workspace.',
			severity: 'error',
			from: { path: '^packages/domain-model/src' },
			to: {
				path: '^(packages|apps|examples)/',
				pathNot: '^packages/domain-model/src',
			},
		},
		{
			name: 'domain-core-depends-only-on-domain-model',
			comment: 'Domain behaviour may consume the domain contract but no view, example or deployment workspace.',
			severity: 'error',
			from: { path: '^packages/domain-core/src' },
			to: {
				path: '^(packages|apps|examples)/',
				pathNot: '^packages/(domain-core|domain-model)/src',
			},
    },
    {
      name: 'library-stays-reusable',
      comment: 'Reusable artwork may reach the view model, never Studio application state.',
      severity: 'error',
      from: { path: '^packages/view-studio/src/library' },
      to: { path: '^packages/view-studio/src/app' },
    },
    {
      name: 'authored-infoschematics-stay-framework-neutral',
			comment: 'Authored Infoschematics may use domain contracts and behaviour, never a view or deployment host.',
      severity: 'error',
      from: { path: '^examples/is-[^/]+/src' },
      to: { path: '^(packages/view-[^/]+|apps/site)/src' },
    },
    {
      name: 'site-does-not-own-product-model',
      comment: 'The site consumes public packages; it does not reach into domain or view-model internals.',
      severity: 'error',
      from: { path: '^apps/site/src' },
      to: { path: '^packages/(domain-model|view-model)/src' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.base.json' },
  },
}

export default config
