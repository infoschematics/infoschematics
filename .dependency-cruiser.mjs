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
    comment: 'src/index.ts only exports the public Studio surface and compatibility types from lower Views.',
    severity: 'error',
    from: { path: '^packages/view-studio/src/index\\.ts$' },
    to: {
      pathNot:
        '^(packages/view-studio/src/app|packages/view-canvas/src|packages/view-present/src|@infoschematics/view-(canvas|present)|node_modules)',
    },
  },
  {
    name: 'canvas-depends-only-on-models',
    comment: 'Canvas may consume Domain Model and View Model, but not higher Views, examples, or applications.',
    severity: 'error',
    from: { path: '^packages/view-canvas/src' },
    to: {
      path: '^(packages|apps|examples)/',
      pathNot: '^packages/(domain-model|view-model|view-canvas)/src',
    },
  },
  {
    name: 'present-builds-on-canvas',
    comment: 'Present may add Audience behaviour over Canvas, but never depend on Studio, examples, or applications.',
    severity: 'error',
    from: { path: '^packages/view-present/src' },
    to: {
      path: '^(packages|apps|examples)/',
      pathNot: '^packages/(domain-model|view-model|view-canvas|view-present)/src',
    },
  },
  {
    name: 'studio-builds-on-lower-views',
    comment: 'Studio may compose Domain, Canvas, and Present capabilities, but lower owners never point back to it.',
    severity: 'error',
    from: { path: '^packages/view-studio/src' },
    to: {
      path: '^(packages|apps|examples)/',
      pathNot: '^packages/(domain-core|domain-model|view-model|view-canvas|view-present|view-studio)/src',
    },
  },
  {
    name: 'static-renderer-stays-framework-neutral',
    comment: 'Static SVG may consume Domain Model and View Model, but no React or interactive View package.',
    severity: 'error',
    from: { path: '^packages/render-svg/src' },
    to: {
      path: '^(packages|apps|examples|react|react-dom)(/|$)',
      pathNot: '^packages/(domain-model|view-model|render-svg)/src',
    },
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
    tsConfig: { fileName: 'tsconfig.json' },
  },
}

export default config
