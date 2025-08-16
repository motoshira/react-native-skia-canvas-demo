import { useCallback } from "react";
import {
	requestPermissionsAsync,
	createAssetAsync,
	getAlbumAsync,
	createAlbumAsync,
	addAssetsToAlbumAsync,
} from "expo-media-library";
import { writeAsStringAsync, cacheDirectory } from "expo-file-system";

const ALBUM_NAME = "react-native-canvas-demo";

export const useSaveImageAsync = () => {
	return useCallback(async (contentsBase64: string): Promise<void> => {
		const { status } = await requestPermissionsAsync();
		if (status !== "granted") {
			throw new Error("Permission to access media library was denied");
		}
		// createAssetAsyncにはfile URIが必要なので一旦一時ファイルとして保存する
		const tempImageUri = `${cacheDirectory}temp_image.jpg`;
		await writeAsStringAsync(tempImageUri, contentsBase64, {
			encoding: "base64",
		});
		const asset = await createAssetAsync(tempImageUri);
		let album = await getAlbumAsync(ALBUM_NAME);
		if (!album) {
			album = await createAlbumAsync(ALBUM_NAME, asset);
		} else {
			await addAssetsToAlbumAsync([asset], album, false);
		}
	}, []);
};
