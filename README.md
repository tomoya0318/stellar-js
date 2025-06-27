# stellar-js

GitHub JavaScript/TypeScript プロジェクト分析ツール

## 概要

stellar-jsは、GitHubからJavaScript/TypeScriptプロジェクトのデータを収集・分析するためのCLIツールです。GitHub APIを通じてプロジェクト情報を取得し、SQLiteデータベースに保存して、詳細な分析を提供します。

### 主な機能

- 🔍 **プロジェクト収集**: GitHub APIでJS/TSプロジェクトを自動収集
- 📊 **詳細分析**: フレームワーク、ライセンス、アクティビティ分析
- 🗄️ **データ永続化**: SQLiteデータベースによる高速データ保存
- 🎯 **品質フィルタ**: スター数、最新性、package.json有無などで自動フィルタ
- 📈 **統計情報**: 言語分布、人気フレームワーク、トレンド分析

## 技術スタック

- **言語**: TypeScript + Node.js (ESM)
- **実行環境**: tsx (開発時), Node.js (本番)
- **GitHub APIクライアント**: @octokit/rest
- **データベース**: SQLite (via better-sqlite3)
- **ORM**: Drizzle ORM
- **データベース管理**: drizzle-kit
- **リンター/フォーマッター**: @biomejs/biome
- **テストフレームワーク**: Vitest
- **パッケージ管理**: npm

## インストール

```bash
npm install
```

## 🚀 クイックスタート

### 環境設定

1. **GitHub Personal Access Token の作成**
   - [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - `public_repo` スコープを選択
   - 生成されたトークンをコピー

2. **環境変数の設定**
   ```bash
   echo "GITHUB_TOKEN=your_github_token_here" > .env
   ```

### 基本的な使い方

```bash
# ヘルプ表示
npx tsx src/index.ts

# プロジェクト収集 (最小10スター、最大20件)
npx tsx src/index.ts collect --min-stars 10 --max-repositories 20

# TypeScriptプロジェクトのみ収集
npx tsx src/index.ts collect --language typescript --max-repositories 10

# 既存データの分析
npx tsx src/index.ts analyze

# 詳細分析（フレームワーク、ライセンス分布など）
npx tsx src/index.ts analyze --detailed --language javascript

# JSON形式でエクスポート
npx tsx src/index.ts analyze --detailed --export-json
```

### 開発

```bash
# 開発サーバー起動（ホットリロード付き）
npm run dev
```

### コード品質管理

```bash
# コードフォーマット
npm run format

# リントチェック
npm run lint

# リント問題の自動修正
npm run lint:fix

# 型チェック
npm run type-check

# 全ての品質チェックを実行
npm run check
```

### テスト

```bash
# 全テスト実行
npm run test

# 監視モードでテスト実行
npm run test:watch
```

### データベース管理

```bash
# スキーマ変更からマイグレーションファイルを生成
npm run db:generate

# マイグレーションを実行してDBを更新
npm run db:migrate

# Drizzle StudioでGUI上からDB管理
npm run db:studio
```

## 📁 プロジェクト構成

```
stellar-js/
├── src/                         # ソースコードディレクトリ
│   ├── config/                  # 設定管理（環境変数、アプリ設定）
│   ├── github/                  # GitHub API関連（クライアント、プロジェクト分析）
│   ├── lib/                     # 共通ライブラリ（DB接続、データ変換）
│   ├── repositories/            # データベースCRUD操作
│   ├── scripts/                 # 実行スクリプト（収集、分析）
│   ├── types/                   # TypeScript型定義
│   └── index.ts                 # メインCLIエントリーポイント
├── tests/                       # テストディレクトリ
│   ├── unit/                    # 単体テスト（データ変換、分析ロジック）
│   ├── integration/             # 統合テスト（データベース操作）
│   └── setup.ts                 # テストセットアップユーティリティ
├── data/                        # データファイル
│   └── stellar.db               # SQLiteデータベース
├── drizzle/                     # Drizzle ORM関連
│   ├── migrations/              # データベースマイグレーション
│   └── schema.ts                # データベーススキーマ定義
└── 設定ファイル類
```

## 🗄️ データベーススキーマ

プロジェクトは以下の情報を収集・保存します：

- **基本情報**: リポジトリ名、オーナー、説明、URL
- **統計データ**: スター数、フォーク数、コントリビューター数、サイズ
- **技術情報**: 主要言語、ライセンス、トピック、デフォルトブランチ
- **活動データ**: 最終コミット日、最終更新日、作成日
- **メタデータ**: 取得日時、依存関係数

## 🛠️ 高度な使用例

### カスタムフィルタでの収集
```bash
# 高品質プロジェクトのみ収集（100スター以上、最近更新）
npx tsx src/index.ts collect --min-stars 100 --max-repositories 50

# 既存データをスキップして新規のみ追加
npx tsx src/index.ts collect --skip-existing --max-repositories 30
```

### 詳細分析レポート
```bash
# 特定オーナーのプロジェクト分析
npx tsx src/index.ts analyze --detailed --owner microsoft

# 最小1000スター以上のプロジェクトのみ分析
npx tsx src/index.ts analyze --detailed --min-stars 1000
```

## ライセンス

MIT