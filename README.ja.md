# Local Video Compressor

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-video-compressor/)

[English README](README.md)

動画をアップロードせず、ブラウザ内だけで **H.264 / AAC の MP4** へ圧縮する単一HTMLアプリです。FFmpegエンジンは [`htmlapps-ffmpeg-wasm-builder`](https://github.com/ttomohisa/htmlapps-ffmpeg-wasm-builder) が生成する、SharedArrayBuffer不要のFFmpeg 9 compact WebAssemblyを使用します。

![アプリ画面](docs/preview.png)

## 🚀 デモ

[GitHub PagesでLocal Video Compressorを開く](https://ttomohisa.github.io/htmlapps-video-compressor/)

> **CSPについて:** WebAssembly実行用に `script-src` へ限定的な `'wasm-unsafe-eval'` を指定しています。JavaScriptの `eval()` を許可する `'unsafe-eval'` は使わず、`connect-src 'none'` で実行時通信を遮断します。

## 主な機能

- H.264 / AAC / MP4へ固定出力し、再生互換性を優先
- 解像度変更（縦横比維持・アップスケールなし）
- 映像ビットレート変更と動画ごとのおすすめ値
- 出力フレームレート、x264圧縮速度、音声ビットレート
- オーディオ削除
- 動画の長さと設定から圧縮後サイズを概算
- 圧縮中の進捗、ログ、キャンセル
- 圧縮後のプレビュー・保存・共有
- 日本語 / English
- 実行時通信なし。動画はブラウザのメモリ内だけで処理
- PC / スマートフォン向けレスポンシブUI

## FFmpeg WASMの取り込み方

このリポジトリには巨大なWASMを直接コミットしません。`dependencies.json` に使用する **FFmpeg WASM Builderのバージョンを1か所だけ**固定し、ビルド時にGitHub Releaseから取得します。

現在の固定バージョン:

```json
"version": "1.0.0"
```

`build-standalone.bat` は次の順で処理します。

1. `htmlapps-ffmpeg-wasm-builder` の対応Releaseから `SHA256SUMS.txt` を取得
2. `ffmpeg-wasm-video-compressor-vX.Y.Z.zip` を取得
3. Release記載のSHA-256と一致することを検証
4. `ffmpeg.js` と `ffmpeg.wasm` をBase64でHTMLへ内包
5. `dist/index.html` と自己解凍版を生成・検証
6. Browser Kitty等から直接利用しやすいよう、通常版をルートの `video-compressor.html` にもコピー

ブラウザ実行時にはGitHub Releaseへアクセスしません。

## ビルド

Windowsで次を実行します。

```text
build-standalone.bat
```

初回は固定Releaseをダウンロードします。2回目以降は検証済みキャッシュを再利用します。

生成物:

```text
dist/
├─ index.html
├─ index.self-extract.html
├─ dependency-manifest.json
├─ self-extract-manifest.json
└─ .nojekyll

video-compressor.html   # dist/index.html と同内容
```

通常版だけ生成する場合:

```powershell
.\build-standalone.ps1 -SkipSelfExtract
```

キャッシュを使わず再取得する場合:

```powershell
.\build-standalone.ps1 -ForceDownload
```

## FFmpegを更新する

Builder側で新しいReleaseが出たら、たとえば `v1.0.1` へ更新する場合は次だけです。

```text
update-ffmpeg.bat 1.0.1
```

`dependencies.json` のバージョンを更新し、新しいReleaseの取得・SHA-256検証・単一HTML再ビルドまで実行します。FFmpeg更新後は必ず生成HTMLで実動画の圧縮確認も行ってください。

## 使い方

1. 動画をドロップまたは選択します。
2. 自動提案された解像度とビットレートを確認します。
3. 必要ならfps、圧縮速度、音声設定を調整します。
4. 「この設定で圧縮」を押します。
5. H.264 / AACのMP4として生成された結果をプレビューし、「保存」または「共有」を押します。

出力コーデックは選択式ではなくH.264 / MP4に固定しています。旧版にあったH.265 / VP9出力とメタデータ保持オプションは、compact runnerへの移行に伴い削除しました。

## プライバシーとオフライン設計

- CSPの `connect-src 'none'` で実行時通信を禁止
- 外部CDN、解析、広告、外部フォントなし
- 選択動画と圧縮結果を永続保存しない
- `ffmpeg.js` と `ffmpeg.wasm` を単一HTMLへ内包
- FFmpeg処理は専用Workerで実行
- WASMバイトを `instantiateWasm` へ直接渡し、`file://` でもWASMのURL解決を不要にする
- Workerソースも1つのBlobへまとめ、ネストした `importScripts()` を使わない
- SharedArrayBuffer / COOP / COEPは不要

詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) と [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md) を参照してください。

## 開発

主なファイル:

- `dependencies.json`: FFmpeg WASM Builderの固定バージョンとRelease asset定義
- `src/index.template.html`: UIとアプリ本体
- `build-standalone.ps1`: Release取得、checksum検証、単一HTML生成
- `update-ffmpeg.bat`: Builderバージョン更新用
- `scripts/check-repository.ps1`: ソース確認からビルド検証までを実行
- `THIRD_PARTY_NOTICES.md`: FFmpeg/x264/Emscriptenの配布情報

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1
```

## ライセンス

このアプリのリポジトリは **GPL-3.0-or-later** です。内包する `htmlapps-ffmpeg-wasm-builder` の生成FFmpeg/x264コアは **GPL-2.0-or-later** として配布されます。

生成HTMLのヘルプ画面にも、使用中のBuilderバージョンと対応ソースへのリンクを表示します。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。
