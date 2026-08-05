# Local Video Compressor

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-video-compressor/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-video-compressor/)


ffmpeg.wasm を使い、動画をアップロードせずブラウザ内だけで圧縮する単一HTMLアプリです。

![アプリ画面](docs/preview.png)

## 🚀 デモ

[GitHub PagesでLocal Video Compressorを開く](https://ttomohisa.github.io/htmlapps-video-compressor/)


> **CSPについて:** ffmpeg.wasmのWebAssembly実行に必要なため、`script-src`には限定的な`'wasm-unsafe-eval'`を指定しています。JavaScriptの`eval()`を許可する`'unsafe-eval'`は使用せず、`connect-src 'none'`による実行時通信の遮断も維持しています。

## 主な機能

- 解像度を変更（縦横比維持・アップスケールなし）
- 映像ビットレートを変更
- H.264 / H.265 / VP9 を選択
- 動画の長さと設定から圧縮後サイズを概算
- オーディオ削除
- 圧縮後の動画をプレビュー・保存・共有
- 選択動画のサイズ、再生時間、解像度、推定総ビットレート、測定フレームレート、形式を見やすく表示
- 動画に合わせて解像度、フレームレート、映像ビットレートを自動提案
- 解像度とコーデックに応じて映像ビットレートの上限を動的に調整
- フレームレート、圧縮速度、音声ビットレート、メタデータ保持はアドバンス設定へ分離
- アプリ内ヘルプとトラブルシューティング
- 各設定のinfoボタンと具体的な選び方
- H.265向けの最低負荷設定と、進捗が出ない場合のH.264再試行
- 日本語 / English
- 実行時通信なし。動画はブラウザのメモリ内だけで処理

## すぐに使う

アップロードは行われません。選択したファイルはブラウザセッション内にローカルに保存されます。

### Webで使う

[デモを開く](https://ttomohisa.github.io/htmlapps-video-compressor/)だけで利用できます。インストールやアカウント登録は不要です。

### ダウンロードして使う

[video-compressor.html](https://github.com/ttomohisa/htmlapps-video-compressor/blob/main/video-compressor.html) をリポジトリからダウンロードして、最新のChromiumベースのブラウザで開いてください。

### ビルドして使う(advance)

1. このリポジトリをダウンロードまたはクローンします。
2. Windowsで `build-offline.bat` をダブルクリックします。
3. 初回だけ、`versions.json` で固定された依存パッケージを取得します。
4. 生成された `dist/index.html` を任意の場所へコピーします。
5. 以降は `dist/index.html` 単体を、インターネット接続なしで開けます。

Python、Node.js、ローカルWebサーバーは不要です。Windows標準のPowerShellと `tar.exe` を使用します。

> `ffmpeg-core.wasm` を内包するため、完成したHTMLは約43MBになります。

## 使い方

1. 動画をドロップまたは選択します。
2. 自動提案された解像度とビットレートを確認します。
3. 必要な場合だけコーデックやオーディオ削除を変更します。
4. 「この設定で圧縮」を押します。
5. 結果をプレビューし、「保存」または「共有」を押します。

迷ったときは H.264 と自動提案値のままがおすすめです。H.265 は単一スレッドのWebAssemblyでは非常に遅いため、短い動画向けの実験的機能として扱います。12秒以上進捗が見えない場合は、処理画面の「H.264でやり直す」から同じ動画を再試行できます。VP9も圧縮に時間がかかります。

画面右上の「ヘルプ」から、設定の選び方、動画情報の意味、共有方法、失敗時の対処を確認できます。

## 動画情報について

- **推定総ビットレート**は、ファイル容量と再生時間から計算した映像・音声を含む概算です。
- **フレームレート**は、ブラウザで動画を再生して複数フレームを測定します。形式やブラウザによっては「取得不可」になります。
- 情報を一部取得できなくても、動画形式をFFmpegが読み込めれば圧縮を試せます。

## プライバシーとオフライン設計

- CSPの `connect-src 'none'` で実行時通信を禁止
- 外部CDN、解析、広告、外部フォントなし
- 選択した動画と圧縮結果を保存領域へ永続化しない
- JavaScriptとWASMをBase64で単一HTMLへ内包
- FFmpegコアのJavaScriptを専用Workerへ直接結合し、`file://`で問題になるWorker内の`importScripts(blob:null/...)`を使用しない

詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) と [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md) を参照してください。

## 開発

設定と固定依存関係は次のファイルで管理します。

- `app.config.json`: アプリ名、バージョン、出力先
- `dependencies.json`: npmパッケージ、固定バージョン、内包対象
- `src/index.template.html`: UIとアプリ本体
- `build-standalone.ps1`: 依存取得・Base64内包・検証

ソース確認:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-source.ps1
```

単一HTMLの生成:

```powershell
.\build-standalone.ps1
```

依存キャッシュを無視して再取得:

```powershell
.\build-standalone.ps1 -ForceDownload
```

## GitHub Pages

`.github/workflows/deploy-pages.yml` は `main` へのpush時にWindows上で単一HTMLを生成し、`dist` をGitHub Pagesへ公開します。リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定してください。

## 注意事項

ffmpeg.wasm はCPU処理で、ハードウェアエンコードではありません。長い動画、高解像度動画、スマートフォンでは時間がかかり、端末のメモリ不足で失敗することがあります。まず短い動画で確認してください。

## License

GPL-3.0-or-later. 内包する `@ffmpeg/core` は GPL-2.0-or-later です。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。
