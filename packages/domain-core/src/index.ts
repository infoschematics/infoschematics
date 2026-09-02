import type {
	InfoschematicConfig,
	InfoschematicConfigInput,
} from "@infoschematics/domain-model";

const defaultViewBox = { x: 0, y: 0, width: 1200, height: 800 } as const;

/** Normalise a partial authored definition into a complete Infoschematic. */
export const defineInfoschematic = (
	input: InfoschematicConfigInput,
): InfoschematicConfig => ({
	...input,
	infoschematic: {
		viewBox: input.infoschematic?.viewBox ?? defaultViewBox,
		scopes: input.infoschematic?.scopes ?? [],
		flowFamilies: input.infoschematic?.flowFamilies ?? [],
		lanes: input.infoschematic?.lanes ?? [],
		cards: input.infoschematic?.cards ?? [],
		fabrics: input.infoschematic?.fabrics ?? [],
		points: input.infoschematic?.points ?? [],
		flows: input.infoschematic?.flows ?? [],
		graphics: input.infoschematic?.graphics ?? [],
		interfaces: input.infoschematic?.interfaces ?? [],
		specificationGroups: input.infoschematic?.specificationGroups ?? [],
	},
	standaloneScenes: input.standaloneScenes ?? [],
	themes: input.themes ?? [],
	stories: input.stories ?? [],
	calloutPositions: input.calloutPositions ?? [],
});
