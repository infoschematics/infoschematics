# Present View design intent

Present View is the audience-facing composition around an Infoschematic. It lets a presenter control what remains visible, focus the Audience on a Scene, move through a Story and explain the model without changing the model itself.

Present View owns reusable presentation behaviour. Authored content, attribution and geometry come from the Infoschematic; product identity and surrounding application behaviour come from the host.

## Audience questions

Present View should answer three questions in order:

1. **What is this Infoschematic?** The Infoschematic panel shows the Cards, Fabrics and Flows and how they relate.
2. **What is showing now?** Producer controls and Info explain which scopes and flow families remain visible.
3. **What should I follow?** A Scene focuses part of the same Infoschematic, and a Story moves through a sequence of those focused explanations.

The Infoschematic answers first. Controls and Details help the Audience read it without becoming a competing application surface.

## Production mode boundary

Present is one member of the transient `ProductionMode` union: `present`, `design` or `direct`. A newly mounted application and every reload begin in Present. The current mode is session state, never an Audience preference and never part of authored `InfoschematicConfig`.

The state behind those modes has three distinct owners:

- **Audience preferences and filters** retain choices such as visible Scopes, visible Flow families, annotations, takeaways and automatic-advance preference.
- **Presentation activity** holds the active Standalone Scene, Thematic Scene or Story, its step and whether playback is currently advancing.
- **Producer editing** holds Design or Direct selection, draft targets, pending changes and editing history.

Changing mode cleans up only the activity that cannot safely cross the boundary. Entering Design or Direct stops Story playback and clears presentation focus while preserving Audience preferences and filters. Returning to Present restores those preferences and filters, but does not restore a previous focus or restart playback.

## Visibility and focus

Visibility filters and Scene focus are independent dimensions.

- Scope and flow-family controls are **subtractive**. They decide which artefacts and Flows remain present.
- A Scene is **emphatic**. It keeps the visible Infoschematic in place, brings named content forward and pushes the remaining visible content back.

These dimensions compose in one direction: Present applies Scope and Flow-family filters first, then focuses only the content that remains visible. Story focus takes precedence over Thematic Scene focus, which takes precedence over Standalone Scene focus, while the state permits at most one of them to be active. Clearing every Scene leaves all visible content at full strength.

Design and Direct do not inherit this Audience filtering. They operate on complete authored content so a hidden artefact cannot become unreachable in Design and Direct can preview its own draft focus without changing the focus Present will use.

## Stable composition

Presentation changes emphasis, not geometry. Card and Fabric placement, Flow routes, ports and labels stay fixed while filters and Scenes change. The Audience can therefore build a spatial memory of the Infoschematic instead of relearning its layout at every Story step.

A Callout is the exception only in the sense that it floats over the composition. Its position is selected from authored candidates according to the content in focus, or may be explicitly authored. It does not move the content beneath it.

A host may provide a versioned Callout renderer through the immutable View registry. The custom component receives validated properties and the standard Audience content, while Present retains the positioned live-status frame and Story actions. Unknown or invalid renderers therefore change treatment, not placement, navigation, or access to the explanation.

## Details and Info

The Details panel explains the current presentation and offers a way to inspect the model. Its Info view is a derived register rather than a second authored description: Cards, Fabrics and Flows are grouped and labelled from the same runtime model used by the Infoschematic panel.

This makes Info useful for orientation without creating another source that can disagree with the diagram. Interaction between the register and the Infoschematic may point to the same subject, but that transient pointer is distinct from a selected Scene.

## Full-canvas presentation

The Infoschematic is the presentation surface, so it must be able to take the available canvas. The Details panel and expanded Producer controls may collapse while a compact rail preserves the filters, Story controls and Thematic Scene controls needed during a presentation. Page-level full screen is a separate action and composes with the collapsed layout.

The title bar remains stable across those modes. Entering a larger presentation mode must not strand the controls needed to leave it or change what the Audience is seeing.

## Keyboard and accessibility intent

The primary presentation actions are available as ordinary labelled buttons and are mirrored by contextual keyboard shortcuts. While a Story runs, left and right step through it, space holds or resumes automatic advance, and Escape stops it. Thematic Scenes use the same stepping keys without implying playback.

Keyboard help is available in the view and groups bindings by the context in which they apply. Callouts announce changes politely and expose explicit previous, next and exit controls, so keyboard shortcuts remain an acceleration rather than the only route through a Story.
