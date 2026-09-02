import { describe, expect, it } from "vitest";
import { defineInfoschematic } from "@infoschematics/domain-core";

describe("defineInfoschematic", () => {
	it("normalises a title-only definition", () => {
		expect(defineInfoschematic({ title: "Infoschematics" })).toEqual({
			title: "Infoschematics",
			infoschematic: {
				viewBox: { x: 0, y: 0, width: 1200, height: 800 },
				scopes: [],
				flowFamilies: [],
				lanes: [],
				cards: [],
				fabrics: [],
				points: [],
				flows: [],
				graphics: [],
				interfaces: [],
				specificationGroups: [],
			},
			standaloneScenes: [],
			themes: [],
			stories: [],
			calloutPositions: [],
		});
	});
});
