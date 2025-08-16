import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { SkImage } from "@shopify/react-native-skia";

export const useCanvasDimensions = (sampleImage: SkImage | null) => {
	const windowSize = useWindowDimensions();

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

	return {
		canvasWidth,
		canvasHeight,
		imageAspectRatio,
	};
};