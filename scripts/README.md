# スクリプト

このディレクトリには、さまざまな目的のスクリプトが格納されています。

## 本番用 (production)

本格運用（Dockerでの実行を想定）で使用するスクリプト群です。

- `large-scale-collection.ts`: メインの統合実行スクリプト
- `phase1-quality.ts`: 品質を重視した700件のデータ収集
- `phase2-temporal.ts`: 時系列分析を目的とした300件のデータ収集
- `comprehensive-analysis.ts`: 包括的な学術分析を実行
- `export-dataset.ts`: 論文執筆用のデータセットを出力

## 開発用 (development)

開発やデバッグの際に使用するスクリプトです。

- `analyze-results.ts`: 収集済みのデータを分析

## レガシー (legacy)

初期開発時のプロトタイプや、参考用のコードです。

- `strict-collection.ts`: 50件のデータ収集を行うプロトタイプ
- `example.ts`: ツールの基本的な使用例