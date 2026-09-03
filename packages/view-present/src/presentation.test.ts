import { describe, expect, it } from "vitest";
import { defineInfoschematic } from "@infoschematics/domain-core";
import { createInfoschematicRuntime } from "@infoschematics/view-model/runtime";
import {
  createPresentationState,
  derivePresentation,
  reducePresentation,
} from "./presentation.ts";

const runtime = () =>
  createInfoschematicRuntime(
    defineInfoschematic({
      title: "Presentation state",
      infoschematic: {
        scopes: [
          {
            id: "one",
            prefix: "ONE",
            label: "One",
            description: "First scope",
            color: "#1199ff",
            fill: "#113355",
          },
          {
            id: "two",
            prefix: "TWO",
            label: "Two",
            description: "Second scope",
            color: "#ff9911",
            fill: "#553311",
          },
        ],
        flowFamilies: [
          {
            id: "delivery",
            prefix: "DEL",
            label: "Delivery",
            description: "Delivery flow",
            color: "#44cc88",
          },
        ],
        cards: [
          {
            id: "source",
            code: "ONE-001",
            detail: "Sends work",
            label: "Source",
            scope: "one",
            scopes: ["one"],
            placement: {
              box: { x: 100, y: 100, width: 160, height: 80 },
              ports: { east: 1 },
            },
          },
          {
            id: "target",
            code: "TWO-001",
            detail: "Receives work",
            label: "Target",
            scope: "two",
            scopes: ["two"],
            placement: {
              box: { x: 500, y: 100, width: 160, height: 80 },
              ports: { west: 1 },
            },
          },
        ],
        flows: [
          {
            id: "delivery-flow",
            code: "DEL-001",
            family: "delivery",
            source: "source",
            sourcePort: "E1",
            target: "target",
            targetPort: "W1",
            points: [
              { x: 260, y: 140 },
              { x: 500, y: 140 },
            ],
          },
        ],
      },
      standaloneScenes: [
        {
          id: "scene",
          code: "SCENE-001",
          label: "Standalone",
          description: "A standalone focus",
          focus: { artefacts: ["source"], flows: ["delivery-flow"] },
        },
      ],
      themes: [
        {
          id: "theme",
          title: "Theme",
          scenes: [
            {
              id: "theme-scene",
              code: "THEME-001",
              label: "Theme focus",
              focus: { artefacts: ["target"] },
              callout: { body: "A thematic focus" },
            },
          ],
        },
      ],
      stories: [
        {
          id: "story",
          code: "STORY-001",
          title: "Journey",
          scenes: [
            {
              focus: { artefacts: ["source"] },
              callout: { body: "First" },
              duration: 1000,
            },
            {
              focus: { artefacts: ["target"] },
              callout: { body: "Second" },
              duration: 1000,
            },
          ],
        },
      ],
    }),
  );

describe("presentation state", () => {
  it("filters Cards and their Flows through audience visibility", () => {
    const source = runtime();
    const initial = createPresentationState(source);
    const hidden = reducePresentation(initial, {
      type: "toggle-scope",
      id: "two",
    });
    const shown = derivePresentation(source, hidden);

    expect(shown.visibleCards.map((card) => card.id)).toEqual(["source"]);
    expect(shown.visibleFlows).toEqual([]);
  });

  it("makes Story, Theme and standalone Scene focus mutually exclusive", () => {
    const source = runtime();
    const standalone = reducePresentation(createPresentationState(source), {
      type: "toggle-standalone-scene",
      scene: source.standaloneScenes[0]!,
    });
    const themed = reducePresentation(standalone, {
      type: "toggle-theme-scene",
      scene: source.thematicScenes[0]!,
    });
    const playing = reducePresentation(themed, {
      type: "start-story",
      story: source.stories[0]!,
    });

    expect(themed).toMatchObject({
      playing: null,
      standaloneSceneId: null,
      thematicSceneId: "theme-scene",
    });
    expect(playing).toMatchObject({
      playing: { id: "story", step: 0 },
      standaloneSceneId: null,
      thematicSceneId: null,
    });
  });

  it("wraps Story playback in both directions", () => {
    const source = runtime();
    const playing = reducePresentation(createPresentationState(source), {
      type: "start-story",
      story: source.stories[0]!,
    });
    const previous = reducePresentation(playing, {
      type: "step-story",
      stories: source.stories,
      delta: -1,
    });
    const next = reducePresentation(previous, {
      type: "step-story",
      stories: source.stories,
      delta: 1,
    });

    expect(previous.playing?.step).toBe(1);
    expect(next.playing?.step).toBe(0);
  });
});
