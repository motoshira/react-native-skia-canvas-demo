# 概要

React Native Skia ([Shopify/react-native-skia](https://github.com/Shopify/react-native-skia))
Skiaの機能を利用することで、画像編集 (ラスターペイント) を提供することができます。
この記事では実際にデモアプリを通して以下の機能を実装します。
- 画像の表示
- ペイント

原理としてはほぼCanvas 2Dと同じですが、ネット上に実装例があまりなく、参考となる情報を増やすために・より良い実装方法についてのコメントの機会を得るために本記事を作成しました。

# 対象読者

- React Native でラスター編集機能を利用したアプリを作ってみたい人

※他の2Dグラフィックライブラリとの比較は扱いません。
※本記事の実装の一部でClaude Codeを使用しています。

# デモアプリ

TODO キャプチャ

[リポジトリ](https://github.com/motoshira/react-native-skia-canvas-demo)

## 0. プロジェクトのセットアップ

今回は簡単のため、Expo (Managed Workflow) を利用します。
Android/iOS実機での動作を前提とします。事前にセットアップを行っておいてください。

```
npx create-expo-app@latest [プロジェクト名] --template blank-typescript
```

プロジェクトのディレクトリに移動し、初期状態で動作することを確認します。
```
npm install
npm run android
```
今回必要となるライブラリもインストールしておきます。

```
npx expo install @shopify/react-native-skia react-native-gesture-handler react-native-reanimated expo-file-system expo-media-library @react-native-vector-icons/material-design-icons
```

## 1. 画像を表示させる

選択した画像を表示させます。
まずはシンプルにCanvas以下にImageを表示します。

```tsx
import { useImage } from "@shopify/react-native-skia";
import { Canvas, Image } from "@shopify/react-native-skia";

export default function App() {
  const sampleImage = useImage(require("./assets/sample.jpg"));
  const canvasWidth = 300;
  const canvasHeight = 400;

  return (
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
    </Canvas>
  );
}
```

以下のように写真が中央に表示されます。

TODO キャプチャ 写真が中央に見える

## 2. ペイントできるようにする

Skiaでペイント内容をリアルタイム表示させるために、以下の段階を踏んで内容を表示させます。
[Skia公式の参考実装](https://shopify.github.io/react-native-skia/docs/animations/textures/#under-the-hood) をベースにしています。

### 1. オフスクリーンレンダー用surface/canvasを用意する

手書き内容を保持する surface を用意します。
surfaceから取得した canvas(SkCanvas) に対してペイント操作を実行します。
これらは毎回生成するとコストがかかるので SharedValue として保持しておきます。

```tsx
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

  return {
    canvasRef,
    drawCanvas,
    drawImage,
  };
};
```

### 2. textureに対して描画命令を発行する

ジェスチャーでの操作では、1で作成したcanvasに対して描画命令を発行します。
一連の処理をUIスレッドで実行することに注意します。

```tsx
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
import { DRAW_PEN_SIZE } from "../constants";

export const useDrawingOperations = (drawCanvas: any) => {
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

    paint.setStyle(PaintStyle.Fill);
    paint.setColor(Skia.Color("#fff"));
    paint.setBlendMode(BlendMode.SrcOver);
    paint.setStrokeWidth(DRAW_PEN_SIZE);
    const path = genPath(points.value, DRAW_PEN_SIZE);
    c.drawPath(path, paint);
  }, [drawCanvas, points]);

  return {
    performDrawOperation,
  };
};
```

`genPath` 関数では、直近の4点を利用して [Catmull–Rom Spline補間](https://zenn.dev/mushe/articles/92c65e0c8023aa) を適用します。 (詳しくはリポジトリの実装を確認ください)

### 3. txxtureの内容からsnapshotを作成し、表示用imageとしてセットする

以下のような関数を定義し、renderLoopとして毎フレーム実行します。
こちらも、canvasに関する処理をUIスレッドで実行することに注意します。

```tsx
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
```

## 3. リセットできるようにする

手書きした内容をリセットできるようにします。
これはレイヤーの内容をクリアするだけなので比較的簡単です。

```tsx
const onReset = useCallback(() => {
  "worklet";
  console.log("Resetting canvas");
  drawCanvas.value?.clear(Skia.Color("transparent"));
}, [drawCanvas]);
```

# 4. 部分的に消せるようにする (消しゴムツール)

描画レイヤーを、既存の線を消すような形で上書きします。
これには BlendMode.Clear を使用します。

drawモード・eraseモードを用意して切り替えられるようにします。

```tsx
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
```

## 5. 端末に内容を保存する

Skiaの表示内容はCanvasRefの `makeImageSnapshotAsync` で取得することができます。
これを expo-media-library を利用して端末に保存します。
詳しくはリポジトリのコードを確認ください。

```tsx
const onSave = useCallback(async () => {
  try {
    setIsSaving(true);
    const image = await canvasRef.current?.makeImageSnapshotAsync();
    if (!image) {
      console.error("Failed to create image snapshot");
      return;
    }
    const base64 = image.encodeToBase64(ImageFormat.JPEG);
    // 端末に画像データを保存
    await saveImageAsync(base64);
    console.log("Image has been saved successfully!");
  } catch (e) {
    console.log("onSave error:", e);
  } finally {
    setIsSaving(false);
  }
}, [saveImageAsync]);
```

# TODO

本記事の内容をベースに、今後発展編として書けたらいいなと思っている内容です。

- 手書き操作の実現 (ペン先の動きに慣性を適用する、ペンの軌跡を先読みして描画するetc)
- 編集領域のピンチイン/ピンチアウト
- レイヤー機能
- undo/redo

# 参考記事

[create-expo-app - Expo Documentation](https://docs.expo.dev/more/create-expo/)
[Local app development - Expo Documentation](https://docs.expo.dev/guides/local-app-development/)
[Gestures | React Native Skia](https://shopify.github.io/react-native-skia/docs/animations/gestures/)
