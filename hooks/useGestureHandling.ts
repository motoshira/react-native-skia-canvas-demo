import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";

interface Props {
	onDrawStart: (x: number, y: number) => void;
	onDrawUpdate: (x: number, y: number) => void;
	onDrawEnd: () => void;
}

export const useGestureHandling = ({
	onDrawStart,
	onDrawUpdate,
	onDrawEnd,
}: Props) => {
	const drawGesture = useMemo(
		() =>
			Gesture.Pan()
				.onBegin((e) => {
					"worklet";
					onDrawStart(e.x, e.y);
				})
				.onUpdate((event) => {
					"worklet";
					onDrawUpdate(event.x, event.y);
				})
				.onEnd((_) => {
					"worklet";
					onDrawEnd();
				}),
		[onDrawStart, onDrawUpdate, onDrawEnd],
	);

	return drawGesture;
};