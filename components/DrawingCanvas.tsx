import React from "react";
import {
	Canvas,
	Image,
	SkImage,
	CanvasRef,
} from "@shopify/react-native-skia";
import { GestureDetector } from "react-native-gesture-handler";
import { SharedValue } from "react-native-reanimated";

interface Props {
	canvasRef: React.RefObject<CanvasRef | null>;
	canvasWidth: number;
	canvasHeight: number;
	sampleImage: SkImage | null;
	drawImage: SharedValue<SkImage | null>;
	drawGesture: any;
}

export const DrawingCanvas: React.FC<Props> = ({
	canvasRef,
	canvasWidth,
	canvasHeight,
	sampleImage,
	drawImage,
	drawGesture,
}) => {
	return (
		<GestureDetector gesture={drawGesture}>
			<Canvas
				ref={canvasRef}
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
	);
};