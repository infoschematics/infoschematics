import { useLayoutEffect, useRef, useState } from "react";
import type { Box } from "@infoschematics/view-model/geometry";
import {
  chooseSpot,
  type Obstacle,
} from "@infoschematics/view-model/placement";
import type { InfoschematicRuntime } from "@infoschematics/view-model/runtime";

export type LitScene = Readonly<{
  callout?: Readonly<{ x: number; y: number }>;
  components: readonly string[];
  flows: readonly string[];
}>;

const grown = (box: Box, by: number, weight: number): Obstacle => ({
  height: box.height + by * 2,
  weight,
  width: box.width + by * 2,
  x: box.x - by,
  y: box.y - by,
});

export const litObstacles = (
  scene: LitScene,
  runtime: InfoschematicRuntime,
): Obstacle[] => {
  const flowById = new Map(
    runtime.infoschematicFlows.map((flow) => [flow.id, flow]),
  );
  const fabricById = new Map(
    runtime.infoschematicFabrics.map((fabric) => [fabric.id, fabric]),
  );
  const obstacles: Obstacle[] = [];

  for (const id of scene.components) {
    const card = runtime.infoschematicLayout[id];
    if (card) {
      obstacles.push(grown(card, 12, 6));
      continue;
    }
    const fabric = fabricById.get(id);
    if (fabric) obstacles.push(grown(fabric.bounds, 12, 6));
  }

  for (const id of scene.flows) {
    const points = flowById.get(id)?.points;
    if (!points) continue;
    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      if (!from || !to) continue;
      obstacles.push(
        grown(
          {
            height: Math.abs(to.y - from.y),
            width: Math.abs(to.x - from.x),
            x: Math.min(from.x, to.x),
            y: Math.min(from.y, to.y),
          },
          4,
          1,
        ),
      );
    }
  }

  return obstacles;
};

export function SceneCallout({
  autoAdvance,
  body,
  eyebrow,
  logo,
  onExit,
  onStep,
  onToggleAuto,
  profile,
  runtime,
  scene,
  stepNumber,
  stepTotal,
  takeaways,
  title,
  wide,
}: {
  autoAdvance?: boolean;
  body: string;
  eyebrow: string;
  logo?: string;
  onExit: () => void;
  onStep: (delta: number) => void;
  onToggleAuto?: () => void;
  profile?: readonly string[];
  runtime: InfoschematicRuntime;
  scene: LitScene;
  stepNumber: number;
  stepTotal: number;
  takeaways?: readonly string[];
  title?: string;
  wide?: boolean;
}) {
  const callout = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(
    scene.callout ?? runtime.calloutPorts[0] ?? { x: 0.5, y: 0.5 },
  );
  const aside = Boolean(logo || profile?.length);

  useLayoutEffect(() => {
    const element = callout.current;
    const container = element?.parentElement?.parentElement;
    if (!element || !container) return;

    const choose = () => {
      if (scene.callout) {
        setPosition(scene.callout);
        return;
      }
      const unitsPerPixel =
        runtime.infoschematicViewBox.width / container.clientWidth;
      const candidates =
        runtime.calloutPorts.length > 0
          ? runtime.calloutPorts
          : [{ x: 0.5, y: 0.5 }];
      setPosition(
        chooseSpot({
          candidates,
          label: {
            height: element.offsetHeight * unitsPerPixel,
            width: element.offsetWidth * unitsPerPixel,
          },
          obstacles: litObstacles(scene, runtime),
          view: runtime.infoschematicViewBox,
        }),
      );
    };

    choose();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(choose);
    observer.observe(container);
    return () => observer.disconnect();
  }, [runtime, scene]);

  return (
    <div className="isp-callout-layer" aria-live="polite">
      <div
        className={`isp-callout${wide ? " isp-callout-wide" : ""}${aside ? " isp-callout-sided" : ""}`}
        ref={callout}
        role="status"
        style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
      >
        <p className="isp-callout-heading">
          <span>{eyebrow}</span>
          <em>
            {stepNumber} of {stepTotal}
          </em>
        </p>
        <div className={aside ? "isp-callout-sides" : undefined}>
          {aside ? (
            <div className="isp-callout-aside">
              {logo ? <img alt="" src={logo} /> : null}
              {profile?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}
          <div>
            {title ? <p className="isp-callout-title">{title}</p> : null}
            <p className="isp-callout-body">{body}</p>
            {takeaways?.length ? (
              <ul className="isp-callout-takeaways">
                {takeaways.map((takeaway) => (
                  <li key={takeaway}>{takeaway}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="isp-callout-actions">
          <button
            aria-label="Previous step"
            onClick={() => onStep(-1)}
            title="Previous step · left arrow"
            type="button"
          >
            ‹
          </button>
          {autoAdvance === undefined || !onToggleAuto ? null : (
            <button
              aria-label={
                autoAdvance
                  ? "Advancing automatically. Activate to hold."
                  : "Held. Activate to advance automatically."
              }
              aria-pressed={autoAdvance}
              onClick={onToggleAuto}
              title={
                autoAdvance
                  ? "Advancing automatically · space to hold"
                  : "Held · space to resume"
              }
              type="button"
            >
              {autoAdvance ? "◷" : "Ⅱ"}
            </button>
          )}
          <button
            aria-label="Next step"
            onClick={() => onStep(1)}
            title="Next step · right arrow"
            type="button"
          >
            ›
          </button>
          <button
            aria-label="Stop the Story"
            onClick={onExit}
            title="Stop · escape"
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
