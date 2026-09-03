export type VisualTokenValue = boolean | number | string

const tokenGroup = <
  const Tokens extends Readonly<Record<string, VisualTokenValue>>,
>(
  tokens: Tokens,
): Readonly<Tokens> => Object.freeze(tokens)

/**
 * Framework-neutral visual decisions shared by interactive and static Canvas
 * renderers. View-specific controls and host chrome deliberately stay outside
 * this manifest.
 */
export const visualTokens = Object.freeze({
  canvas: Object.freeze({
    geometry: tokenGroup({
      addReach: 14,
      attachmentReach: 40,
      cornerRadius: 10,
      dragThreshold: 4,
      gridMajorStrokeWidth: 1,
      gridMajorSize: 50,
      gridMinorStrokeWidth: 0.5,
      gridSize: 10,
      pointRadius: 6,
    }),
    surfaces: tokenGroup({
      backdrop: '#081725',
      fabricFill: '#102638b8',
      fabricFrame: '#6f8ba3a8',
      fabricStroke: '#83b2d2c4',
      flowPipe: '#06101c',
      graphicFallbackFill: '#1a1436c9',
      graphicFallbackStroke: '#8062b4',
      laneFill: '#12273b24',
      regionDash: '8 6',
      regionDot: '1.5 5',
      laneStroke: '#b5c4d54d',
    }),
    text: tokenGroup({
      bodyFamily: 'Manrope, Arial, sans-serif',
      codeFamily: '"DM Mono", monospace',
      fabric: '#b9cde0',
      label: '#f2f7ff',
      muted: '#7f9bb3',
      strong: '#dff3ff',
      zone: '#ffffff65',
    }),
    flows: tokenGroup({
      dash: '13 11',
      highlightedWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
      pipeWidth: 9,
      routeOpacity: 0.95,
      routeWidth: 4,
    }),
    focus: tokenGroup({
      dimmedOpacity: 0.14,
      focusedOpacity: 1,
      transitionDuration: '180ms',
      transitionTiming: 'ease-out',
    }),
    selection: tokenGroup({
      focusedStroke: '#cfe9ff',
      pointed: '#79c9ff',
      selected: '#82b366',
    }),
    /** Defaults for deterministic output that never depend on UI motion. */
    output: tokenGroup({
      backdrop: '#ffffff',
      cardText: '#18212a',
      componentFontSize: 13,
      fallbackFamily: '#52606d',
      flowPipe: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      graphicFill: '#f7f8f9',
      laneStroke: '#83909d',
      metadataFontSize: 12,
      stroke: '#687684',
      surface: '#f2f5f7',
      text: '#27313a',
      textMuted: '#46515d',
      unfocusedOpacity: 0.2,
    }),
  }),
})

/** Preserved public scalar while consumers move to the semantic manifest. */
export const cornerRadius = visualTokens.canvas.geometry.cornerRadius
