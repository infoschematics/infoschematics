import { describe, expect, it } from "vitest";
import { blankInfoschematic } from "./index.ts";

describe("blankInfoschematic", () => {
  it("contains only the default blank canvas and its title", () => {
    expect(blankInfoschematic.title).toBe("Infoschematics");
    expect(blankInfoschematic.infoschematic.scopes).toEqual([]);
    expect(blankInfoschematic.infoschematic.flowFamilies).toEqual([]);
    expect(blankInfoschematic.infoschematic.regions).toEqual([]);
    expect(blankInfoschematic.infoschematic.cards).toEqual([]);
    expect(blankInfoschematic.infoschematic.fabrics).toEqual([]);
    expect(blankInfoschematic.infoschematic.points).toEqual([]);
    expect(blankInfoschematic.infoschematic.flows).toEqual([]);
    expect(blankInfoschematic.infoschematic.graphics).toEqual([]);
    expect(blankInfoschematic.infoschematic.interfaces).toEqual([]);
    expect(blankInfoschematic.infoschematic.specificationGroups).toEqual([]);
    expect(blankInfoschematic.standaloneScenes).toEqual([]);
    expect(blankInfoschematic.themes).toEqual([]);
    expect(blankInfoschematic.stories).toEqual([]);
    expect(blankInfoschematic.calloutPositions).toEqual([]);
  });
});
