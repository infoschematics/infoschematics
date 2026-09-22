export type VisualTokenValue = boolean | number | string

const tokenGroup = <const Tokens extends Readonly<Record<string, VisualTokenValue>>>(
  tokens: Tokens
): Readonly<Tokens> => Object.freeze(tokens)

/**
 * Every paint role the drawing has, stated once so a palette is a complete answer rather than a partial one.
 *
 * A role is a job a colour does in the drawing — the paper, a Fabric's fill, the ink a Region's name is read in —
 * and it is named after that job rather than after a colour or an outlet. The type is what makes a palette
 * checkable: a scheme that forgets `regionStroke` does not compile, and `scripts/generate-visual-tokens.ts`
 * refuses to emit a stylesheet whose palettes disagree about which roles exist, because a type is erased by the
 * time the stylesheet is read.
 *
 * Every colour carries its own alpha rather than leaning on an `opacity` attribute, so a role resolves to one
 * value a renderer can write straight onto an element and neither renderer has an opacity of its own to get wrong.
 */
export type PaintRoles = Readonly<{
  /** The chip a code badge is drawn on. */
  annotationFill: string
  /** Laid behind badge glyphs with `paint-order`, so a route crossing the chip leaves no stroke between them. */
  annotationHalo: string
  annotationStroke: string
  annotationText: string
  /** The outline of an audit badge, which is a Producer's overlay rather than part of the published drawing. */
  auditStroke: string
  /** The paper. */
  backdrop: string
  fabricFill: string
  /** The authored bounds of a Fabric whose host renderer draws an irregular shape inside them. */
  fabricFrame: string
  fabricStroke: string
  fabricText: string
  /** The casing drawn under a Flow's route, which reads as the route passing behind the paper. */
  flowPipe: string
  graphicFill: string
  graphicStroke: string
  regionFill: string
  regionStroke: string
  regionText: string
  /** A boundary-mounted Region label, read against the backdrop its notch exposes rather than against a fill. */
  regionTextNotched: string
  /** A general outline where nothing more specific applies. */
  stroke: string
  /** The fill an artefact takes when nothing authored one. */
  surface: string
  text: string
  textMuted: string
  textStrong: string
  /** What an element is drawn in when no Scope, Domain or Flow family authored a colour for it. */
  unauthored: string
  /** The standard renderer catalogue in `standard-artwork.ts`, whose geometry is shared across every palette. */
  artwork: Readonly<{
    accent: string
    detail: string
    frame: string
    glyph: string
    glyphFill: string
    grid: string
    mark: string
    shell: string
    sweep: string
    title: string
    warning: string
    warningFill: string
    warningGlyph: string
  }>
}>

/**
 * What the product's own surfaces are painted in, as distinct from what a drawing is painted in.
 *
 * A drawing's roles name parts of a drawing — a Region's fill, a Flow's casing. These name parts of an interface:
 * the plane something sits on, the hairline between two planes, the four levels of type, the accent a control is
 * picked out in, and the four things an interface has to be able to say about state. They are deliberately few and
 * deliberately generic, because three surfaces share them and a role invented for one of them is a literal with a
 * longer name.
 *
 * There is no `blueprint` here. Blueprint is an authored treatment of a drawing, and the chrome around a drawing
 * belongs to whoever is reading rather than to whoever authored it.
 */
export type ChromeRoles = Readonly<{
  /** A control picked out from its surroundings, and the colour a focus ring is drawn in. */
  accent: string
  /** A hairline where the accent is the thing being bounded. */
  accentBorder: string
  /** The plane an accented control is filled with, which carries `text` rather than `textOnAccent`. */
  accentSurface: string
  /** The accent under a pointer or against a heavier weight of type. */
  accentStrong: string
  /** A wash of the accent, for a selected row or a hovered control. */
  accentSoft: string
  /** The standard hairline between two planes. */
  border: string
  /** Heavier, for a boundary that has to be read rather than merely felt. */
  borderStrong: string
  /** Lighter, for a division inside one component. */
  borderSubtle: string
  /** A warning that the reader may proceed through. */
  caution: string
  /** A wash of it, behind text that stays `text`. */
  cautionSoft: string
  /** A hairline around a cautioned region. */
  cautionBorder: string
  /** Something the reader should know but need not act on. */
  informational: string
  /** A wash of it. */
  informationalSoft: string
  /** Something wrong: a failure, a refusal, a destructive control. */
  negative: string
  /** A hairline around it, which reads as an outline rather than as text. */
  negativeBorder: string
  /** A wash of it. */
  negativeSoft: string
  /** A filled plane for it, dark enough in either scheme to carry `text`. */
  negativeSurface: string
  /** The page behind every panel, which is the furthest-back plane a surface has. */
  page: string
  /** A panel that floats above the page, which needs its own near-opaque plane and a shadow. */
  panelFloating: string
  /** Something that succeeded, is live, or is within tolerance. */
  positive: string
  /** A wash of it. */
  positiveSoft: string
  /** What dims the page behind a dialogue or a menu. */
  scrim: string
  /** What a drop shadow is cast in. */
  shadow: string
  /** The same, for something floating further from its plane. */
  shadowStrong: string
  /** A panel: the plane most of the interface sits on. */
  surface: string
  /** A pointer resting on something that can be picked. */
  surfaceHover: string
  /** A row, cell, or card lifted off its panel. */
  surfaceRaised: string
  /** What is currently chosen, which has to read as chosen without relying on the accent alone. */
  surfaceSelected: string
  /** An input, a well, or anything the reader types into. */
  surfaceSunken: string
  /** Body type. */
  text: string
  /** The accent as type, which needs more contrast against a plane than the accent itself does. */
  textAccent: string
  /** Type on an accented fill, which is not the same colour in both schemes. */
  textOnAccent: string
  /** Type that is present but not being read: a timestamp, a hint, a disabled control. */
  textFaint: string
  /** A label, a caption, or a secondary line under a heading. */
  textMuted: string
  /** A subheading, or a value against its label. */
  textSecondary: string
  /** A heading, or the one line on a panel that should be read first. */
  textStrong: string
}>

/** Chrome resolves for a reader, so it has the reader's two schemes and not the drawing's authored third. */
export type ChromeScheme = 'dark' | 'light'

export type ChromeRole = keyof ChromeRoles

const chromePalette = (roles: ChromeRoles): ChromeRoles => Object.freeze({ ...roles })

const palette = (roles: PaintRoles): PaintRoles =>
  Object.freeze({ ...roles, artwork: Object.freeze({ ...roles.artwork }) })

/**
 * Which palette a drawing is painted in.
 *
 * `light` and `dark` are the reader's context: the same document is drawn in whichever one the reader is in, and
 * nothing about the document chooses between them. `blueprint` is the authored `appearance.surface` of the same
 * name — a technical-drawing look a document asks for deliberately — so it is pinned rather than following the
 * reader, and a blueprint stays a blueprint in either scheme. `ADR-INFOSCHEMATICS-041` records why.
 */
export type PaintScheme = 'blueprint' | 'dark' | 'light'

/**
 * Framework-neutral visual decisions: what a drawing is painted in, and what the product's own surfaces are.
 *
 * A drawing's palette and the chrome around it are declared together because they answer one preference. A
 * stylesheet that invented its own palette for the same schemes is exactly what left the chrome un-switchable
 * while the drawing followed its reader. Layout, spacing and behaviour stay with whoever draws them.
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
      pointLabelGap: 8,
      /* A Point's label line box, stated here because both renderers place the line and neither measures it: the
         gap clears the mark and half the height carries the text's own centre off the mark's axis. */
      pointLabelHeight: 13,
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
    /**
     * What the standard renderer catalogue in `standard-artwork.ts` is drawn with.
     *
     * The geometry is shared across every palette: a piece's lattice pitch, line weights and dash rhythms are part
     * of the drawing, and a piece that tiles one grid in Canvas and another in static output is two pieces. The
     * inks are not shared, because they answer to the scheme the drawing is read in, and they live beside every
     * other paint role in `paint` rather than in a group of their own.
     */
    artwork: Object.freeze({
      geometry: tokenGroup({
        accentDash: '6 8',
        accentWidth: 2,
        beamDash: '5 6',
        captionSize: 15,
        detailAdvance: 6.2,
        detailSize: 12,
        glyphSize: 46,
        glyphWidth: 2.5,
        gridDotRadius: 1.4,
        gridPitch: 34,
        gridWidth: 1,
        markRadius: 5,
        orbitDash: '4 9',
        /** A cycle's band, as a fraction of the shorter side of the bounds: one arrow, not a hairline. */
        sweepRatio: 0.085,
        warningDash: '7 7',
        warningWidth: 2.5
      })
    }),
    /**
     * Ink over an authored fill, chosen by that fill rather than by the scheme.
     *
     * An author's `color` means the same thing in either scheme, so `resolveReadableInk` measures the fill's own
     * luminance and both renderers pick the same end of this pair. The scheme only answers when there is no fill to
     * measure, which is what `readableInkFallback` is for.
     */
    ink: tokenGroup({
      dark: '#18212a',
      darkMuted: '#46515d',
      light: '#f2f7ff',
      lightMuted: '#9fb3c8'
    }),
    /**
     * One complete palette per scheme, over the single role set `PaintRoles` names.
     *
     * The three are alternatives rather than layers: nothing falls back to another palette, so a role added here
     * has to be answered three times, and a scheme cannot quietly inherit a colour designed for a different paper.
     */
    paint: Object.freeze({
      /** The authored technical-drawing surface: navy paper, cyan ink, pinned in either scheme. */
      blueprint: palette({
        annotationFill: '#06101ee8',
        annotationHalo: '#06101e',
        annotationStroke: '#ffffff44',
        annotationText: '#dff3ff',
        artwork: {
          accent: '#9cd5f5',
          detail: '#b9cde0',
          frame: '#90a8c178',
          glyph: '#a8cde6',
          glyphFill: '#17354b',
          grid: '#8dc7e72e',
          mark: '#9cd5f58c',
          shell: '#153349d6',
          sweep: '#9ed9ff29',
          title: '#dff3ff',
          warning: '#d79b00aa',
          warningFill: '#d79b0016',
          warningGlyph: '#f0b23a'
        },
        auditStroke: '#79c9ffaa',
        backdrop: '#081725',
        fabricFill: '#102638b8',
        fabricFrame: '#6f8ba3a8',
        fabricStroke: '#83b2d2c4',
        fabricText: '#b9cde0',
        flowPipe: '#06101c',
        graphicFill: '#1a1436c9',
        graphicStroke: '#8062b4',
        regionFill: '#12273b24',
        regionStroke: '#b5c4d54d',
        regionText: '#ffffff65',
        regionTextNotched: '#9ed9ff',
        stroke: '#83b2d2c4',
        surface: '#102638b8',
        text: '#f2f7ff',
        textMuted: '#7f9bb3',
        textStrong: '#dff3ff',
        unauthored: '#7f9bb3'
      }),
      /** Dark paper: slate rather than navy, so a dark reading context is not mistaken for a blueprint. */
      dark: palette({
        annotationFill: '#e3ecf2ee',
        annotationHalo: '#e3ecf2',
        annotationStroke: '#00000044',
        annotationText: '#18212a',
        artwork: {
          accent: '#7fb8dd',
          detail: '#a8b6c0',
          frame: '#76858f78',
          glyph: '#8fb8d1',
          glyphFill: '#243039',
          grid: '#8ba3b52e',
          mark: '#7fb8dd8c',
          shell: '#1e272e',
          sweep: '#7fb8dd29',
          title: '#e6edf3',
          warning: '#d79b00aa',
          warningFill: '#d79b0016',
          warningGlyph: '#e0a53a'
        },
        auditStroke: '#7fb8ddaa',
        backdrop: '#161b20',
        fabricFill: '#1c2429',
        fabricFrame: '#76858fa8',
        fabricStroke: '#8d9ca6',
        fabricText: '#c6d2da',
        flowPipe: '#161b20',
        graphicFill: '#262f36',
        graphicStroke: '#8d9ca6',
        regionFill: '#e3ecf20f',
        regionStroke: '#8d9ca6',
        regionText: '#a8b6c0',
        regionTextNotched: '#9ed9ff',
        stroke: '#76858f',
        surface: '#212a31',
        text: '#e6edf3',
        textMuted: '#a8b6c0',
        textStrong: '#f4f8fb',
        unauthored: '#8d9ca6'
      }),
      /** Light paper, which is what most documents are read on and what a committed SVG lands in. */
      light: palette({
        annotationFill: '#06101ee8',
        annotationHalo: '#06101e',
        annotationStroke: '#ffffff44',
        annotationText: '#f2f7ff',
        artwork: {
          accent: '#4d7ea8',
          detail: '#46515d',
          frame: '#687684',
          glyph: '#3d566b',
          glyphFill: '#e3ecf2',
          grid: '#8ba3b52e',
          mark: '#4d7ea88c',
          shell: '#e9f0f5',
          sweep: '#4d7ea829',
          title: '#27313a',
          warning: '#b07400aa',
          warningFill: '#b0740016',
          warningGlyph: '#8a5a00'
        },
        auditStroke: '#4d7ea8aa',
        backdrop: '#ffffff',
        fabricFill: '#f2f5f7',
        fabricFrame: '#8b99a6a8',
        fabricStroke: '#687684',
        fabricText: '#27313a',
        flowPipe: '#ffffff',
        graphicFill: '#f7f8f9',
        graphicStroke: '#687684',
        regionFill: '#27313a0f',
        regionStroke: '#83909d',
        regionText: '#46515d',
        regionTextNotched: '#4d7ea8',
        stroke: '#687684',
        surface: '#f2f5f7',
        text: '#27313a',
        textMuted: '#46515d',
        textStrong: '#18212a',
        unauthored: '#52606d'
      })
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
    /** Sizes and rhythms the drawing keeps whichever palette it is painted in. */
    metrics: tokenGroup({
      annotationHeight: 20,
      annotationRadius: 4,
      annotationWidth: 48,
      regionDash: '8 6',
      regionDot: '1.5 5',
      unfocusedOpacity: 0.2
    }),
    /**
     * Type, where the outlet genuinely does decide.
     *
     * A palette does not belong to an outlet, but a font stack does: Canvas is mounted in a page that can load a
     * webfont, and a static document may be opened anywhere, so it names a stack every machine already has.
     */
    typography: tokenGroup({
      annotationFontSize: 9,
      bodyFamily: 'Manrope, Arial, sans-serif',
      codeFamily: '"DM Mono", monospace',
      componentFontSize: 13,
      metadataFontSize: 12,
      staticBodyFamily: 'system-ui, sans-serif',
      staticCodeFamily: 'ui-monospace, Menlo, monospace'
    })
  }),
  /**
   * The product's own surfaces, in the reader's two schemes.
   *
   * These declarations ride in the same generated stylesheet as the drawing's, under the same selectors and in the
   * same order, because a second mechanism for the same preference is how a surface ends up half-switched. The dark
   * palette is the interface this repository already had, consolidated: several near-identical planes and a long
   * ramp of alpha-white hairlines became one role each, which is the point of a role.
   *
   * The light palette is not the dark one inverted. Alpha-white hairlines become alpha-ink ones, the accent darkens
   * because a pale blue on white is not a readable accent, and type on an accented fill changes colour rather than
   * weight. `ADR-INFOSCHEMATICS-041` records the decision; the browser suites record whether it reads.
   */
  chrome: Object.freeze({
    paint: Object.freeze({
      dark: chromePalette({
        accent: '#79c9ff',
        accentBorder: '#79c9ff66',
        accentSurface: '#163451',
        accentStrong: '#8fcff8',
        accentSoft: '#79c9ff22',
        border: '#ffffff1e',
        borderStrong: '#ffffff2e',
        borderSubtle: '#ffffff12',
        caution: '#f0b357',
        cautionSoft: '#f0b35714',
        cautionBorder: '#f0b35799',
        informational: '#c39bff',
        informationalSoft: '#6f4aa055',
        negative: '#ff8398',
        negativeBorder: '#ff8f78',
        negativeSoft: '#ff647c22',
        negativeSurface: '#5c2030',
        page: '#07111e',
        panelFloating: '#0a1929f2',
        positive: '#78e6a5',
        positiveSoft: '#48c6a833',
        scrim: '#02060cb3',
        shadow: '#00000066',
        shadowStrong: '#00000080',
        surface: '#0c1c2b',
        surfaceHover: '#ffffff08',
        surfaceRaised: '#10263b',
        surfaceSelected: '#173653',
        surfaceSunken: '#081523',
        text: '#dff0ff',
        textAccent: '#79c9ff',
        textOnAccent: '#07111e',
        textFaint: '#4a5d70',
        textMuted: '#8fa9c4',
        textSecondary: '#a9c4dc',
        textStrong: '#f5f8ff'
      }),
      light: chromePalette({
        accent: '#1b7ec4',
        accentBorder: '#1b7ec466',
        accentSurface: '#dcecf9',
        accentStrong: '#0f5c8f',
        accentSoft: '#1b7ec41f',
        border: '#0d22331f',
        borderStrong: '#0d223342',
        borderSubtle: '#0d223312',
        caution: '#8a5600',
        cautionSoft: '#8a560014',
        cautionBorder: '#8a560099',
        informational: '#5b3aa0',
        informationalSoft: '#5b3aa024',
        negative: '#a3203a',
        negativeBorder: '#a3203a99',
        negativeSoft: '#a3203a14',
        negativeSurface: '#f7dde2',
        page: '#eef3f8',
        panelFloating: '#fffffff2',
        positive: '#0f7047',
        positiveSoft: '#0f704724',
        scrim: '#0d2233a6',
        shadow: '#0d223326',
        shadowStrong: '#0d22333d',
        surface: '#ffffff',
        surfaceHover: '#0d223309',
        surfaceRaised: '#f4f8fc',
        surfaceSelected: '#d9e9f7',
        surfaceSunken: '#eaf1f8',
        text: '#122536',
        textAccent: '#125f96',
        textOnAccent: '#ffffff',
        textFaint: '#6b8298',
        textMuted: '#4a6478',
        textSecondary: '#2b4558',
        textStrong: '#08151f'
      })
    })
  })
})

/** The palette a drawing is painted in, given what the document authored and what the reader is in. */
export const paintFor = (scheme: PaintScheme): PaintRoles => visualTokens.canvas.paint[scheme]

export type PaintRole = Exclude<keyof PaintRoles, 'artwork'>
export type ArtworkPaintRole = keyof PaintRoles['artwork']

const cssRole = (role: string) => role.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * A paint role as the custom property the generated stylesheet declares it under.
 *
 * An interactive surface cannot read a scheme out of this module: the reader's preference and the host's override
 * are both resolved by the browser, and a literal picked here would be whichever palette the module happened to
 * name. A role referenced as its own custom property follows whatever the page resolved, and the stylesheet is
 * where that answer already lives. `scripts/generate-visual-tokens.test.ts` asserts each name these produce is
 * declared, because the kebab spelling is the generator's and a silent mismatch resolves to nothing.
 */
export const paintVariable = (role: PaintRole): string => `var(--infoschematic-canvas-paint-${cssRole(role)})`

/** The same, for the artwork roles a Graphic or Fabric piece paints itself in. */
export const artworkPaintVariable = (role: ArtworkPaintRole): string =>
  `var(--infoschematic-canvas-paint-artwork-${cssRole(role)})`

/** Every artwork role as its custom property, so a catalogue can index by the role a piece names. */
export const artworkPaintVariables: Readonly<Record<ArtworkPaintRole, string>> = Object.freeze(
  Object.fromEntries(
    (Object.keys(visualTokens.canvas.paint.blueprint.artwork) as readonly ArtworkPaintRole[]).map((role) => [
      role,
      artworkPaintVariable(role)
    ])
  ) as Record<ArtworkPaintRole, string>
)

/**
 * A whole palette written as custom-property references rather than colours.
 *
 * A surface painted from this defers the scheme to whoever resolves the stylesheet, which is what lets one drawing
 * follow a reader who has never been asked. It is the same role set as any palette, so anything that takes a
 * `PaintRoles` takes this: the renderer does not learn a second way to paint.
 *
 * It asks for a consumer that resolves custom properties, and there is no fallback that would spare one that does
 * not. resvg reads an inline `style` and then treats `var(...)` as an invalid paint, so it paints black and looks
 * past both a `var()` fallback and the presentation attribute underneath it — measured, not assumed. A drawing for
 * a consumer that is not a browser therefore asks for a resolved scheme, which is why the raster path refuses this
 * one rather than encoding it.
 */
export const adaptivePaint: PaintRoles = Object.freeze({
  ...(Object.fromEntries(
    (Object.keys(visualTokens.canvas.paint.light) as readonly (keyof PaintRoles)[])
      .filter((role): role is PaintRole => role !== 'artwork')
      .map((role) => [role, paintVariable(role)])
  ) as Omit<PaintRoles, 'artwork'>),
  artwork: artworkPaintVariables
})

/** What the chrome around a drawing is painted in, for the scheme the reader turned out to be in. */
export const chromeFor = (scheme: ChromeScheme): ChromeRoles => visualTokens.chrome.paint[scheme]

/**
 * A chrome role as the custom property the generated stylesheet declares it under.
 *
 * Chrome is styled in CSS rather than resolved in TypeScript, so this exists for the suites that assert what a
 * stylesheet should be referencing and for a host that needs the same role in an inline style.
 */
export const chromeVariable = (role: ChromeRole): string => `var(--infoschematic-chrome-paint-${cssRole(role)})`

/** One scheme's chrome roles as CSS declarations, in the generated stylesheet's own order. */
export const chromeDeclarations = (scheme: ChromeScheme): readonly (readonly [name: string, value: string])[] => {
  const roles = chromeFor(scheme)
  const named = (Object.keys(roles) as readonly ChromeRole[]).map(
    (role) => [`--infoschematic-chrome-paint-${cssRole(role)}`, roles[role]] as const
  )
  return Object.freeze([...named].sort((left, right) => (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0)))
}

/**
 * One scheme's paint roles as the CSS declarations that realise them, in the generated stylesheet's own order.
 *
 * Two outlets need these: the generated stylesheet, and a static rendering that carries its own palette so the file
 * themes itself wherever it is embedded. They are produced here rather than in the generator because a package may
 * not reach into `scripts/`, and a second spelling of these names would resolve to nothing without saying so.
 */
export const paintDeclarations = (scheme: PaintScheme): readonly (readonly [name: string, value: string])[] => {
  const palette = paintFor(scheme)
  const named = (Object.keys(palette) as readonly (keyof PaintRoles)[]).flatMap((role) =>
    role === 'artwork'
      ? (Object.keys(palette.artwork) as readonly ArtworkPaintRole[]).map(
          (artwork) => [`--infoschematic-canvas-paint-artwork-${cssRole(artwork)}`, palette.artwork[artwork]] as const
        )
      : [[`--infoschematic-canvas-paint-${cssRole(role)}`, palette[role]] as const]
  )
  return Object.freeze([...named].sort((left, right) => (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0)))
}

/**
 * Which ink a fill nobody authored is read in.
 *
 * `resolveReadableInk` measures an authored fill, and has nothing to measure when there is none. The answer is
 * then the scheme's: dark ink on light paper, light ink on dark, and a blueprint reads like dark paper because
 * that is what it is.
 */
export const readableInkFallback = (scheme: PaintScheme): 'dark' | 'light' => (scheme === 'light' ? 'dark' : 'light')

/** Preserved public scalar while consumers move to the semantic manifest. */
export const cornerRadius = visualTokens.canvas.geometry.cornerRadius

/** Deterministic width for a monospaced annotation badge, including readable side padding. */
export const annotationLabelWidth = (
  label: string,
  minimumWidth: number = visualTokens.canvas.metrics.annotationWidth
): number =>
  Math.max(
    minimumWidth,
    Math.ceil(
      [...label].length * visualTokens.canvas.typography.annotationFontSize * 0.62 +
        visualTokens.canvas.typography.annotationFontSize * 1.75
    )
  )
