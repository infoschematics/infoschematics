export type VisualTokenValue = boolean | number | string

const tokenGroup = <const Tokens extends Readonly<Record<string, VisualTokenValue>>>(
  tokens: Tokens
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
      /* What a pointer may press to take a Point, against the six units it paints. A Point is the smallest thing a
         Producer selects, and the paint is smaller than the grid it snaps to, so the target is stated separately
         rather than inherited from the mark — the same separation `addReach` makes for a waypoint. */
      pointTargetRadius: 14,
      regionLabelCharacterWidth: 9.4,
      regionLabelHeight: 14,
      regionLabelInset: 16,
      regionNotchPadding: 10
    }),
    surfaces: tokenGroup({
      backdrop: '#081725',
      fabricFill: '#102638b8',
      fabricFrame: '#6f8ba3a8',
      fabricStroke: '#83b2d2c4',
      flowPipe: '#06101c',
      graphicFallbackFill: '#1a1436c9',
      graphicFallbackStroke: '#8062b4',
      regionDash: '8 6',
      regionDot: '1.5 5',
      regionFill: '#12273b24',
      regionStroke: '#b5c4d54d'
    }),
    text: tokenGroup({
      bodyFamily: 'Manrope, Arial, sans-serif',
      codeFamily: '"DM Mono", monospace',
      fabric: '#b9cde0',
      label: '#f2f7ff',
      muted: '#7f9bb3',
      region: '#ffffff65',
      strong: '#dff3ff'
    }),
    /**
     * One arrowhead, stated once for both renderers.
     *
     * Direction is carried by `orient`, and the two renderers cannot use the same value for it. A browser
     * implements the SVG 2 `auto-start-reverse`, which turns a `marker-start` to face back out of its source; the
     * rasteriser chosen in `ADR-INFOSCHEMATICS-024` does not, and draws the head unrotated rather than failing. So
     * the static renderer orients every head with `auto` and reaches for `reversed` — the same triangle mirrored,
     * with its apex as the reference point — where a browser would reverse the axis instead.
     *
     * The geometry is shared because a Flow that arrives blunt in one renderer and sharp in the other is the defect
     * the visual-treatment parity check exists to catch, and a path string stated twice is how it would happen.
     */
    arrowhead: tokenGroup({
      forward: 'M0 0 L0 24 L24 12 z',
      forwardRefX: 24,
      refY: 12,
      reversed: 'M24 0 L24 24 L0 12 z',
      reversedRefX: 0,
      size: 32
    }),
    flows: tokenGroup({
      dash: '13 11',
      highlightedWidth: 5,
      lineCap: 'round',
      lineJoin: 'round',
      pipeWidth: 9,
      routeOpacity: 0.95,
      routeWidth: 4,
      signalStillWidth: 7
    }),
    /** One emphasis treatment, interpreted as motion, a reduced-motion fade, or a still outline. */
    emphasis: tokenGroup({
      duration: '900ms',
      inset: 6,
      radius: 14,
      stroke: '#f2a63b',
      strokeWidth: 3
    }),
    focus: tokenGroup({
      dimmedOpacity: 0.14,
      focusedOpacity: 1,
      transitionDuration: '180ms',
      transitionTiming: 'ease-out'
    }),
    selection: tokenGroup({
      focusedStroke: '#cfe9ff',
      pointed: '#79c9ff',
      selected: '#82b366'
    }),
    /** Defaults for deterministic output that never depend on UI motion. */
    output: tokenGroup({
      annotationFill: '#06101ee8',
      annotationFontSize: 9,
      annotationHeight: 20,
      annotationRadius: 4,
      annotationStroke: '#ffffff44',
      annotationWidth: 48,
      backdrop: '#ffffff',
      cardText: '#18212a',
      cardTextInverse: '#f2f7ff',
      codeFontFamily: 'ui-monospace, Menlo, monospace',
      componentFontSize: 13,
      fallbackFamily: '#52606d',
      flowPipe: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      graphicFill: '#f7f8f9',
      metadataFontSize: 12,
      regionStroke: '#83909d',
      stroke: '#687684',
      surface: '#f2f5f7',
      text: '#27313a',
      textMuted: '#46515d',
      textMutedInverse: '#9fb3c8',
      unfocusedOpacity: 0.2
    })
  })
})

/** Preserved public scalar while consumers move to the semantic manifest. */
export const cornerRadius = visualTokens.canvas.geometry.cornerRadius

/** Deterministic width for a monospaced annotation badge, including readable side padding. */
export const annotationLabelWidth = (
  label: string,
  minimumWidth: number = visualTokens.canvas.output.annotationWidth
): number =>
  Math.max(
    minimumWidth,
    Math.ceil(
      [...label].length * visualTokens.canvas.output.annotationFontSize * 0.62 +
        visualTokens.canvas.output.annotationFontSize * 1.75
    )
  )
