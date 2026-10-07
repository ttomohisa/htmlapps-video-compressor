# Local Video Compressor

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-video-compressor/)

[English README](README.md)

動画をアップロードせず、ブラウザ内だけで圧縮する単一HTMLアプリです。互換性を優先する **H.264 / AAC の MP4** と、より小さいファイルを狙う **VP9 / Opus の WebM** を選べます。FFmpegエンジンは [`htmlapps-ffmpeg-wasm-builder`](https://github.com/ttomohisa/htmlapps-ffmpeg-wasm-builder) が生成する、SharedArrayBuffer不要のFFmpeg 9 compact WebAssemblyを使用します。

![アプリ画面](docs/preview.png)

## 🚀 デモ

[GitHub PagesでLocal Video Compressorを開く](https://ttomohisa.github.io/htmlapps-video-compressor/)

> **CSPについて:** WebAssembly実行用に `script-src` へ限定的な `'wasm-unsafe-eval'` を指定しています。JavaScriptの `eval()` を許可する `'unsafe-eval'` は使わず、`connect-src 'none'` で実行時通信を遮断します。

## 主な機能

- H.264 / AAC / MP4：再生互換性とブラウザ内エンコード速度を優先
- VP9 / Opus / WebM：処理時間が長くなっても容量を小さくしたい場合向け
- 元動画の映像パケットを実際に解析して平均映像ビットレートを測定し、出力設定には動画に合わせたおすすめビットレートを初期設定
- MP4/MOVのDisplay Matrixによる回転を実画素へ適用し、縦向き・回転付き動画の向きを維持
- 解像度変更（縦横比維持・アップスケールなし）
- 出力フレームレート、圧縮速度、音声ビットレート
- オーディオ削除
- 選択した出力ビットレートと動画時間から圧縮後サイズを概算
- WORKERFSで入力File/Blobを参照し、大きな元動画を丸ごとMEMFSへ複製しない構成
- 圧縮中の進捗、ログ、キャンセル
- 圧縮後のプレビュー・保存・共有
- 次回の出力ファイル名を編集し、形式に応じて `.mp4` / `.webm` を自動付与
- 圧縮結果のファイル名を保存・共有前に変更可能（再圧縮せず、実際の形式を保持）
- 日本語 / English
- 完全ローカル処理。実行時通信なし
- PC / スマートフォン向けレスポンシブUI
- スマートフォンでは「動画・設定・見積・圧縮」の下部固定アクションで主要操作へすぐ移動

## FFmpeg WASMの取り込み方

このリポジトリには大きなWASMを直接コミットしません。`dependencies.json` に使用する **FFmpeg WASM Builderのバージョンを1か所だけ**固定し、ビルド時にGitHub Releaseから取得します。

現在の固定バージョン:

```json
"version": "1.10.1"
```

Builder v1.10.1ではMP4の最終フレームの時間を修正し、「元のまま」の可変フレーム時刻を保持します。Builder v1.6.0の `video-compressor` profileでは、libvpx VP9、Opus、元動画のストリーム解析、回転補正、WORKERFS入力を追加しています。ブラウザ実行時にはGitHub Releaseへアクセスしません。

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

Builderの変更をRelease前に確認する場合は、Builder側で `build-video-compressor.bat` を実行した後、その生成先を直接指定できます。

```text
build-with-local-ffmpeg.bat ..\htmlapps-ffmpeg-wasm-builder\dist\video-compressor
```

このローカル統合ビルドは開発確認用です。正式な配布HTMLは従来どおりGitHub Releaseのassetと `SHA256SUMS.txt` を検証して生成します。

## FFmpegを更新する

Builder側で新しいReleaseが出たら、次のように更新します。

```text
update-ffmpeg.bat 1.10.1
```

`dependencies.json` のバージョンを更新し、新しいReleaseの取得・SHA-256検証・単一HTML再ビルドまで実行します。FFmpeg更新後は必ず生成HTMLで実動画の圧縮確認も行います。

## 使い方

1. 動画をドロップまたは選択します。
2. ブラウザ内の解析が終わると、元動画の実測映像ビットレートを参考情報として表示し、圧縮設定にはおすすめの映像ビットレートを初期設定します。
3. 「H.264 / MP4」または「VP9 / WebM」を選びます。
4. 必要なら解像度、ビットレート、fps、圧縮速度、音声設定を調整し、保存ファイル名を入力します。
5. 「この設定で圧縮」を押します。スマートフォンでは下部の「圧縮」からも実行できます。
6. 生成されたMP4/WebMをプレビューし、「保存」または「共有」を押します。

初期値はH.264 / MP4です。一般にブラウザ内でのエンコードが速く再生互換性も高いためです。VP9 / WebMは、処理時間よりファイル容量を優先するときに選ぶ想定です。

## プライバシーとオフライン設計

- CSPの `connect-src 'none'` で実行時通信を禁止
- 外部CDN、解析、広告、外部フォントなし
- 選択動画と圧縮結果を永続保存しない
- `ffmpeg.js` と `ffmpeg.wasm` を単一HTMLへ内包
- FFmpeg処理は専用Workerで実行
- 元動画のFile/BlobはWORKERFS経由で参照し、入力全体をMEMFSへ複製しない
- WASMバイトを `instantiateWasm` へ直接渡し、`file://` でもWASMのURL解決を不要にする
- Workerソースも1つのBlobへまとめ、ネストした `importScripts()` を使わない
- SharedArrayBuffer / COOP / COEPは不要

詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) と [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md) を参照してください。

## 開発

主なファイル:

- `dependencies.json`: FFmpeg WASM Builderの固定バージョンとRelease asset定義
- `src/index.template.html`: UIとアプリ本体
- `build-standalone.ps1`: Release取得、checksum検証、単一HTML生成
- `build-with-local-ffmpeg.bat`: Builderのローカル生成物を直接使う開発確認用ビルド
- `update-ffmpeg.bat`: Builderバージョン更新用
- `scripts/check-repository.ps1`: ソース確認からビルド検証までを実行
- `THIRD_PARTY_NOTICES.md`: FFmpeg/x264/libvpx/Opus/Emscriptenの配布情報

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1
```

## ライセンス

このアプリのリポジトリは **GPL-3.0-or-later** です。内包する `htmlapps-ffmpeg-wasm-builder` のFFmpeg/x264/libvpx/Opusコアは、GPLのx264をリンクするため **GPL-2.0-or-later** として配布されます。libvpxとOpusの個別ライセンス・特許許諾情報もBuilderのRelease bundleに含めます。

生成HTMLのヘルプ画面にも、使用中のBuilderバージョンと対応ソースへのリンクを表示します。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。

## 入力切り替えの回帰テスト

PowerShellに加えてNode.js 22以降を用意してください。`node scripts/test-source-lifecycle.cjs` でテンプレートのテストを実行できます。HTMLのパスを引数に渡すと通常版の生成物も確認できます。`scripts/check-repository.ps1` はビルド前にソースとルート配布HTMLを確認し、ビルド後に生成HTMLとルート配布物の一致も確認します。テンプレートを変更したら `build-standalone.ps1` で配布HTMLを再生成してください。

実際のアプリスクリプトを使い、DOM・動画イベント・Worker通信・タイマー・埋め込みコア準備だけをテスト用に制御します。架空の小さなファイル情報と出力バイト列で、入力の切り替え・削除、古いコールバック、キャンセル直後の再試行、リソース解放、H.264/VP9の引数と出力名を確認します。動画のデコードやWASM実行は行いません。ブラウザー、実動画、オフライン、保存・共有、モバイルの手動確認は `VERIFY_OFFLINE.md` に従って別途行ってください。
