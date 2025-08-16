import { useCallback } from "react";
import {
	BlendMode,
	PaintStyle,
	Skia,
	SkCanvas,
} from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import { Point } from "../types";
import { genPath } from "../utils";
import { DRAW_PEN_SIZE, ERASER_PEN_SIZE } from "../constants";

export const useDrawingOperations = (drawCanvas: any, drawMode: "draw" | "erase") => {
	const points = useSharedValue<Point[]>([]);

	const performDrawOperation = useCallback((x: number, y: number) => {
		"worklet";
		const paint = Skia.Paint();
		const c = drawCanvas.value;

		if (!c) return;

		points.value.push({ x, y });
		if (points.value.length > 4) {
			points.value.shift();
		}

		const strokeWidth = drawMode === "draw" ? DRAW_PEN_SIZE : ERASER_PEN_SIZE;

		paint.setStyle(PaintStyle.Fill);
		paint.setColor(Skia.Color("#fff"));
		paint.setBlendMode(
			drawMode === "draw" ? BlendMode.SrcOver : BlendMode.Clear,
		);
		paint.setStrokeWidth(strokeWidth);
		const path = genPath(points.value, strokeWidth);
		c.drawPath(path, paint);
	}, [drawCanvas, drawMode, points]);

	const startDrawing = useCallback((x: number, y: number) => {
		"worklet";
		points.value = [{ x, y }];
	}, [points]);

	const endDrawing = useCallback(() => {
		"worklet";
		points.value = [];
	}, [points]);

	return {
		performDrawOperation,
		startDrawing,
		endDrawing,
	};
};