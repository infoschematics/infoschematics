# Related tools and inspiration

This is a curated set of adjacent projects worth revisiting when designing Infoschematics authoring, rendering, presentation, and documentation. Inclusion means that a project offers a useful comparison or design lesson; it does not make the project a dependency or imply feature parity.

## Model-driven architecture

- **[Ilograph](https://www.ilograph.com/)** — defines a reusable resource model and presents it through relationship and sequence perspectives, walkthroughs, and different levels of detail. Its model reuse, focused views, flow explanations, and accessible navigation are useful comparisons for Scopes, Scenes, Stories, and Present.
- **[LikeC4](https://likec4.dev/)** — models components, boundaries, and relationships in a small architecture DSL, then generates focused diagrams that can be exported, embedded, or explored. Its separation between one model and many audience-specific views is directly relevant to Infoschematics.
- **[Structurizr](https://www.structurizr.com/)** — uses the C4 model to create multiple software-architecture diagrams from one workspace. Its strict model-and-view split, hierarchical zoom, manual layout overrides, and static export paths are useful references for keeping authored meaning separate from rendering.

## Diagram as code

- **[Diagrams](https://diagrams.mingrammer.com/)** — creates cloud architecture diagrams from Python source and includes an online playground. Its version-controlled authoring model, provider and node catalogue, separation between source and rendered output, and no-install browser path are useful comparisons for Infoschematics. [Browse the source repository](https://github.com/mingrammer/diagrams).
- **[D2](https://www.d2lang.com/)** — turns a compact declarative language into SVG, PNG, or PDF using interchangeable layout engines and production-ready themes. Its rendering pipeline, language tooling, theming, and layout choices are useful references for static output and authoring feedback.
- **[Mermaid](https://mermaid.js.org/)** — embeds a broad diagram vocabulary directly in documentation and supports configurable layouts, themes, and accessible titles and descriptions. Its low-friction integration and progressive syntax are useful comparisons for documentation embedding and approachable authoring.

## Visual architecture editors

- **[Cloudcraft](https://www.cloudcraft.co/)** — provides a browser-based visual editor for AWS and Azure architecture diagrams, including diagrams created from existing cloud environments. Its resource-aware visual vocabulary, direct manipulation, filtering, and approach to keeping diagrams current are useful comparisons for Components, Studio, and future data-backed views. [Read the Cloudcraft documentation](https://docs.datadoghq.com/cloudcraft/).
- **[Isoflow](https://isoflow.io/)** — creates visual documentation for networks and software architecture with a distinctive isometric vocabulary. Its spatial grouping, infrastructure iconography, version history, sharing, and image exports are useful references for producing attractive still schematics without losing structural clarity.

## Reusable visual libraries

- **[Excalidraw Libraries](https://libraries.excalidraw.com/)** — collects reusable community-made symbols for subjects including data visualisation, infrastructure, interfaces, and electrical schematics. Its discoverable library model and approachable hand-drawn treatment are useful references for reusable Graphics and less formal explanatory views.

## Node editors and graph layout

- **[React Flow](https://reactflow.dev/)** — is an MIT-licensed React library for node-based editors and interactive diagrams. Its custom nodes, Handles, Edges, connection events, selection, keyboard interaction, and save-and-restore examples are useful references for Studio interaction, but it supplies an editor surface rather than Infoschematic semantics. Its [Workflow Editor template](https://reactflow.dev/ui/templates/workflow-editor) is the closest first-party example of a complete workflow-authoring shell.
- **[Svelte Flow](https://svelteflow.dev/)** — is the Svelte member of the same xyflow family, with equivalent node, Handle, Edge, grouping, layout, and interaction ideas expressed through Svelte. Its [examples](https://svelteflow.dev/examples) are especially useful for focused interaction studies.
- **[Comgy](https://svelteflow.dev/showcase)** — uses Svelte Flow to model and visualise energy flows across real estate. It is a particularly relevant showcase for operational architecture, because the same topology can carry live measures without becoming the execution model. Comparable React Flow references include its broad [project showcase](https://reactflow.dev/showcase), especially Carto’s data pipelines, ChartDB and Liam ERD for entity relationships, and media or automation tools such as Bleu AI, GenAIntel, and Dafthunk.
- **[Rete.js](https://retejs.org/)** — is a TypeScript-first framework for visual interfaces and workflows with sockets, connections, custom controls, framework renderers, and dataflow or control-flow processing. Its separation between graph processing and interchangeable visualisation is a useful comparison for Ports and host-supplied renderers.
- **[Eclipse Layout Kernel](https://eclipse.dev/elk/)** — computes automatic layouts for graph viewers and editors, including Ports and hierarchical nodes, but deliberately does not render the final drawing. Its model-to-layout boundary and layered routing options are useful references if Infoschematics later offers automatic placement.

## Workflow and process systems

- **[bpmn-js](https://bpmn.io/toolkit/bpmn-js/)** — embeds a BPMN 2.0 viewer or modeler in a browser and reads and writes standards-compliant BPMN XML. It is the specialist reference for native process semantics, modelling rules, extension points, and future BPMN-to-Infoschematic translation.
- **[Node-RED](https://nodered.org/docs/user-guide/editor/)** — provides a low-code editor where people place nodes, wire them together, and run event-driven Flows. Its palette, workspace, deploy boundary, subflows, and import/export experience are useful references for authoring and source adapters, not a replacement for the Infoschematic model.
- **[n8n](https://docs.n8n.io/)** — combines a visual node editor with executable workflow automation and explicit data mapping between nodes. Its diagrams are especially useful references for distinct trigger, action, decision, and service shapes; labelled branch outputs; typed auxiliary Ports; visually quieter dashed dependency Flows; recognisable provider icons; and obvious add-node affordances. Exported workflows could be an import source or operational integration, but n8n is a product rather than a general diagramming library. Its editor code is covered by the [Sustainable Use License](https://docs.n8n.io/privacy-and-security/sustainable-use-license/), which restricts some commercial and customer-facing uses, so embedding or deriving from it requires separate licensing review.

## What to capture

When adding a project, note the specific idea worth revisiting rather than recording a bare link. Useful areas include authoring models, reusable visual vocabulary, interactive editing, static rendering, presentation, accessibility, and documentation structure.
