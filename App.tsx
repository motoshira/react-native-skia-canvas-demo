import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { useImage, ImageFormat } from "@shopify/react-native-skia";
import { useCallback, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSaveImageAsync } from "./hooks";
import { useCanvasDimensions } from "./hooks/useCanvasDimensions";
import { useCanvasManager } from "./hooks/useCanvasManager";
import { useDrawingOperations } from "./hooks/useDrawingOperations";
import { useGestureHandling } from "./hooks/useGestureHandling";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { ControlPanel } from "./components/ControlPanel";

export default function App() {
	const sampleImage = useImage(require("./assets/sample.jpg"));
	const { canvasWidth, canvasHeight } = useCanvasDimensions(sampleImage);
	const { canvasRef, drawCanvas, drawImage, onReset } = useCanvasManager(
		canvasWidth,
		canvasHeight,
	);

	const [drawMode, setDrawMode] = useState<"draw" | "erase">("draw");
	const [isSaving, setIsSaving] = useState(false);

	const onToggleDrawMode = useCallback(() => {
		setDrawMode((prev) => (prev === "draw" ? "erase" : "draw"));
	}, []);

	const saveImageAsync = useSaveImageAsync();

	const onSave = useCallback(async () => {
		try {
			setIsSaving(true);
			const image = await canvasRef.current?.makeImageSnapshotAsync();
			if (!image) {
				console.error("Failed to create image snapshot");
				return;
			}
			const base64 = image.encodeToBase64(ImageFormat.JPEG);
			await saveImageAsync(base64);
			console.log("Image has been saved successfully!");
		} catch (e) {
			console.log("onSave error:", e);
		} finally {
			setIsSaving(false);
		}
	}, [saveImageAsync]);

	const { performDrawOperation, startDrawing, endDrawing } = useDrawingOperations(
		drawCanvas,
		drawMode,
	);

	const drawGesture = useGestureHandling({
		onDrawStart: startDrawing,
		onDrawUpdate: performDrawOperation,
		onDrawEnd: endDrawing,
	});

	return (
		<GestureHandlerRootView>
			<SafeAreaView style={styles.container}>
				<StatusBar style="auto" />
				<DrawingCanvas
					canvasRef={canvasRef}
					canvasWidth={canvasWidth}
					canvasHeight={canvasHeight}
					sampleImage={sampleImage}
					drawImage={drawImage}
					drawGesture={drawGesture}
				/>
				<ControlPanel
					drawMode={drawMode}
					isSaving={isSaving}
					onToggleDrawMode={onToggleDrawMode}
					onReset={onReset}
					onSave={onSave}
				/>
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
});
