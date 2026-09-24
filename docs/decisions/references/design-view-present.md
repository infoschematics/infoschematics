# Present View design intent

[Present View](/docs/reference/vocabulary/#present) is the audience-facing composition around an Infoschematic. It lets a presenter control what remains visible, focus the [Audience](/docs/reference/vocabulary/#audience) on a [Scene](/docs/reference/vocabulary/#scene), move through a [Sequence](/docs/reference/vocabulary/#sequence) and explain the model without changing the model itself.

Present View owns reusable presentation behaviour. Authored content, attribution and geometry come from the Infoschematic; product identity and surrounding application behaviour come from the host.

## Audience questions

Present View should answer three questions in order:

1. **What is this Infoschematic?** The Infoschematic panel shows the Cards, Fabrics and Flows and how they relate.
2. **What is showing now?** Producer controls and Info explain which scopes and flow families remain visible.
3. **What should I follow?** A Scene focuses part of the same Infoschematic, and a Sequence orders those focused explanations with explicit selection and timing behaviour.

The Infoschematic answers first. Controls and Details help the Audience read it without becoming a competing application surface.

## The production boundary

Present is one side of a transient capability boundary: either a `Producer`'s tools are out or they are not, and the workspace they would return to — `design` or `direct` — is a second, independent axis. A newly mounted application and every reload begin not producing. Both axes are session state, never an Audience preference and never part of authored `InfoschematicConfig`.

The state behind that boundary has three distinct owners:

- **Audience preferences and filters** retain choices such as visible Scopes, visible Flow families, annotations, takeaways and automatic-advance preference.
- **Presentation activity** holds the active Standalone or Sequence Scene, its step, how far through that Scene's cue cascade the step has reached, and whether timed playback is currently advancing. A stage belongs here rather than in a timer or a ref because derivation must give one answer from one state, and a Sequence spends its step on a stage before spending it on the next Scene.
- **Producer editing** holds Design or Direct selection, draft targets, pending changes and editing history.

Changing either axis cleans up only the activity that cannot safely cross the boundary. Entering Design or Direct stops Sequence playback and clears presentation focus while preserving Audience preferences and filters. Returning to Present restores those preferences and filters, but does not restore a previous focus or restart playback.

## Visibility and focus

Visibility filters and Scene focus are independent dimensions.

- Scope and flow-family controls are **subtractive**. They decide which artefacts and Flows remain present.
- A Scene is **emphatic**. It keeps the visible Infoschematic in place, brings named content forward and pushes the remaining visible content back.

These dimensions compose in one direction: Present applies Scope and Flow-family filters first, then focuses only the content that remains visible. The state permits at most one Standalone or Sequence Scene to be active. Clearing every Scene leaves all visible content at full strength.

Design and Direct do not inherit this Audience filtering. They operate on complete authored content so a hidden artefact cannot become unreachable in Design and Direct can preview its own draft focus without changing the focus Present will use.

## Stable composition

Presentation changes emphasis, not geometry. Card and Fabric placement, Flow routes, ports and labels stay fixed while filters and Scenes change. The Audience can therefore build a spatial memory of the Infoschematic instead of relearning its layout at every Sequence step.

A Callout is the exception only in the sense that it floats over the composition. Its position is selected from authored candidates according to the content in focus, or may be explicitly authored. It does not move the content beneath it.

A host may provide a versioned Callout renderer through the immutable View registry. The custom component receives validated properties and the standard Audience content, while Present retains the positioned live-status frame and applicable Sequence actions. Unknown or invalid renderers therefore change treatment, not placement, navigation, or access to the explanation.

## Details and Info

The Details panel explains the current presentation and offers a way to inspect the model. Its Info view is a derived register rather than a second authored description: Cards, Fabrics and Flows are grouped and labelled from the same runtime model used by the Infoschematic panel.

This makes Info useful for orientation without creating another source that can disagree with the diagram. Interaction between the register and the Infoschematic may point to the same subject, but that transient pointer is distinct from a selected Scene.

## Full-canvas presentation

The Infoschematic is the presentation surface, so it must be able to take the available canvas. The Details panel and expanded Producer controls may collapse while a compact rail preserves the filters and Sequence controls needed during a presentation. Page-level full screen is a separate action and composes with the collapsed layout.

The title bar remains stable wherever a session stands on either axis. Entering a larger presentation layout must not strand the controls needed to leave it or change what the Audience is seeing.

## Keyboard and accessibility intent

The primary presentation actions are available as ordinary labelled buttons and are mirrored by contextual keyboard shortcuts. Left and right step through an active Sequence, Escape stops it, and space holds or resumes automatic advance when the Sequence is timed.

Keyboard help is available in the view and groups bindings by the context in which they apply. Callouts announce changes politely and expose explicit previous, next and exit controls, so keyboard shortcuts remain an acceleration rather than the only route through a Sequence.
