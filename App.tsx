import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { genPath } from "./utils";
import { DRAW_PEN_SIZE, ERASER_PEN_SIZE } from "./constants";

import { useWindowDimensions } from "react-native";
import {
	BlendMode,
	Canvas,
	Image,
	SkCanvas,
	Skia,
	PaintStyle,
	SkImage,
	SkSurface,
	useImage,
} from "@shopify/react-native-skia";
import {
	runOnUI,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Point } from "./types";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";

export default function App() {
	const sampleImage = useImage(require("./assets/sample.jpg"));
	const windowSize = useWindowDimensions();

	// 縦横比を維持したまま横幅いっぱいまで広げる
	const imageWidth = useMemo(() => sampleImage?.width() ?? 1, [sampleImage]);
	const imageHeight = useMemo(() => sampleImage?.height() ?? 1, [sampleImage]);
	const imageAspectRatio = useMemo(
		() => imageWidth / imageHeight,
		[imageWidth, imageHeight],
	);
	const canvasWidth = useMemo(() => {
		return Math.floor(
			Math.min(windowSize.width, windowSize.height * imageAspectRatio),
		);
	}, [imageWidth, imageHeight, imageAspectRatio, windowSize]);

	const canvasHeight = useMemo(() => {
		return Math.floor(
			Math.min(windowSize.height, canvasWidth / imageAspectRatio),
		);
	}, [canvasWidth, imageAspectRatio, windowSize]);

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

	const [drawMode, setDrawMode] = useState<"draw" | "erase">("draw");
	const drawModeWorklet = useDerivedValue(() => drawMode);

	const onToggleDrawMode = useCallback(() => {
		setDrawMode((prev) => (prev === "draw" ? "erase" : "draw"));
	}, []);

	// last four points
	const points = useSharedValue<Point[]>([]);

	const drawGesture = Gesture.Pan()
		.onBegin((e) => {
			"worklet";
			points.value = [{ x: e.x, y: e.y }];
		})
		.onUpdate((event) => {
			"worklet";
			const x = event.x;
			const y = event.y;
			const paint = Skia.Paint();
			const c = drawCanvas.value;

			if (!c) return;

			points.value.push({ x, y });
			if (points.value.length > 4) {
				points.value.shift();
			}

			const drawMode = drawModeWorklet.value;
			const strokeWidth = drawMode === "draw" ? DRAW_PEN_SIZE : ERASER_PEN_SIZE;

			paint.setStyle(PaintStyle.Fill);
			paint.setColor(Skia.Color("#fff"));
			paint.setBlendMode(
				drawMode === "draw" ? BlendMode.SrcOver : BlendMode.Clear,
			);
			paint.setStrokeWidth(strokeWidth);
			const path = genPath(points.value, strokeWidth);
			c.drawPath(path, paint);
		})
		.onEnd((_) => {
			points.value = [];
		});

	return (
		<GestureHandlerRootView>
			<SafeAreaView style={styles.container}>
				<StatusBar style="auto" />
				<GestureDetector gesture={drawGesture}>
					<Canvas
						style={{
							width: canvasWidth,
							height: canvasHeight,
							backgroundColor: "gray",
						}}
					>
						<Image
							image={sampleImage}
							fit="contain"
							x={0}
							y={0}
							width={canvasWidth}
							height={canvasHeight}
						/>
						<Image
							image={drawImage}
							fit="contain"
							x={0}
							y={0}
							width={canvasWidth}
							height={canvasHeight}
						/>
					</Canvas>
				</GestureDetector>
				<View style={styles.buttonContainer}>
					<Pressable onPress={onToggleDrawMode} style={styles.button}>
						<MaterialDesignIcons
							name={drawMode === "draw" ? "draw" : "eraser"}
							size={30}
							color="#fff"
						/>
						<Text style={styles.buttonText}>
							{drawMode === "draw" ? "Draw" : "Erase"}
						</Text>
					</Pressable>
					<Pressable onPress={onReset} style={styles.button}>
						<MaterialDesignIcons name="broom" size={30} color="#fff" />
						<Text style={styles.buttonText}>Reset</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
	buttonContainer: {
		flexDirection: "row",
		position: "absolute",
		gap: 8,
		bottom: 0,
		padding: 32,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		pointerEvents: "box-none",
	},
	button: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 8,
		alignItems: "center",
		backgroundColor: "#000000",
		padding: 16,
		borderRadius: 8,
	},
	buttonText: {
		color: "#ffffff",
	},
});
