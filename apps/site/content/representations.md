# Representation patterns

An [Infoschematic](/docs/reference/vocabulary/#infoschematic) is primarily an architectural explanation: it shows components, the interfaces between them, the specifications they realise, and the interactions that make the system work. It is not limited to one diagram convention, but every view should help a reader understand a system rather than merely reproduce another tool’s notation.

## Architecture is the centre

The strongest fit is a system view in which:

- [Cards](/docs/reference/vocabulary/#standard-card) represent components or capabilities;
- [Fabrics](/docs/reference/vocabulary/#fabric) represent shared substrates or connectable planes;
- [Ports](/docs/reference/vocabulary/#port) identify where a component offers or consumes an interaction;
- [Flows](/docs/reference/vocabulary/#flow) connect those Ports;
- interfaces and specification groups record the technical contracts around the visible structure;
- Scopes, Scenes, Sequences, and Callouts explain the same structure to different Audiences.

That combination—structure, contracts, and explanation—is what distinguishes an Infoschematic from a general-purpose flowchart.

### Architecture dashboard views

A dashboard can use the same stable topology as an alternative to charts and tables. Nested Regions can show deployment or organisational boundaries; Cards can show services and resources; external dependencies can sit outside the main boundary; and Flows can cross between ingress, compute, storage, and delivery areas.

Operational measures should be applied as a view over that topology rather than changing its identity. The same component remains the same component when the audience switches from deployed architecture to cost, capacity, risk, traffic, or health. This is a strong use for Scenes and host-supplied status because it connects live evidence to an architecture people can already recognise.

## Supporting representations

The same visual grammar can support several useful secondary views.

### Workflows and processes

Cards can stand for steps, Points can mark starts, finishes, junctions, or continuation positions, and Flows can show the path between them. This works well for a readable overview of a process or handoff.

Infoschematics does not currently provide native decision symbols, BPMN execution semantics, timers, gateways, or token simulation. Use a specialist process modeler when those details are the subject of the diagram; use an Infoschematic when the process needs to be explained alongside the architecture it crosses.

### Entity context

Cards and Flows can show which entities exist and how they relate at a useful architectural level. This can clarify ownership, system boundaries, and where data is created or consumed.

It is not yet a complete entity-relationship notation: cardinality, optionality, keys, and schema constraints need explicit semantics before they can be treated as portable Infoschematic properties.

### Data and media pipelines

[Flow Families](/docs/reference/vocabulary/#flow-family) describe what a Flow carries and give related Flows a shared identity. That makes pipelines a natural fit: a connection can carry records, events, control messages, audio, video, manifests, or other named material without turning the diagram into an executable workflow.

The [live media pipeline preset](/playground/?preset=media-pipeline) shows a camera, encoder, packager, distribution service, and player connected by different kinds of media Flow. Open it in the Playground to inspect or change the authored YAML.

## Translating existing models

External definitions can become useful sources for future import adapters:

- [bpmn-js](https://bpmn.io/toolkit/bpmn-js/) is the appropriate specialist toolkit for viewing and editing native BPMN 2.0 XML in a browser;
- [Node-RED](https://nodered.org/docs/user-guide/editor/) and [n8n](https://docs.n8n.io/) define executable node-and-wire workflows whose exported structure could be translated into a reader-facing Infoschematic;
- [React Flow](https://reactflow.dev/) and [Svelte Flow](https://svelteflow.dev/) are useful references for node, Handle, connection, grouping, layout, and editor interactions rather than source formats Infoschematics needs to adopt;
- [Rete.js](https://retejs.org/) combines a visual editor framework with dataflow and control-flow processing;
- [ELK](https://eclipse.dev/elk/) computes graph layouts, including layouts with Ports and hierarchical nodes, but deliberately does not render the final diagram.

An import should produce ordinary serialisable Infoschematic data. It should preserve useful source identities and labels, report anything it cannot represent, and avoid claiming lossless round-tripping unless a specific adapter contract guarantees it. Importing a workflow does not make Infoschematics its execution engine.

## Embedding in an operational console

An operational console—including an HR or service-management console—can embed an interactive Infoschematic to explain how a configured or live system fits together. The surrounding application can bind selected artefacts to status, details, or authorised actions.

The boundary remains deliberate: the host owns live data, commands, permissions, persistence, and application state. The Infoschematic owns the portable explanatory structure and stable identities that the host binds to.

## Choose the right level

- Use Infoschematics for architectural understanding, audience explanation, and portable system views.
- Use a workflow engine when the model must execute, retry, schedule, or move production data.
- Use BPMN tooling when standards-compliant process semantics and interchange are essential.
- Use an ER modeling tool when cardinality and schema constraints are the primary subject.
- Use a node-editor library when you are building a new visual programming environment rather than authoring an Infoschematic.

Continue with [Components](/docs/components/) to understand the visual vocabulary, [Authoring](/docs/authoring/) to write a definition, or [React integration](/docs/react-integration/) to embed one in an application.
