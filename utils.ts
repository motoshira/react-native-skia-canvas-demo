import { Point } from "./types";
import { Skia } from "@shopify/react-native-skia";

export const genPath = (points: Point[], strokeWidth: number) => {
	"worklet";
	// supposed that 2 <= points.length  <= 4;
	if (points.length < 2) {
		throw new Error("invalid point amount");
	}
	const [p1, p2, p3, p4] = (() => {
		switch (points.length) {
			case 2:
				return [points[0], points[0], points[0], points[1]];
			case 3:
				return [points[0], points[0], points[1], points[2]];
			default:
				return [points[0], points[1], points[2], points[3]];
		}
	})();
	// draw bezier curve for p2 -> p3

	// control
	const c1 = {
		x: p2.x + (p3.x - p1.x) / 6,
		y: p2.y + (p3.y - p1.y) / 6,
	};
	const c2 = {
		x: p3.x - (p4.x - p2.x) / 6,
		y: p3.y - (p4.y - p2.y) / 6,
	};

	const path = Skia.Path.Make();
	path.moveTo(p2.x, p2.y);
	path.cubicTo(c1.x, c1.y, c2.x, c2.y, p3.x, p3.y);
	path.stroke({
		width: strokeWidth,
	});

	return path;
};
