import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { useWindowDimensions } from "react-native";
import { Canvas, Image, useImage } from "@shopify/react-native-skia";

export default function App() {
	const sampleImage = useImage(require("./assets/sample.jpg"));
	const { width, height } = useWindowDimensions();

	return (
		<View style={styles.container}>
			<Canvas style={{ flex: 1 }}>
				<Image
					image={sampleImage}
					fit="contain"
					x={0}
					y={0}
					width={width}
					height={height}
				/>
			</Canvas>
			<StatusBar style="auto" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "stretch",
		justifyContent: "center",
	},
});
