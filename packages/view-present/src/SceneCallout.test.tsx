import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { defineInfoschematic } from "@infoschematics/domain-core";
import type { CalloutConfig } from "@infoschematics/domain-model/scene";
import {
  defineInfoschematicRenderers,
  InfoschematicRenderersContext,
  type RendererProperties,
} from "@infoschematics/view-canvas";
import { createInfoschematicRuntime } from "@infoschematics/view-model/runtime";
import { SceneCallout } from "./SceneCallout.tsx";

const runtime = createInfoschematicRuntime(
  defineInfoschematic({ title: "Callout renderer test" }),
);
const scene = { components: [], flows: [] } as const;
const standardProps = {
  body: "Audience content stays visible",
  eyebrow: "Story",
  onExit: () => undefined,
  onStep: () => undefined,
  runtime,
  scene,
  stepNumber: 1,
  stepTotal: 2,
  takeaways: ["Remember this"],
  title: "A standard callout",
} as const;

const renderCallout = (
  calloutConfig?: CalloutConfig,
  renderers = defineInfoschematicRenderers({}),
) =>
  renderToStaticMarkup(
    <InfoschematicRenderersContext value={renderers}>
      <SceneCallout {...standardProps} calloutConfig={calloutConfig} />
    </InfoschematicRenderersContext>,
  );

describe("SceneCallout renderers", () => {
  it("renders the standard accessible Callout when no custom renderer is authored", () => {
    const markup = renderCallout({ body: standardProps.body });

    expect(markup).toContain('role="status"');
    expect(markup).toContain("A standard callout");
    expect(markup).toContain("Audience content stays visible");
    expect(markup).toContain("Remember this");
    expect(markup).toContain('aria-label="Next step"');
  });

  it("passes validated serialisable properties and standard content to a custom Callout", () => {
    const renderers = defineInfoschematicRenderers({
      callouts: [
        {
          key: "emphasis",
          schemaVersion: 1,
          validateProperties: (properties: RendererProperties | undefined) =>
            typeof properties?.tone === "string"
              ? { valid: true as const, properties: { tone: properties.tone } }
              : { valid: false as const, reason: "tone must be a string" },
          component: ({
            children,
            properties,
          }: {
            children: ReactNode;
            properties: Readonly<{ tone: string }>;
          }) => <div data-custom-callout={properties.tone}>{children}</div>,
        },
      ],
    });

    const markup = renderCallout(
      {
        body: standardProps.body,
        properties: { tone: "urgent" },
        renderer: "emphasis",
      },
      renderers,
    );

    expect(markup).toContain('data-custom-callout="urgent"');
    expect(markup).toContain("Audience content stays visible");
  });

  it("reports an unknown Callout renderer and retains standard Audience content", () => {
    const onDiagnostic = vi.fn();
    const markup = renderCallout(
      { body: standardProps.body, renderer: "missing" },
      defineInfoschematicRenderers({ callouts: [], onDiagnostic }),
    );

    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "unknown-key",
        key: "missing",
        kind: "callout",
      }),
    );
    expect(markup).toContain("Audience content stays visible");
    expect(markup).toContain('role="status"');
  });

  it("reports invalid properties and retains standard Audience content", () => {
    const onDiagnostic = vi.fn();
    const renderers = defineInfoschematicRenderers({
      callouts: [
        {
          key: "emphasis",
          schemaVersion: 1,
          validateProperties: () => ({
            valid: false as const,
            reason: "tone must be a string",
          }),
          component: ({ children }: { children: ReactNode }) => (
            <div data-custom-callout>{children}</div>
          ),
        },
      ],
      onDiagnostic,
    });

    const markup = renderCallout(
      {
        body: standardProps.body,
        properties: { tone: 3 },
        renderer: "emphasis",
      },
      renderers,
    );

    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "invalid-properties",
        key: "emphasis",
        kind: "callout",
      }),
    );
    expect(markup).not.toContain("data-custom-callout");
    expect(markup).toContain("Audience content stays visible");
    expect(markup).toMatch(/aria-label="Stop(?: the)? Story"/);
  });
});
