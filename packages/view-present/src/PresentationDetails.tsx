import { useState } from "react";
import type { InfoschematicRuntime } from "@infoschematics/view-model/runtime";
import type { Presentation } from "./use-presentation.ts";

export function PresentationDetails({
  presentation,
  runtime,
}: {
  presentation: Presentation;
  runtime: InfoschematicRuntime;
}) {
  const [tab, setTab] = useState<"info" | "specifications">("info");
  const { derived } = presentation;
  const focus =
    derived.runningStory?.question ??
    derived.thematicScene?.description ??
    derived.standaloneScene?.description;

  return (
    <aside className="isp-details" aria-label="Presentation details">
      <div className="isp-tabs" role="tablist" aria-label="Details">
        {(["info", "specifications"] as const).map((id) => (
          <button
            aria-selected={tab === id}
            key={id}
            onClick={() => setTab(id)}
            role="tab"
            type="button"
          >
            {id === "info" ? "Info" : "Specifications"}
          </button>
        ))}
      </div>
      {tab === "info" ? (
        <div className="isp-details-body">
          <p className={focus ? undefined : "isp-muted"}>
            {focus ??
              "Nothing is in focus. Choose a Scene or Theme, or run a Story."}
          </p>
          <dl className="isp-register">
            {runtime.infoschematicRegister.all.map((entry) => (
              <div key={entry.id}>
                <dt>{entry.code}</dt>
                <dd>
                  <strong>{entry.label}</strong>
                  {entry.detail ? <span>{entry.detail}</span> : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="isp-details-body">
          <p className="isp-muted">
            What this Infoschematic conforms to, grouped by the owning
            specification set.
          </p>
          {runtime.infoschematicSpecificationSections.map(
            ({ group, within }) => (
              <section className="isp-specification-group" key={group.id}>
                <h2>{group.label}</h2>
                <ul>
                  {within.map((entry) => (
                    <li key={entry.id}>
                      {entry.href ? (
                        <a href={entry.href}>{entry.label}</a>
                      ) : (
                        <span>{entry.label}</span>
                      )}
                      <small>{entry.description}</small>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </aside>
  );
}
