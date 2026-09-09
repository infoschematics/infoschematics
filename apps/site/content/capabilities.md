# Capabilities beyond the diagram

_Vocabulary: [Scene](/docs/reference/vocabulary/#scene), [Standalone Scene](/docs/reference/vocabulary/#standalone-scene), [Theme](/docs/reference/vocabulary/#theme), [Story](/docs/reference/vocabulary/#story), [Callout](/docs/reference/vocabulary/#callout), [Scope](/docs/reference/vocabulary/#scope), [Domain](/docs/reference/vocabulary/#domain), [Flow family](/docs/reference/vocabulary/#flow-family), [Graphic](/docs/reference/vocabulary/#graphic)._

The diagram is one part of an Infoschematic. The same serialisable definition also carries the material that explains, filters, and presents that diagram. None of it changes the diagram's geometry: presentation changes emphasis, not layout, so an audience can build a spatial memory of the Infoschematic instead of relearning it at every step.

## Scenes focus attention

A **Scene** focuses named artefacts and Flows, reveals Graphics, and may carry one Callout of explanatory content. It keeps the visible Infoschematic in place, brings the named content forward, and pushes the remaining visible content back.

A **Standalone Scene** lives on its own and can be activated directly. Copying one into a Theme or Story creates independently owned material — there are no hidden links back to the original, so later edits affect only the copy.

## Themes and Stories arrange Scenes

A **Theme** owns an ordered collection of Scenes without adding timing or narrative claims — a set of viewpoints to step between.

A **Story** owns an ordered sequence of Scenes and can add narrative timing. It is the presentation form: an audience steps or plays through it, and each step is one focused explanation of the same diagram.

## Scopes filter, Domains classify

**Scopes** control applicability: which artefacts and Flows are relevant to a given audience. Scope filtering is subtractive — it decides what remains present. **Flow families** give Flows shared identity and colour, and can be filtered the same way.

A **Domain** classifies a Card and supplies its semantic colour. Domain and Scope communicate separate facts: changing the visible Scope set never reclassifies a Card's Domain treatment.

Filters and Scenes compose in one direction: filters decide what is visible, then a Scene focuses only the content that remains. Clearing every Scene leaves all visible content at full strength.

## Graphics and Callouts add explanation

A **Graphic** is authored visual material selected by a stable renderer key — the host supplies the implementation. Scenes commonly reveal Graphics to add explanatory drawings at the right moment.

A **Callout** floats explanatory content over the composition. Its position is chosen from authored candidates according to what is in focus, or authored explicitly; it never moves the content beneath it.

## Signals stay transient

A Flow **signal** is a transient presentation occurrence — something moved just now. Signals are never authored data: a Scene may focus Flows because focus is durable, and entering that Scene can be interpreted as one signal per focused Flow, but no signal state, timers, or animation policy enters the definition. The diagram must make sense as a still image; motion never carries meaning absent from authored content.

## Where next

The [authoring guide](/docs/authoring/) shows how to write all of this into a definition. The [Present view guide](/docs/present/) shows how an audience experiences it.
