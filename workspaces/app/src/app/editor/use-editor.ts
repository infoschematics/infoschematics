import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type AttachedEnd,
  type Change,
  type CreatedComponent,
  type CreatedFlow,
  type EditableDiagram,
  orderChanges,
} from '@infoschematics/core/editable'
import type { Offset, Point } from '@infoschematics/core/geometry'
import { type Guide, snapToGuides } from '@infoschematics/core/guides'
import type { PortCounts, Side } from '@infoschematics/core/ports'
import { moveRouteEnd, normaliseRoute } from '@infoschematics/core/routing'
import * as waypoints from '@infoschematics/core/waypoints'
import { useInfoschematic } from '../infoschematic-context.tsx'
import { usePersistentState } from '../hooks/use-persistent-state.ts'

// Editing state for a diagram, held apart from the diagram itself and from the
// app around it. Drafts persist because losing an unsaved placement is real work
// lost; the mode does not, because a dashboard that reopens in edit mode in
// front of a room is a foot-gun.

// Annotations moved to the Infoschematic, since they are worth showing without the
// editor open. What is left here is genuinely about editing.
export type EditorView = { grid: boolean; snapping: boolean }

/**
 * Which editor is open.
 *
 * One per layer the vocabulary names. `design` edits the diagram: where a card
 * sits, what a flow meets, how many ports a side offers, where a route bends.
 * `scene` edits the scenes themselves - what each one lights. `story` edits a
 * story: which scenes it plays, in what order, with what words and timings.
 *
 * The two editing layers show none of the diagram's own handles - not dimmed,
 * absent. `null` is none of them, which is what a visitor sees.
 */
export type EditorMode = 'scenes' | 'design' | 'stories' | null

const openView: EditorView = { grid: true, snapping: true }
const closedView: EditorView = { grid: false, snapping: false }

/** The diagram is laid out on tens, so a drop that lands on one stays tidy. */
export const gridSize = 10

const toGrid = (point: Point): Point => ({
  x: Math.round(point.x / gridSize) * gridSize,
  y: Math.round(point.y / gridSize) * gridSize,
})

/** Everything undo has to put back, which is everything an edit may change. */
/** Which draft a pending change came from, so it can be dropped on its own. */
export type PendingOrigin = {
  end?: 'source' | 'target'
  key: string
  /** Which text property, where the draft holds several against one code. */
  property?: TextField
  map: 'attachments' | 'cards' | 'components' | 'creations' | 'labels' | 'ports' | 'removals' | 'routes' | 'text'
}

/*
 * A line that does not exist yet, as this hook holds one.
 *
 * Held whole, where every other draft is held as a difference. That is not an
 * inconsistency but the point: the others say how something authored should
 * change, and this one says what to author, so there is nothing for it to
 * differ from.
 *
 * The code is the key rather than a field, as it is for every other draft, so
 * a creation can be dropped on its own by the same route the rest are.
 */
export type Creation = Omit<CreatedFlow, 'code'>

/** A card that does not exist yet, keyed by its code as every other draft is. */
export type CardCreation = Omit<CreatedComponent, 'code'>

/*
 * Deleting a component deletes the lines that meet it.
 *
 * The three options were to refuse until the lines are gone, to take them with
 * it, or to leave them attached to nothing. Refusing makes the common case -
 * removing a card that six lines meet - into six deletions before the one
 * intended, and the editor exists to spare that. Leaving them loose produces a
 * model that cannot be written down: a flow names two ends, and there is
 * no way to author one that names a card the registry does not have.
 *
 * So they go together, and every line goes into the change set by name rather
 * than being implied by the card's removal. A reader who deletes one card and
 * is handed seven removals has been told what they did, which is the part
 * refusing was really for.
 */
export type Removal = { because?: string }

/**
 * One line of what to paste back, with the draft behind it where there is one.
 * The key names what the change is about - a component or a flow code -
 * so a change and the thing it describes can point at each other, and the field
 * names which of its properties the line sets.
 */
export type PendingChange = { field: PendingField; key: string; origin?: PendingOrigin; source: string }

/** Which property of a component or flow a change line sets. */
type PendingField =
  | 'card'
  | 'create'
  | 'create-card'
  | 'detail'
  | 'family'
  | 'group'
  | 'label'
  | 'name'
  | 'points'
  | 'ports'
  | 'remove'
  | 'source'
  | 'target'

/**
 * What a thing is called and what kind of thing it is, as against where it sits.
 *
 * `name` is a card's own label rather than a flow's label position, which
 * is the older `label` field and means something else entirely. These four are
 * the properties ADR-IBC2026-003 made editable: a code is authored now, so
 * changing a card's scope or a line's family no longer reissues its identity.
 *
 * A registry identifier is not among them. It is what one entry calls another
 * by, so changing one means finding every entry that names it - a search, in
 * the file, rather than a field in a panel that quietly leaves the references
 * behind.
 */
export type TextDraft = { detail?: string; family?: string; group?: string; name?: string }

export type TextField = keyof TextDraft

/** The registry property each field is written back to. */
const textProperty: Record<TextField, string> = {
  detail: 'detail',
  family: 'family',
  group: 'group',
  name: 'label',
}

/** Which port each end of a flow has been moved to, where either has. */
export type Attachment = { source?: AttachedEnd; target?: AttachedEnd }

/**
 * A dragged component's placement, held as an offset because that is what a
 * drag produces - and stamped with the line the model said when the drag was
 * made. An offset only means anything against the position it was measured
 * from: once a change set has been applied the model has moved by that offset
 * already, and re-applying it moves the card twice. The stamp is how a draft
 * the model has caught up with is told apart from one the reader has made
 * again, which the value alone cannot say.
 */
export type ComponentDraft = Offset & { from?: string }

type EditorDraft = {
  /** Label positions, as a distance along their route. */
  labels: Record<string, number>
  /** Re-attached ends, keyed by flow code. */
  attachments: Record<string, Attachment>
  drafts: Record<string, ComponentDraft>
  portCounts: Record<string, PortCounts>
  /**
   * Edited waypoint lists, keyed by flow code. A route draft is a whole
   * point list rather than an offset - an edited waypoint moved one way and
   * its neighbours another is not expressible as a single dx/dy the way a
   * dragged component or label is, so it gets its own map rather than being
   * bent into the offset one.
   */
  routes: Record<string, readonly Point[]>
  /** Names, subtitles, scopes and families changed by hand. */
  text: Record<string, TextDraft>
  /** Codes marked for removal, and the card whose removal took each one. */
  removals: Record<string, Removal>
  /** Lines made in the editor, keyed by the code issued for each. */
  creations: Record<string, Creation>
  /** Cards made in the editor, keyed the same way. */
  cards: Record<string, CardCreation>
}

/** Nothing drafted. Stated once so `discard` cannot fall behind `EditorDraft`. */
const emptyDraft: EditorDraft = {
  attachments: {},
  cards: {},
  creations: {},
  drafts: {},
  labels: {},
  portCounts: {},
  removals: {},
  routes: {},
  text: {},
}

export function useEditor(
  build: (
    drafts: ReadonlyMap<string, Offset>,
    labels: ReadonlyMap<string, number>,
    attachments: ReadonlyMap<string, Attachment>,
    // Handed over with the rest so the diagram it builds has handles for what
    // has been created, not only for what was authored. A created line the
    // editable did not know about could be drawn but not selected or dragged,
    // which is a line the reader can see and cannot touch.
    created: readonly CreatedFlow[],
    createdCards: readonly CreatedComponent[],
  ) => EditableDiagram,
) {
  const { config } = useInfoschematic()
  const storage = config.id
  /*
   * Which editor is open, if either.
   *
   * A mode rather than a boolean, because there are two editors sharing one
   * Infoschematic and not one editor with parts hidden. `TERM-010` puts it the strong
   * way: a control that exists in both and behaves differently in each is the
   * thing to prevent, so each mode's capability is its own subset.
   */
  const [mode, setMode] = useState<EditorMode>(null)
  const editing = mode !== null
  const [view, setView] = useState<EditorView>(closedView)
  const [guides, setGuides] = useState<readonly Guide[]>([])
  // What a nudge acts on. Set by dragging, because the last thing touched is
  // what a presenter means by "this one" - there is no separate selection to make.
  const [selected, setSelected] = useState<string | null>(null)
  // What the pointer is over, so a change and the thing on Infoschematic it describes
  // can light each other up. Not persisted and not checkpointed: hovering is
  // not an edit, and where the pointer was last session means nothing.
  const [hovered, setHovered] = useState<string | null>(null)
  const [portCounts, setPortCounts] = usePersistentState<Record<string, PortCounts>>(
    storage && `${storage}.diagram.ports`,
    {},
  )
  const [drafts, setDrafts] = usePersistentState<Record<string, ComponentDraft>>(
    storage && `${storage}.diagram.labels`,
    {},
  )
  const [attachments, setAttachments] = usePersistentState<Record<string, Attachment>>(
    storage && `${storage}.diagram.attachments`,
    {},
  )
  const [labels, setLabels] = usePersistentState<Record<string, number>>(
    storage && `${storage}.diagram.labels.along`,
    {},
  )
  const [routes, setRoutes] = usePersistentState<Record<string, readonly Point[]>>(
    storage && `${storage}.diagram.routes`,
    {},
  )
  const [text, setText] = usePersistentState<Record<string, TextDraft>>(storage && `${storage}.diagram.text`, {})
  const [removals, setRemovals] = usePersistentState<Record<string, Removal>>(
    storage && `${storage}.diagram.removals`,
    {},
  )
  const [creations, setCreations] = usePersistentState<Record<string, Creation>>(
    storage && `${storage}.diagram.creations`,
    {},
  )
  const [cards, setCards] = usePersistentState<Record<string, CardCreation>>(storage && `${storage}.diagram.cards`, {})

  // Undo keeps whole snapshots rather than inverse operations, so a new kind of
  // edit is covered by adding its state to `EditorDraft` - and to `restore`,
  // which the first version of this comment forgot to say and which cost undo
  // its hold over attachments and labels. History is not persisted: drafts
  // survive a reload, how far back you can step does not.
  const [past, setPast] = useState<readonly EditorDraft[]>([])
  const [future, setFuture] = useState<readonly EditorDraft[]>([])
  // A drag is one entry however many pointer events it spans, so the checkpoint
  // is taken once when the gesture opens and not again until it closes.
  const gestureOpen = useRef(false)

  const checkpoint = useCallback(() => {
    if (gestureOpen.current) return
    gestureOpen.current = true
    setPast((current) => [
      ...current,
      { attachments, cards, creations, drafts, labels, portCounts, removals, routes, text },
    ])
    setFuture([])
  }, [cards, creations, drafts, portCounts, removals, routes, attachments, labels, text])

  const closeGesture = () => {
    gestureOpen.current = false
  }

  /*
   * Everything the checkpoint took, put back.
   *
   * It took five maps and this put back three, so undoing a re-attached end or
   * a moved label reversed whatever drag surrounded it and left the edit itself
   * standing. Destructuring names all five: adding a sixth to `EditorDraft` and
   * not to this is at least visible here, where three silent omissions were not.
   */
  const restore = ({
    attachments,
    cards,
    creations,
    drafts,
    labels,
    portCounts,
    removals,
    routes,
    text,
  }: EditorDraft) => {
    setAttachments(attachments)
    setCards(cards)
    setCreations(creations)
    setDrafts(drafts)
    setLabels(labels)
    setPortCounts(portCounts)
    setRemovals(removals)
    setRoutes(routes)
    setText(text)
  }

  const offsets = useMemo<ReadonlyMap<string, Offset>>(
    () => new Map(Object.entries(drafts).map(([key, { dx, dy }]) => [key, { dx, dy }])),
    [drafts],
  )
  const labelPositions = useMemo<ReadonlyMap<string, number>>(() => new Map(Object.entries(labels)), [labels])
  const attached = useMemo<ReadonlyMap<string, Attachment>>(() => new Map(Object.entries(attachments)), [attachments])
  // The creations as a list, which is the shape everything downstream of the
  // hook wants: the map is keyed by code so a draft can be dropped on its own,
  // and the code is a property of the line everywhere else.
  const created = useMemo<readonly CreatedFlow[]>(
    () => Object.entries(creations).map(([code, line]) => ({ code, ...line })),
    [creations],
  )
  // The created cards as a list, for the same reason the lines are one: the map
  // is keyed by code so a draft can be dropped on its own, and the code is a
  // property of the card everywhere else.
  const createdCards = useMemo<readonly CreatedComponent[]>(
    () => Object.entries(cards).map(([code, card]) => ({ code, ...card })),
    [cards],
  )
  const diagram = useMemo(
    () => build(offsets, labelPositions, attached, created, createdCards),
    [attached, build, created, createdCards, labelPositions, offsets],
  )

  /*
   * Drafts the model has overtaken, cleared as the editor comes up.
   *
   * A component's draft is an offset, so once the change set carrying it has
   * been applied the model has already moved by it and the offset would move
   * the card a second time - which is why a reload showed positions nobody had
   * asked for. It is dropped when the line it was measured against is no longer
   * the line the model gives, and one carrying no stamp at all predates this
   * and is dropped outright.
   *
   * The rest hold absolute values, so for them the value being what the model
   * already says is enough to know they have been applied.
   */
  const swept = useRef(false)
  useEffect(() => {
    if (swept.current) return
    swept.current = true

    // A draft naming something the model no longer has cannot be applied and
    // cannot be told apart from one that has been; a renamed code leaves one.
    const known = (key: string) => diagram.knows(key)

    setDrafts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key, draft]) => known(key) && draft.from === diagram.authored(key, 'card')),
      ),
    )
    // A creation has no value to compare - the whole of it was the thing that
    // was missing - so the only question worth asking is whether the model has
    // caught up, which is to say whether it now carries the code at all.
    setCreations((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !diagram.authors(key))))
    setCards((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !diagram.authors(key))))

    setLabels((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key, along]) =>
            known(key) &&
            // A share cannot fall outside nought and one, so anything that does
            // was measured in the units this used to keep and would put the
            // label some multiple of the line away from where it was meant.
            along >= 0 &&
            along <= 1 &&
            `${key}  ->  label: { along: ${along} },` !== diagram.authored(key, 'label'),
        ),
      ),
    )
    setRoutes((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key, points]) => {
          if (!known(key)) return false
          const list = points.map((point) => `{ x: ${point.x}, y: ${point.y} }`).join(', ')
          return `${key}  ->  points: [${list}],` !== diagram.authored(key, 'points')
        }),
      ),
    )
    // Per end rather than per flow: one end may be spent while the other
    // is still a change, and keeping the pair would offer the spent one back.
    setPortCounts((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([key, counts]) => {
          if (!known(key)) return false
          // A port draft names only the sides it changed, so it is compared
          // side by side against what the model states rather than as a whole
          // line - the model lists every side, and the two never matched.
          const authored = diagram.authored(key, 'ports') ?? ''
          return (['north', 'east', 'south', 'west'] as const).some(
            (side) => counts[side] !== undefined && !authored.includes(`${side}: ${counts[side]}`),
          )
        }),
      ),
    )
    setAttachments((current) =>
      Object.fromEntries(
        Object.entries(current)
          .filter(([key]) => known(key))
          .map(([key, ends]) => {
            const kept = Object.fromEntries(
              (['source', 'target'] as const)
                .filter((end) => ends[end] && ends[end]?.from === diagram.authored(key, end))
                .map((end) => [end, ends[end]]),
            )
            return [key, kept] as const
          })
          .filter(([, ends]) => Object.keys(ends).length > 0),
      ),
    )
  }, [diagram, setAttachments, setCards, setCreations, setDrafts, setLabels, setPortCounts, setRoutes])

  const selectedHandle = selected ? diagram.handles().find((handle) => handle.key === selected) : undefined
  // Overlaid rather than chosen between: a component states a count for one side
  // and says nothing about the others, so the derived counts have to show
  // through underneath or stepping one side would blank the rest.
  const selectedCounts = selected ? { ...diagram.portCountsFor(selected), ...portCounts[selected] } : {}

  const changes = useMemo(() => {
    const described = new Map<string, Change>()
    for (const [key, offset] of Object.entries(drafts)) {
      const change = diagram.describe(key, offset)
      if (change) described.set(key, change)
    }
    return orderChanges(diagram, described)
  }, [drafts, diagram])

  /**
   * Every pending change as its own entry, each naming the draft it came from so
   * it can be dropped on its own. A carried route has no origin: it follows from
   * the move that caused it, and is undone by dropping that instead.
   */
  const pending = useMemo<readonly PendingChange[]>(() => {
    const every: PendingChange[] = [
      ...changes.map((change) => ({
        field: 'card' as const,
        key: change.key,
        origin: { key: change.key, map: 'components' as const },
        source: change.source,
      })),
      ...diagram.derived().map((change) => ({ field: 'points' as const, key: change.key, source: change.source })),
      ...Object.entries(labels).map(([code, along]) => ({
        field: 'label' as const,
        key: code,
        origin: { key: code, map: 'labels' as const },
        source: `${code}  ->  label: { along: ${along} },`,
      })),
      ...Object.entries(attachments).flatMap(([code, ends]) =>
        (['source', 'target'] as const)
          .filter((end) => ends[end])
          .map((end) => ({
            field: end,
            key: code,
            origin: { end, key: code, map: 'attachments' as const },
            source: `${code}  ->  ${end}: '${ends[end]?.component}', ${end}Port: '${ends[end]?.port}',`,
          })),
      ),
      ...Object.entries(routes).map(([code, points]) => ({
        field: 'points' as const,
        key: code,
        origin: { key: code, map: 'routes' as const },
        source: `${code}  ->  points: [${points.map((point) => `{ x: ${point.x}, y: ${point.y} }`).join(', ')}],`,
      })),
      // One line per property changed, so a card renamed and rescoped hands back
      // two lines rather than one that has to be unpicked.
      ...Object.entries(text).flatMap(([code, fields]) =>
        (Object.keys(textProperty) as TextField[])
          .filter((field) => fields[field] !== undefined)
          .map((field) => ({
            field,
            key: code,
            origin: { key: code, map: 'text' as const, property: field },
            source: `${code}  ->  ${textProperty[field]}: '${fields[field]}',`,
          })),
      ),
      /*
       * A whole registry entry, and a layout entry beside it, because a card is
       * written down in two files. The two are handed back as one change so a
       * reader pasting half of it is not a thing that can happen quietly.
       */
      ...Object.entries(cards).flatMap(([code, card]) => {
        // An adapter states no position. Its box follows from the card it
        // clasps, so a layout line placing one would be a second answer to a
        // question the model already answers - and the two would part company
        // the first time that card was dragged. Its ports are its own, so it
        // states those.
        const ports = `ports: { ${(['north', 'east', 'south', 'west'] as const)
          .filter((side) => card.ports[side] !== undefined)
          .map((side) => `${side}: ${card.ports[side]}`)
          .join(', ')} }`

        return [
          {
            field: 'create-card' as const,
            key: code,
            origin: { key: code, map: 'cards' as const },
            source: `${code}  ->  { code: '${code}', id: '${card.id}', label: '${card.label}', detail: '${card.detail}', group: '${card.group}', scopes: [${card.scopes.map((scope) => `'${scope}'`).join(', ')}]${card.wraps ? `, wraps: '${card.wraps}'` : ''} },`,
          },
          {
            field: 'card' as const,
            key: code,
            origin: { key: code, map: 'cards' as const },
            source: card.box ? `${code}  ->  card(${card.box.x}, ${card.box.y}), ${ports},` : `${code}  ->  ${ports},`,
          },
        ]
      }),
      /*
       * A whole entry rather than one property of one, because that is what a
       * created line is. `id` is left for the reader: a code says which family
       * a line belongs to and a name says what it is for, and only the second
       * of those can be worked out by someone who knows why they drew it.
       */
      ...Object.entries(creations).map(([code, line]) => ({
        field: 'create' as const,
        key: code,
        origin: { key: code, map: 'creations' as const },
        source: `${code}  ->  create: { family: '${line.family}', id: '', source: '${line.source}', sourcePort: '${line.sourcePort}', target: '${line.target}', targetPort: '${line.targetPort}' },`,
      })),
      ...Object.entries(removals).map(([code, { because }]) => ({
        field: 'remove' as const,
        key: code,
        origin: { key: code, map: 'removals' as const },
        source: `${code}  ->  remove${because ? `, with ${because}` : ''}`,
      })),
      ...Object.entries(portCounts).map(([code, counts]) => ({
        field: 'ports' as const,
        key: code,
        origin: { key: code, map: 'ports' as const },
        source: `${code}  ->  ports: { ${(['north', 'east', 'south', 'west'] as const)
          .filter((side) => counts[side] !== undefined)
          .map((side) => `${side}: ${counts[side]}`)
          .join(', ')} },`,
      })),
    ]

    /*
     * One line per property, and every line about one thing together. A route
     * carried by a component move and the same route edited by hand both set
     * points, so without this the set carries the code twice and whichever the
     * reader pastes second silently wins. The later entry is the current one -
     * a hand edit is worked out from what is already on screen - so it is the
     * one kept, and it keeps its own place in the list.
     */
    const latest = new Map<string, PendingChange>()
    for (const change of every) latest.set(`${change.key}|${change.field}`, change)

    // A draft that has come back round to what the model already says is not a
    // change. That happens as soon as a set is applied and the page reloads: the
    // draft persists, the model has caught up with it, and it would otherwise
    // sit in the list for ever describing a difference that no longer exists.
    const kept = new Set(
      [...latest.values()].filter((change) => change.source !== diagram.authored(change.key, change.field)),
    )

    /*
     * By code, and by number within a code's prefix, so the list reads the way
     * the codes do: MS-2 before MS-10 rather than after it. Order of arrival
     * put a change wherever the reader happened to make it, which is no order
     * at all once there are forty of them.
     */
    const parts = (key: string) => {
      const [, prefix = key, number = ''] = /^([A-Z]+)-(\d+)$/.exec(key) ?? []
      return { number: Number(number), prefix }
    }
    const rank = (field: PendingField) => ['card', 'ports', 'source', 'target', 'points', 'label'].indexOf(field)

    return every
      .filter((change) => kept.has(change))
      .sort((left, right) => {
        const a = parts(left.key)
        const b = parts(right.key)
        return a.prefix.localeCompare(b.prefix) || a.number - b.number || rank(left.field) - rank(right.field)
      })
  }, [attachments, cards, changes, creations, diagram, labels, portCounts, removals, routes, text])

  return {
    // A route-only edit is still a change the Discard button has to be able to
    // act on - ChangePane disables that button at count 0, so leaving routes
    // out here would make an edited waypoint undiscardable by anything but Undo.
    changeCount: pending.length,
    hasChanges: changes.length > 0 || Object.keys(portCounts).length > 0 || Object.keys(routes).length > 0,
    drafts: offsets,
    canRedo: future.length > 0,
    canUndo: past.length > 0,
    /*
     * Drop everything, by restoring the empty draft.
     *
     * This named its maps one by one and had fallen two behind twice over: it
     * never cleared typed names or marked removals, and it did not learn about
     * created lines or created cards either. So the bin emptied the change pane
     * of some things and left others sitting there, which is worse than not
     * having a bin - a reader takes an empty-looking pane at its word.
     *
     * `restore` already has to write every draft for undo to be undo, and
     * `EditorDraft` already has to name every one for the type to be right.
     * Going through both means a tenth draft cannot be added without the
     * compiler asking what discarding it looks like.
     */
    discard: () => {
      checkpoint()
      closeGesture()
      restore(emptyDraft)
    },
    editing,
    guides,
    // A drop is pulled onto the nearest guide first, then described. The diagram
    // decides what it means, so a move it forbids records nothing.
    moveTo: (key: string, point: Point) => {
      /*
       * A label travels along its line and nowhere else, so it is pulled onto
       * the line first and only then snapped - and only on the axis the run it
       * landed on actually travels. Snapping the loose pointer to the grid and
       * to the guides before projecting moved the label somewhere neither the
       * grid nor the line agreed with, which is what made a drop feel like it
       * slid off on its own.
       */
      const onLine = diagram.onRoute(key, point)
      if (onLine) {
        const axis = onLine.vertical ? 'y' : 'x'
        let at = view.grid ? { ...onLine.at, [axis]: toGrid(onLine.at)[axis] } : onLine.at
        if (view.snapping) {
          const pulled = snapToGuides(at, diagram.guidesFor(key))
          setGuides(pulled.guides)
          at = { ...at, [axis]: pulled.point[axis] }
        } else setGuides([])

        const along = diagram.alongFor(key, at)
        if (along !== undefined) {
          checkpoint()
          setSelected(key)
          setLabels((current) => ({ ...current, [key]: along }))
        }
        return
      }

      const wanted = view.grid ? toGrid(point) : point
      const snapped = view.snapping ? snapToGuides(wanted, diagram.guidesFor(key)) : { guides: [], point: wanted }
      setGuides(snapped.guides)
      const offset = diagram.offsetFor(key, snapped.point)
      if (offset) {
        checkpoint()
        setSelected(key)
        setDrafts((current) => ({ ...current, [key]: { ...offset, from: diagram.authored(key, 'card') } }))
      }
    },
    // Nudging works on the offset directly rather than through a point, so it is
    // exact: a unit is a unit, with no guide pulling it somewhere near instead.
    nudge: (dx: number, dy: number) => {
      if (!selected) return
      checkpoint()
      closeGesture()
      setDrafts((current) => {
        const at = current[selected] ?? diagram.describe(selected, { dx: 0, dy: 0 })?.offset
        if (!at) return current
        return { ...current, [selected]: { dx: at.dx + dx, dy: at.dy + dy, from: diagram.authored(selected, 'card') } }
      })
    },
    attachments,
    // Re-attaching an end is choosing a different port, not placing a point -
    // which is why it records a port id rather than a coordinate.
    attachTo: (code: string, end: 'source' | 'target', port: string, component: string) => {
      checkpoint()
      closeGesture()
      setAttachments((current) => ({
        ...current,
        [code]: { ...current[code], [end]: { component, port, from: diagram.authored(code, end) } },
      }))
    },
    /*
     * Make a line between two ports.
     *
     * The code comes from the caller for the same reason the lines a removal
     * takes do: this hook holds no Infoschematic, so it cannot know which series a
     * family numbers in or how far along that series the model has got. It
     * selects what it made, because a line drawn and then not selected leaves
     * the reader to find it before they can do anything else with it.
     */
    create: (code: string, line: Creation) => {
      checkpoint()
      closeGesture()
      setCreations((current) => ({ ...current, [code]: line }))
      setSelected(code)
    },
    cards,
    created,
    createdCards,
    creations,
    /*
     * Make a card.
     *
     * The code, the id and the box all come from the caller, because none of
     * them is the editor's to decide: which series a scope numbers in, what an
     * id should look like in this model, and where on the Infoschematic there is room
     * are all questions about the diagram. What this owns is that making one is
     * an undoable edit, and that the new card is what the reader is now working
     * on.
     */
    createCard: (code: string, card: CardCreation) => {
      checkpoint()
      closeGesture()
      setCards((current) => ({ ...current, [code]: card }))
      setSelected(code)
    },
    hover: setHovered,
    hovered,
    labelPositions,
    labels,
    identity: selected ? diagram.identityOf(selected) : undefined,
    placement: selected ? diagram.placementFor(selected) : undefined,
    // Typing a coordinate and dragging are the same move, so this records the
    // same draft offset a drag would - worked out from where the thing is now,
    // which already includes any offset it is carrying.
    placeAt: (key: string, axis: 'x' | 'y', value: number) => {
      const at = diagram.placementFor(key)
      if (at?.kind !== 'box' || !Number.isFinite(value)) return
      const delta = value - at.box[axis]
      if (delta === 0) return
      checkpoint()
      closeGesture()
      setSelected(key)
      setDrafts((current) => {
        const offset = current[key] ?? { dx: 0, dy: 0 }
        const from = diagram.authored(key, 'card')
        return {
          ...current,
          [key]: axis === 'x' ? { ...offset, dx: offset.dx + delta, from } : { ...offset, dy: offset.dy + delta, from },
        }
      })
    },
    portCounts,
    routes,
    // Route edits are worked out from whatever points are on screen right now,
    // which the caller already has - the hook holds no Infoschematic of its own, so
    // it cannot look a flow's current points up for itself.
    addWaypoint: (code: string, points: readonly Point[], at: Point) => {
      const wanted = view.grid ? toGrid(at) : at
      const next = waypoints.insertWaypoint(points, wanted)
      checkpoint()
      closeGesture()
      setRoutes((current) => ({ ...current, [code]: next }))
    },
    /*
     * Put a route back to a stated one, waypoints and all.
     *
     * The whole list rather than an edit to it, because clearing a route is not
     * an edit to its waypoints - it is a different route, and the one the
     * caller wants is the one only the Infoschematic can work out, between the two
     * ports the line actually names.
     */
    setRoute: (code: string, points: readonly Point[]) => {
      checkpoint()
      closeGesture()
      setRoutes((current) => ({ ...current, [code]: points }))
    },
    // A drag, like moveTo: checkpointed on every move, closed by releaseGuides
    // once the pointer lifts rather than here.
    moveWaypoint: (code: string, points: readonly Point[], index: number, to: Point) => {
      const wanted = view.grid ? toGrid(to) : to
      const next = waypoints.moveWaypoint(points, index, wanted)
      checkpoint()
      setRoutes((current) => ({ ...current, [code]: next }))
    },
    deleteWaypoint: (code: string, points: readonly Point[], index: number) => {
      checkpoint()
      closeGesture()
      setRoutes((current) => ({ ...current, [code]: waypoints.deleteWaypoint(points, index) }))
    },
    // Also a drag, closed the same way moveWaypoint is.
    // An end anchored to no component has no ports to choose between, so it is
    // placed rather than chosen - the only end in the diagram that is.
    moveFreeEnd: (code: string, points: readonly Point[], end: 'end' | 'start', to: Point) => {
      const wanted = view.grid ? toGrid(to) : to
      const from = end === 'start' ? points[0] : points.at(-1)
      if (!from) return
      const next = normaliseRoute(moveRouteEnd(points, end, { dx: wanted.x - from.x, dy: wanted.y - from.y }))
      checkpoint()
      setRoutes((current) => ({ ...current, [code]: next }))
    },
    moveSegment: (code: string, points: readonly Point[], index: number, to: Point) => {
      const wanted = view.grid ? toGrid(to) : to
      const next = waypoints.moveSegment(points, index, wanted)
      checkpoint()
      setRoutes((current) => ({ ...current, [code]: next }))
    },
    // Clicking the Infoschematic backdrop reports an empty string rather than null,
    // since it is wired through the same string-keyed onSelect every handle
    // uses - so an empty key is read here as "nothing", the one string no
    // handle is ever keyed by.
    select: (key: string) => setSelected(key === '' ? null : key),
    selectedComponent: selectedHandle?.kind === 'component' ? selected : null,
    selectedCounts,
    selected,
    // Port counts are a property of a component, so they are recorded against it
    // rather than against a drag.
    setPortCount: (code: string, side: Side, count: number) => {
      checkpoint()
      closeGesture()
      const next = { ...portCounts[code], [side]: Math.max(0, count) }
      setPortCounts((current) => ({ ...current, [code]: next }))

      // The ends meeting this component keep their place, not their number.
      // Renumbering a side without this leaves each end naming somewhere it is
      // not, and the line jumps to wherever that number now falls.
      const reseated = diagram.reseat(code, next)
      if (reseated.length > 0) {
        setAttachments((current) => {
          const updated = { ...current }
          for (const { code: flow, component, end, port } of reseated) {
            updated[flow] = {
              ...updated[flow],
              [end]: { component, port, from: diagram.authored(flow, end) },
            }
          }
          return updated
        })
      }
    },
    redo: () => {
      const next = future.at(-1)
      if (!next) return
      closeGesture()
      setFuture((current) => current.slice(0, -1))
      setPast((current) => [
        ...current,
        { attachments, cards, creations, drafts, labels, portCounts, removals, routes, text },
      ])
      restore(next)
    },
    /*
     * A card's name, subtitle or scope, or a line's family. Cleared rather than
     * stored when it comes back to what the model already says, so returning a
     * field by hand removes its line instead of leaving one that changes
     * nothing - the sweep below would drop it anyway, but only until the next
     * keystroke put it back.
     */
    retext: (code: string, field: TextField, value: string) => {
      checkpoint()
      closeGesture()

      /*
       * A card that does not exist yet is edited in place, not described.
       *
       * Every other draft says how something authored should differ, so naming
       * a created card through the same route produced two lines about one
       * card: the creation still saying `New card` and a text draft saying what
       * it had been renamed to. Both true, neither the whole story, and a
       * reader pasting them has to apply them in order to get what they see on
       * the Infoschematic. There is nothing to differ from here, so the creation itself
       * is what changes.
       */
      if (cards[code]) {
        const property = ({ detail: 'detail', group: 'group', name: 'label' } as const)[
          field as 'detail' | 'group' | 'name'
        ]
        if (property) {
          setCards((current) => ({
            ...current,
            [code]: {
              ...current[code],
              [property]: value,
              // A card's scope is also the list it appears under, and a created
              // card belongs to exactly the one it was made in.
              ...(property === 'group' ? { scopes: [value] } : {}),
            },
          }))
        }
        return
      }

      const authored = diagram.authored(code, field)
      const same = authored === `${code}  ->  ${textProperty[field]}: '${value}',`
      setText((current) => {
        const fields = { ...current[code] }
        if (same) delete fields[field]
        else fields[field] = value
        if (Object.keys(fields).length === 0) {
          const { [code]: _gone, ...rest } = current
          return rest
        }
        return { ...current, [code]: fields }
      })
    },
    /*
     * Mark a thing for removal, and everything that cannot survive without it.
     *
     * A second call on the same code lifts the mark, so removal is a toggle
     * rather than a trapdoor - and lifting a card's mark lifts the marks its
     * removal put on the lines, since those were never chosen directly.
     */
    remove: (code: string, meeting: readonly string[] = []) => {
      checkpoint()
      closeGesture()

      /*
       * Deleting something that was never authored un-makes it rather than
       * marking it. A change set that says to add a line and then to take it
       * away again is two instructions that cancel, and handing a reader those
       * to paste is worse than handing them nothing.
       */
      const unmade = new Set([code, ...meeting].filter((key) => creations[key]))
      if (unmade.size > 0) {
        setCreations((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !unmade.has(key))))
      }
      // A created card goes the same way its lines do. Its own lines are in
      // `meeting`, so they are already accounted for above or below.
      if (cards[code]) {
        setCards((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== code)))
      }
      if (unmade.has(code) || cards[code]) {
        if (meeting.some((line) => !unmade.has(line))) {
          setRemovals((current) => ({
            ...current,
            ...Object.fromEntries(meeting.filter((line) => !unmade.has(line)).map((line) => [line, { because: code }])),
          }))
        }
        return
      }

      setRemovals((current) => {
        if (current[code]) {
          return Object.fromEntries(
            Object.entries(current).filter(([key, entry]) => key !== code && entry.because !== code),
          )
        }
        const taken = Object.fromEntries(
          meeting.filter((line) => !unmade.has(line)).map((line) => [line, { because: code }]),
        )
        return { ...current, ...taken, [code]: {} }
      })
    },
    removals,
    releaseGuides: () => {
      closeGesture()
      setGuides([])
    },
    undo: () => {
      const previous = past.at(-1)
      if (!previous) return
      closeGesture()
      setPast((current) => current.slice(0, -1))
      setFuture((current) => [
        ...current,
        { attachments, cards, creations, drafts, labels, portCounts, removals, routes, text },
      ])
      restore(previous)
    },
    pending,
    source: pending.map((change) => change.source).join('\n'),
    text,
    // Dropping one change rather than all of them. Undoable like any other edit.
    discardOne: (origin: PendingOrigin) => {
      checkpoint()
      closeGesture()
      const without = <T>(current: Record<string, T>) => {
        const { [origin.key]: _gone, ...rest } = current
        return rest
      }
      if (origin.map === 'components') setDrafts(without)
      if (origin.map === 'cards') setCards(without)
      if (origin.map === 'creations') setCreations(without)
      if (origin.map === 'labels') setLabels(without)
      if (origin.map === 'routes') setRoutes(without)
      if (origin.map === 'ports') setPortCounts(without)
      // Lifting a card's removal lifts the lines it took with it.
      if (origin.map === 'removals') {
        setRemovals((current) =>
          Object.fromEntries(
            Object.entries(current).filter(([key, entry]) => key !== origin.key && entry.because !== origin.key),
          ),
        )
      }
      if (origin.map === 'text') {
        setText((current) => {
          const fields = { ...current[origin.key] }
          if (origin.property) delete fields[origin.property]
          if (Object.keys(fields).length === 0) return without(current)
          return { ...current, [origin.key]: fields }
        })
      }
      if (origin.map === 'attachments') {
        setAttachments((current) => {
          const ends = { ...current[origin.key] }
          if (origin.end) delete ends[origin.end]
          if (!ends.source && !ends.target) return without(current)
          return { ...current, [origin.key]: ends }
        })
      }
    },
    // Editing is a panel tab, so it is set rather than toggled: the tab is the
    // single place the mode is chosen from.
    setEditing: (next: boolean) => {
      // Entering and leaving decide the view; staying does not. The panel sets
      // this from an effect that re-runs on every render, so resetting the view
      // unconditionally undid a grid turned off before it could be seen.
      if (next === editing) return
      setMode(next ? 'design' : null)
      setView(next ? openView : closedView)
      if (!next) setSelected(null)
    },
    /*
     * Switch editors. The selection does not survive it: what is selected in
     * one editor means something the other has no use for - a port in the Infoschematic
     * editor is not something a scene can light - and carrying it across is how
     * a control ends up behaving differently in each mode.
     */
    setMode: (next: EditorMode) => {
      if (next === mode) return
      closeGesture()
      setMode(next)
      setView(next === 'design' ? openView : closedView)
      setSelected(null)
    },
    mode,
    toggleView: (key: keyof EditorView) => setView((current) => ({ ...current, [key]: !current[key] })),
    view,
  }
}
