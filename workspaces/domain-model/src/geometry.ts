/** A position in Infoschematic coordinates. */
export type Point = {
	x: number;
	y: number;
};

/** A rectangular extent in Infoschematic coordinates. */
export type Box = Point & {
	height: number;
	width: number;
};
