import type { Box, Point } from "@infoschematics/core/geometry";
import type { PortCounts, PortId } from "@infoschematics/core/ports";

export type InfoschematicMetadata = {
	id?: string;
	title: string;
	subtitle?: string;
	synopsis?: string;
	takeaways?: readonly string[];
};

export type ScopeConfig = {
	id: string;
	prefix: string;
	label: string;
	description: string;
	color: string;
	fill: string;
	icon?: string;
};

export type FlowFamilyConfig = {
	id: string;
	prefix: string;
	label: string;
	description: string;
	color: string;
};

export type ZoneConfig = {
	id: string;
	label: string;
	x: number;
	width: number;
	fill: string;
};

export type LaneConfig = {
	id: string;
	label: string;
	y: number;
	height: number;
	labelY: number;
	legend?: "top" | "bottom";
	panel: Box & { radius: number };
	zones: readonly ZoneConfig[];
};

export type InterfaceConfig = {
	id: string;
	prefix: string;
	owner: string;
	document: "none" | "ours" | "theirs";
	contract?: string;
	href?: string;
	label: string;
	description: string;
	operations?: readonly { id: string; summary: string }[];
};

export type SpecificationGroupConfig = {
	id: string;
	label: string;
	note: string;
	owner: string;
	document: InterfaceConfig["document"];
};

export type ArtefactIdentity = {
	id: string;
	code: string;
	label: string;
	detail: string;
	scopes: readonly string[];
	scopeRule?: "all" | "any";
	conformsTo?: readonly string[];
	services?: readonly string[];
};

export type CardConfig = ArtefactIdentity & {
	scope: string;
	wraps?: string;
	placement: { box: Box; ports?: PortCounts };
};

export type FabricConfig = ArtefactIdentity & {
	scope: string;
	placement: { box: Box; ports?: PortCounts };
	appearance?: {
		renderer: string;
		caption?: string;
		detail?: string;
		properties?: Readonly<Record<string, boolean | number | string>>;
	};
};

export type PointConfig = {
	id: string;
	code: string;
	label: string;
	scopes: readonly string[];
	point: Point;
  ports?: PortCounts;
};

export type GraphicConfig = {
  id: string;
  label?: string;
  renderer: string;
  placement?: Box;
  scopes?: readonly string[];
  properties?: Readonly<Record<string, boolean | number | string>>;
};

export type FlowConfig = {
	id: string;
	code: string;
	family: string;
	source: string;
	target: string;
	sourcePort: PortId;
	targetPort: PortId;
	operation?: string;
	conformsTo?: readonly string[];
	over?: string;
	bidirectional?: boolean;
	dashed?: boolean;
	label?: { along: number };
	points: readonly Point[];
};

export type FocusConfig = {
	artefacts?: readonly string[];
	flows?: readonly string[];
	graphics?: readonly string[];
};

export type StandaloneSceneConfig = {
	id: string;
	code: string;
	label: string;
	short?: string;
	description: string;
	focus: FocusConfig;
};

export type CalloutConfig = {
	title?: string;
	body: string;
	takeaways?: readonly string[];
	at?: Point;
	renderer?: string;
	properties?: Readonly<Record<string, boolean | number | string>>;
};

export type ThematicSceneConfig = {
	id: string;
	code: string;
	label: string;
	short?: string;
	description?: string;
	focus: FocusConfig;
	callout?: CalloutConfig;
};

export type ThemeConfig = {
	id: string;
	title: string;
	description?: string;
	scenes: readonly ThematicSceneConfig[];
};

export type StorySceneConfig = {
  id?: string;
  sourceScene?: string;
  title?: string;
  focus?: FocusConfig;
  anchor?: string;
  callout?: CalloutConfig;
	graphic?: string;
	duration?: number;
};

export type StoryConfig = {
	id: string;
	code: string;
	title: string;
	short?: string;
	question?: string;
	scenes: readonly StorySceneConfig[];
};

export type InfoschematicDefinition = {
	viewBox: Box;
	scopes: readonly ScopeConfig[];
	flowFamilies: readonly FlowFamilyConfig[];
	lanes: readonly LaneConfig[];
	cards: readonly CardConfig[];
	fabrics: readonly FabricConfig[];
  points: readonly PointConfig[];
  flows: readonly FlowConfig[];
  graphics: readonly GraphicConfig[];
  interfaces: readonly InterfaceConfig[];
	specificationGroups: readonly SpecificationGroupConfig[];
};

export type InfoschematicConfig = InfoschematicMetadata & {
	infoschematic: InfoschematicDefinition;
	standaloneScenes: readonly StandaloneSceneConfig[];
	themes: readonly ThemeConfig[];
	stories: readonly StoryConfig[];
	calloutPositions: readonly Point[];
};

export type InfoschematicConfigInput = InfoschematicMetadata & {
	infoschematic?: Partial<InfoschematicDefinition>;
	standaloneScenes?: readonly StandaloneSceneConfig[];
	themes?: readonly ThemeConfig[];
	stories?: readonly StoryConfig[];
	calloutPositions?: readonly Point[];
};

const defaultViewBox: Box = { x: 0, y: 0, width: 1200, height: 800 };

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
