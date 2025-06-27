# Stellar-JS: GitHub Repository Mining Tool

JavaScript + Node.jsで構築されたGitHubリポジトリのデータ収集・分析ツールです。GitHub APIを通じてリポジトリデータを取得し、多次元フィルタリングを行ってSQLiteデータベースに保存します。

## 📋 目次

- [特徴](#特徴)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [使用方法](#使用方法)
- [フィルタリング機能](#フィルタリング機能)
- [データベース構造](#データベース構造)
- [開発](#開発)
- [トラブルシューティング](#トラブルシューティング)

## ✨ 特徴

- **多次元フィルタリング**: 人気度、活動度、品質など複数の観点でリポジトリを評価
- **適応的Tierシステム**: スター数に応じて収集目標を動的に調整
- **型安全**: TypeScriptによる完全な型安全性（`any`型を排除）
- **スケーラブル**: バッチ処理による大量データ対応
- **データ永続化**: SQLite + Drizzle ORMによる堅牢なデータ管理
- **レート制限対応**: GitHub APIのレート制限を自動管理

## 🛠 技術スタック

- **言語**: TypeScript + Node.js (ESM)
- **GitHub API**: @octokit/rest
- **データベース**: SQLite (better-sqlite3)
- **ORM**: Drizzle ORM
- **テスト**: Vitest
- **コード品質**: Biome (リンター/フォーマッター)
- **実行環境**: tsx (開発), Node.js (本番)

## 🚀 セットアップ

### 1. 環境要件

- Node.js 18以上
- npm または pnpm/yarn

### 2. インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd stellar-js

# 依存関係をインストール
npm install
```

### 3. 環境変数設定

GitHub Personal Access Tokenが必要です。

```bash
# .env ファイルを作成
cp .env.example .env
```
次に、`.env`ファイルを開き、`your_github_personal_access_token`をあなたのトークンに置き換えてください。

### 4. データベース初期化

```bash
# データベースマイグレーションを実行
npm run db:migrate

# データベース構造を確認（オプション）
npm run db:studio
```

## 📖 使用方法

### 大規模収集の実行

このプロジェクトのメイン機能です。`scripts/production`内のスクリプト群を統合的に実行し、約1000件の高品質なJavaScriptリポジトリを収集・分析します。

```bash
# 大規模収集を開始
npm run large-scale-collection
```

このコマンドは、以下のフェーズを順番に実行します。
1.  **Phase 1**: 品質を重視したリポジトリ収集
2.  **Phase 2**: 時系列分析を目的としたリポジトリ収集
3.  **Phase 3**: 包括的な分析とデータセットのエクスポート

### 個別スクリプトの実行

開発やデバッグのために、個別のスクリプトを実行することも可能です。

```bash
# 開発用の分析スクリプト
npx tsx scripts/development/analyze-results.ts

# 参考用のプロトタイプ収集
npx tsx scripts/legacy/strict-collection.ts
```
スクリプトの詳細は`scripts/README.md`を参照してください。

## 🔍 フィルタリング機能

### 適応的Tierシステム

本ツールは、スター数に応じてリポジトリを複数の「Tier（階層）」に分割し、それぞれのTierで異なる収集目標とフィルタリング基準を適用します。これにより、スター数が極端に多いリポジトリから、比較的新しい有望なリポジトリまで、バランス良く高品質なデータを収集できます。

### 主要なフィルター

- **人気度フィルター (PopularityFilter)**: スター数、フォーク数など
- **活動度フィルター (ActivityFilter)**: コントリビューター数、最終Push日など
- **品質フィルター (QualityFilter)**: READMEの有無、ライセンス、Issueの解決速度など

## 🗄 データベース構造

### 主要テーブル

- **repositories**: リポジトリの基本情報
- **filtering_stages**: フィルタリングステージの定義
- **repository_filter_status**: 各リポジトリのフィルタリング結果
- **repository_metrics**: リポジトリの詳細メトリクス
- **quality_assessments**: 品質評価結果
- **collection_batches**: 収集バッチの管理情報

### データベース操作

```bash
# スキーマ変更の生成
npm run db:generate

# マイグレーション実行
npm run db:migrate

# データベースGUI（Drizzle Studio）
npm run db:studio
```

## 🔧 開発

### 開発コマンド

```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# コード品質チェック
npm run format      # コード整形
npm run lint        # リントチェック
npm run type-check  # 型チェック
npm run test        # テスト実行

# 全チェック実行
npm run check
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. GitHub API レート制限
**解決方法:**
- `.env`ファイルの`GITHUB_TOKEN`が正しく設定されているか確認してください。
- レート制限がリセットされるまで待つか、`batchSize`を小さくして実行頻度を調整してください。

#### 2. データベース接続エラー
**解決方法:**
- `npm run db:migrate`を再実行してください。
- `data/`ディレクトリのパーミッションを確認してください。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🤝 コントリビューション

プルリクエストを歓迎します。`npm run check`が全て通ることを確認してから、プルリクエストを作成してください。
