import { useEffect, useCallback } from "react";
import { useSharedValue, runOnUI } from "react-native-reanimated";
import {
	SkSurface,
	SkCanvas,
	SkImage,
	Skia,
	useCanvasRef,
} from "@shopify/react-native-skia";

export const useCanvasManager = (canvasWidth: number, canvasHeight: number) => {
	const canvasRef = useCanvasRef();
	const drawSurface = useSharedValue<SkSurface | null>(null);
	const drawCanvas = useSharedValue<SkCanvas | undefined>(undefined);
	const drawImage = useSharedValue<SkImage | null>(null);

	const initSurfaceAndCanvas = (width: number, height: number) => {
		"worklet";
		if (drawSurface.value) {
			drawSurface.value.dispose();
		}
		drawSurface.value = Skia.Surface.MakeOffscreen(width, height);
		drawCanvas.value = drawSurface.value?.getCanvas();
	};

	useEffect(() => {
		runOnUI(initSurfaceAndCanvas)(canvasWidth, canvasHeight);
	}, [drawSurface, drawCanvas, canvasWidth, canvasHeight]);

	const applySurfaceToImage = useCallback(() => {
		"worklet";
		const s = drawSurface.value;
		if (!s) return;
		s.flush();
		drawImage.value = s.makeImageSnapshot();
	}, [drawSurface, drawImage]);

	useEffect(() => {
		let isMounted = true;
		function renderLoop() {
			if (!isMounted) return;
			runOnUI(applySurfaceToImage)();
			requestAnimationFrame(renderLoop);
		}
		requestAnimationFrame(renderLoop);
		return () => {
			isMounted = false;
		};
	}, [applySurfaceToImage]);

	const onReset = useCallback(() => {
		"worklet";
		console.log("Resetting canvas");
		drawCanvas.value?.clear(Skia.Color("transparent"));
	}, [drawCanvas]);

	return {
		canvasRef,
		drawCanvas,
		drawImage,
		onReset,
	};
};