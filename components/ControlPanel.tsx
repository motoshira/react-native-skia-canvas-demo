import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";

interface Props {
	drawMode: "draw" | "erase";
	isSaving: boolean;
	onToggleDrawMode: () => void;
	onReset: () => void;
	onSave: () => void;
}

export const ControlPanel: React.FC<Props> = ({
	drawMode,
	isSaving,
	onToggleDrawMode,
	onReset,
	onSave,
}) => {
	return (
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
			<Pressable disabled={isSaving} onPress={onSave} style={styles.button}>
				<MaterialDesignIcons name="content-save" size={30} color="#fff" />
				<Text style={styles.buttonText}>Save</Text>
			</Pressable>
		</View>
	);
};

const styles = StyleSheet.create({
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