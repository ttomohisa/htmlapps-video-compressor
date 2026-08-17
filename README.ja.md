# Local Video Compressor

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml)
[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-video-compressor/)

[English README](README.md)

ffmpeg.wasm を使い、動画をアップロードせずブラウザ内だけで圧縮する単一HTMLアプリです。通常版と、配布サイズを抑えた自己解凍版の2種類を同じビルドから生成します。

![アプリ画面](docs/preview.png)

## 🚀 デモ

[GitHub PagesでLocal Video Compressorを開く](https://ttomohisa.github.io/htmlapps-video-compressor/)

> **CSPについて:** ffmpeg.wasm の WebAssembly 実行に必要なため、`script-src` には限定的な `'wasm-unsafe-eval'` を指定しています。JavaScript の `eval()` を許可する `'unsafe-eval'` は使用せず、`connect-src 'none'` による実行時通信の遮断も維持しています。

## 主な機能

- 解像度変更（縦横比維持・アップスケールなし）
- 映像ビットレート変更と動画ごとのおすすめ値
- H.264 / H.265 / VP9
- 動画の長さと設定から圧縮後サイズを概算
- オーディオ削除
- 圧縮後のプレビュー・保存・共有
- サイズ、再生時間、解像度、推定総ビットレート、測定フレームレート、形式を表示
- フレームレート、圧縮速度、音声ビットレート、メタデータ保持をアドバンス設定へ分離
- H.265向け低負荷設定と、進捗が出ない場合のH.264再試行
- 日本語 / English
- 実行時通信なし。動画はブラウザのメモリ内だけで処理

### スマートフォンUI

狭い画面ではヘッダーとカードをコンパクト化し、フォームのタップ領域を広げています。動画を選択すると画面下部に「圧縮後サイズの概算」と「この設定で圧縮」をまとめたアクションが表示されるため、設定をスクロールした後に圧縮ボタンを探し直す必要がありません。処理中と結果表示中は自動で隠れます。

ヘルプ、設定説明、確認ダイアログはスマートフォンではボトムシート表示になります。

## ビルド

Windowsで `build-standalone.bat` を実行します。Python、Node.js、ローカルWebサーバーは不要です。初回だけ固定バージョンの `@ffmpeg/core` を取得し、その後はキャッシュを利用できます。

```text
dist/
├─ index.html
├─ index.self-extract.html
├─ dependency-manifest.json
├─ self-extract-manifest.json
└─ .nojekyll
```

- `dist/index.html`: 可読性・デバッグ・GitHub Pages向けの通常版
- `dist/index.self-extract.html`: 通常版をgzip圧縮して内包し、ブラウザの `DecompressionStream` で復元する配布向け版

どちらも1ファイルで動作し、外部CDNや実行時通信を必要としません。通常版だけ生成したい場合は次を使えます。

```powershell
.\build-standalone.ps1 -SkipSelfExtract
```

依存キャッシュを無視して再取得する場合:

```powershell
.\build-standalone.ps1 -ForceDownload
```

自己解凍版は JavaScript と `DecompressionStream` が利用できるブラウザが必要です。GitHub Pages のトップページには通常版 `index.html` を使用します。

## 使い方

1. 動画をドロップまたは選択します。
2. 自動提案された解像度とビットレートを確認します。
3. 必要な場合だけコーデックやオーディオ削除を変更します。
4. 「この設定で圧縮」を押します。
5. 結果をプレビューし、「保存」または「共有」を押します。

迷ったときは H.264 と自動提案値のままがおすすめです。H.265 は単一スレッドのWebAssemblyでは非常に遅いため、短い動画向けの実験的機能です。進捗が長時間見えない場合は処理画面から H.264 で再試行できます。

## プライバシーとオフライン設計

- CSP の `connect-src 'none'` で実行時通信を禁止
- 外部CDN、解析、広告、外部フォントなし
- 選択動画と圧縮結果を永続保存しない
- JavaScript と WASM を Base64 で単一HTMLへ内包
- FFmpegコアを専用Workerへ直接結合し、`file://` で問題になりやすいWorker内の外部読み込みを回避
- 自己解凍版も復元時にネットワークを使用しない

詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) と [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md) を参照してください。

## 開発

主なファイル:

- `app.config.json`: アプリ名、バージョン、通常版/自己解凍版の出力先
- `dependencies.json`: npmパッケージ、固定バージョン、内包対象
- `src/index.template.html`: UIとアプリ本体
- `build-standalone.ps1`: 完全内包HTMLの生成
- `scripts/build-self-extract.ps1`: gzip自己解凍HTMLの生成
- `scripts/verify-standalone.ps1`: 通常版の検証
- `scripts/verify-self-extract.ps1`: 自己解凍版の復元・一致検証
- `scripts/check-repository.ps1`: ソース確認から両方のビルド検証までを実行

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-repository.ps1
```

## GitHub Pages

`.github/workflows/deploy-pages.yml` は `main` への push 時に Windows 上で両方のHTMLを生成・検証します。Pages が有効なら `dist` を公開し、未設定なら公開だけをスキップして設定方法を Actions の Summary に表示します。

新しいリポジトリでは **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。

## 注意事項

ffmpeg.wasm はCPU処理で、ハードウェアエンコードではありません。長い動画、高解像度動画、スマートフォンでは時間がかかり、端末のメモリ不足で失敗することがあります。まず短い動画で確認してください。

## License

GPL-3.0-or-later. 内包する `@ffmpeg/core` は GPL-2.0-or-later です。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。
