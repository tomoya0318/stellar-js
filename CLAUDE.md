---
title: CLAUDE.md
created_at: 2025-06-14
updated_at: 2025-06-27
author: Claude Code
version: 2.0.0
project_type: TypeScript Node.js データ収集ツール
tags: [github-api, sqlite, drizzle-orm, typescript, tdd]
# このプロパティは、Claudeが関連するドキュメントの更新を検知するために必要です。消去しないでください。
---

このファイルは、[Claude](https://www.anthropic.com/claude) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## プロジェクト概要

このプロジェクトは、GitHubからJavaScriptリポジトリのデータを取得・保存するためのデータ収集ツールです。GitHub APIを通じてデータを取得し、SQLiteデータベースに永続化します。分析は別のリポジトリやプロセスで行うことを想定しており、このプロジェクトはデータ取得と保存の責務に特化しています。

## 技術スタック

- **言語**: TypeScript + Node.js (ESM)
- **実行環境**: tsx (開発時), Node.js (本番)
- **GitHub APIクライアント**: @octokit/rest
- **データベース**: SQLite (via better-sqlite3)
- **ORM**: Drizzle ORM
- **データベース管理**: drizzle-kit
- **リンター/フォーマッター**: @biomejs/biome
- **テストフレームワーク**: Vitest
- **パッケージ管理**: npm (または pnpm/yarn)

## プロジェクト全体の構造 (デフォルト。必要に応じて更新してください)

```
project-root/
├── src/
│   ├── core/          # ビジネスロジック
│   ├── types/         # 型定義
│   ├── api/           # GitHub API関連
│   └── repository/    # データベースアクセス層
├── drizzle/           # スキーマ・マイグレーション
├── data/              # SQLiteファイル
├── tests/             # テストファイル
├── drizzle.config.ts  # Drizzle設定
├── package.json       # npm/nodeの設定ファイル
├── package-lock.json  # 依存関係ロック
├── tsconfig.json      # TypeScript設定
├── vitest.config.ts   # テスト設定
├── .gitignore         # バージョン管理除外ファイル
├── README.md          # 人間向けのプロジェクトの説明
└── CLAUDE.md          # このファイル
```

## 実装時の必須要件

**重要**: コードを書く際は、必ず以下のすべてを遵守してください：

### 0. 開発環境を確認して活用する

- 開発環境は`package.json`で管理されています。依存関係の追加は `npm install`、スクリプトの実行は `npm run <script_name>` を使用してください。
- 開発時のTypeScript実行には `tsx` を使用します。
- Biome.jsによる厳格なコード品質チェックが設定されています。コミット前に `npm run format` と `npm run lint` を実行してください。
- 「よく使うコマンド」セクションにあるコマンド集は、この開発環境での作業を効率化します。積極的に活用してください。

### 1. コード品質を保証する

**コード品質保証のベストプラクティスは「コーディング規約」セクションを参照してください。**

コーディング後は必ず品質チェックコマンドを実行してください。

- `npm run format`: コードフォーマット
- `npm run lint`: リントチェック
- `npm run type-check`: 型チェック
- `npm run test`: 全テスト実行
- まとめて実行: `npm run check` (lint → typecheck → test)

### 2. テストを実装する

**テスト実装のベストプラクティスは「テスト戦略」セクションを参照してください。**

新機能には必ず対応するテスト（主に単体テスト）を作成してください。

### 3. 適切なロギングを行う

**ロギングのベストプラクティスは「ロギング戦略」セクションを参照してください。**

実行時の問題追跡を容易にするため、主要な処理の開始/終了、エラー発生時にはロギングを実装してください。

### 4. 段階的実装アプローチを行う

- **インターフェース/型定義先行**: まず`src/types/`や各機能の型定義から始める。
- **テストファースト**: 実装前にVitestでテストを作成する。
- **段階的実装**: 最小限の実装→リファクタリング→最適化の順序で進める。

### 5. エビデンスベース開発を実践する

**重要**: パフォーマンスや品質に関する主張は、必ず測定可能なデータで裏付けてください。

#### 測定が必要な場面
- 「高速化した」「最適化した」などの主張
- データベースクエリの改善
- API レスポンス時間の改善
- メモリ使用量の改善

#### 測定方法
```TypeScript
// パフォーマンス測定の例
console.time('data-collection');
const result = await collectRepositoryData(repoName);
console.timeEnd('data-collection');

// メモリ使用量測定
const memBefore = process.memoryUsage();
await processLargeDataset(data);
const memAfter = process.memoryUsage();
console.log(`Memory delta: ${(memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024} MB`);
```

#### 改善の記録
```TypeScript
// AIDEV-PERF: データベースクエリ最適化
// Before: 1,234ms (N+1問題)
// After: 456ms (バッチクエリ化)
// 改善率: 63%向上
```

## よく使うコマンド

### 基本的な開発コマンド (`package.json`の`scripts`を想定)

```bash
# 開発環境のセットアップ
npm install

# 開発サーバーの起動 (ホットリロード付き)
npm run dev

# コード品質チェック
npm run format      # Biomeでコードをフォーマット
npm run lint        # Biomeでリントチェック
npm run type-check   # TypeScriptコンパイラで型チェック

# テスト実行
npm run test        # 全てのテストを実行

# データベース (Drizzle ORM)
npm run db:generate # スキーマ変更からマイグレーションファイルを生成
npm run db:migrate  # マイグレーションを実行してDBを更新
npm run db:studio   # Drizzle Studioを起動してDBをGUIで確認

# Dockerコンテナの起動
docker compose build --no-cache # コンテナをキャッシュなしでビルド
docker compose up -d # コンテナの起動
docker compose down # コンテナの停止
docker exec -it 
```

## コーディング規約

- **言語**: TypeScript (開発言語), JavaScript (主要な収集対象)
- **ランタイム**: Node.js
- **主要ライブラリ**:
    - **ORM**: Drizzle
    - **テスト**: Vitest
    - **リンター/フォーマッター**: Biome
- **コーディングスタイル**:
    - プロジェクト既存のコードスタイルに従ってください。
    - Biomeのフォーマットルール (`biome.json`) を遵守してください。 `npx biome check --apply .` を実行して確認してください。
- **テスト**:
    - Vitestを利用します。
    - テストコードは `*.test.ts` または `*.spec.ts` という命名規則で、テスト対象ファイルと同じディレクトリか、専用の `__tests__` ディレクトリに配置します。
    - 既存のテストのスタイルに従ってください。
- **ドキュメント**:
    - JSDoc形式でコメントを記述してください。特に、公開APIや複雑なロジックにはコメントを追加してください。
- **コミットメッセージ**:
    - [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) の規約に従ってください。
- **その他**:
    - 型定義を積極的に利用し、`any`型は原則として使用しないでください。
    - 依存関係は `package.json` で管理します。
    - `.gitignore` に従って、不要なファイルはコミットに含めないでください。
    - `README.md` にはプロジェクトの概要やセットアップ方法を記載します。

### ディレクトリ構成

上記の「プロジェクト全体の構造」セクションの構成を踏襲します。コアロジックは `src/core` 内に、データベース関連は スキーマの定義は`drizzle`，`src/repository` 内に配置してください。


### TypeScript コーディングスタイル
- 型定義: TypeScriptの強力な型システムを最大限に活用します。anyの使用は原則禁止です。
- JSDoc: エクスポートされる関数やクラス、複雑な型定義にはJSDoc形式でコメントを記述します。
- 命名規則:
  - クラス/型/インターフェース: PascalCase
  - 関数/変数: camelCase
  - 定数: UPPER_SNAKE_CASE
  - プライベートプロパティ/メソッド: _プレフィックス（例: _privateMethod）
- インポート順序: Biomeが自動で整理します。設定に従ってください。
- モジュール: Node.jsのESM(`import/export`)を使用します。

### エラーハンドリングの原則

#### 1. 具体的で実用的
```TypeScript
// Bad
throw new Error("Invalid input");

// Good
throw new Error(`Invalid repository name: ${repoName}. Expected format 'owner/repo'.`);
```

#### 2. エラーの連鎖
```TypeScript
try {
  await processData(data);
} catch (e) {
  // 元のエラーをラップして、より多くのコンテキストを提供する
  throw new Error(`Failed to process data for repository ${repo.fullName}`, { cause: e });
}
```

### アンカーコメント
疑問点や改善点がある場合は、アンカーコメントを活用してください。
```TypeScript
// AIDEV-NOTE: この関数はGitHubのレートリミットを考慮して作られている
// AIDEV-TODO: ページネーション処理の効率を改善する必要がある
// AIDEV-QUESTION: このスキーマ定義でインデックスは必要か？
```

## テスト戦略

**t-wada流のテスト駆動開発（TDD）を徹底してください。**

#### 基本方針

- 🔴 Red: 失敗するテストを書く
- 🟢 Green: テストを通す最小限の実装
- 🔵 Refactor: リファクタリング
- 小さなステップで進める

### TDDの実施手順 (Vitestの例)
1. **TODOリストの作成**: 実装する機能やケースを細分化してリストアップします。

2. **Red フェーズ**: 失敗することを確認しながらテストケースを記述します。
```TypeScript
// tests/unit/processor.test.ts
import { test, expect } from 'vitest';
import { processApiResponse } from '../../src/core/processor';

test('should process raw API data into clean format', () => {
  const rawData = { id: 1, full_name: 'owner/repo', private: false };
  const result = processApiResponse(rawData);
  // この時点では processApiResponse は未実装なので失敗する
  expect(result).toEqual({ repoId: 1, name: 'owner/repo', isPrivate: false });
});
```

3. **Green フェーズ**: テストをパスさせるための最小限のコードを書きます。
```TypeScript
// src/core/processor.ts
export function processApiResponse(rawData: any) {
  // とりあえずテストを通すための仮実装（ベタ書き）
  return { repoId: 1, name: 'owner/repo', isPrivate: false };
}
```

4. **Refactor フェーズ**: テストが通る状態を維持しながら、実装をより良く、より一般的にリファクタリングします。
```TypeScript
// src/core/processor.ts
type RawRepoData = { id: number; full_name: string; private: boolean; [key: string]: any };
type CleanRepoData = { repoId: number; name: string; isPrivate: boolean };

export function processApiResponse(rawData: RawRepoData): CleanRepoData { {
  // 一般的なロジックに修正
  return {
    repoId: rawData.id,
    name: rawData.full_name,
    isPrivate: rawData.private,
  };
}
```
### テスト命名規約 (Vitest)
```TypeScript
import { describe, it, expect } from 'vitest';

describe('Data Collector', () => {
  describe('正常系', () => {
    it('有効なリポジトリ名でデータを正常に取得できる', () => {
      // ...
    });
  });

  describe('異常系', () => {
    it('存在しないリポジトリを指定した場合、エラーをスローする', () => {
      // ...
    });
  });

  describe('エッジケース', () => {
    it('空のレスポンスを正しくハンドリングできる', () => {
      // ...
    });
  });
});
```

#### TDD実践時の注意点

1. **テストは1つずつ追加**
   - 一度に複数のテストを書かない
   - 各テストが失敗することを確認してから実装

2. **コミットのタイミング**
   - Red → Green: テストが通ったらコミット
   - Refactor: リファクタリング完了でコミット
   - 小さく頻繁にコミットする

3. **テストの粒度**
   - 最小単位でテストを書く
   - 1つのテストで1つの振る舞いをテスト
   - テスト名は日本語で意図を明確に

4. **リファクタリングの判断**
   - 重複コードがある
   - 可読性が低い
   - 設計原則（SOLID等）に違反
   - パフォーマンスの問題（測定してから）

5. **テストファーストの実践**
   - 必ず失敗するテストから書く
   - `npm run test`で失敗を確認
   - 最小限の実装でテストを通す

6. **段階的な実装**
   - TODOリストを1つずつ消化
   - 各ステップでテストが通ることを確認
   - リファクタリング時もテストを実行

### プロパティベーステスト（Property-based Testing）の活用

大量のテストケースを自動生成してバグを発見する手法を活用してください。

```TypeScript
import { describe, it, expect } from 'vitest';
import { fc } from 'fast-check';

describe('Repository Name Validator', () => {
  it('should accept valid repository names', () => {
    fc.assert(fc.property(
      fc.tuple(
        fc.stringMatching(/^[a-zA-Z0-9._-]+$/),
        fc.stringMatching(/^[a-zA-Z0-9._-]+$/)
      ),
      ([owner, repo]) => {
        const repoName = \`\${owner}/\${repo}\`;
        expect(isValidRepoName(repoName)).toBe(true);
      }
    ));
  });

  it('should reject invalid repository names', () => {
    fc.assert(fc.property(
      fc.string().filter(s => !s.includes('/') || s.split('/').length !== 2),
      (invalidName) => {
        expect(isValidRepoName(invalidName)).toBe(false);
      }
    ));
  });
});
```

### テストデータ管理

```TypeScript
// tests/fixtures/repositories.ts
export const validRepositories = [
  { owner: 'facebook', name: 'react', fullName: 'facebook/react' },
  { owner: 'microsoft', name: 'typescript', fullName: 'microsoft/typescript' },
] as const;

export const invalidRepositories = [
  'invalid-name',
  'owner/repo/extra',
  '',
  'owner/',
  '/repo',
] as const;

// tests/factories/repository.factory.ts
export function createMockRepository(overrides?: Partial<Repository>): Repository {
  return {
    id: Math.floor(Math.random() * 1000000),
    fullName: 'owner/repo',
    private: false,
    stargazersCount: 0,
    ...overrides,
  };
}
```

### 統合テストの指針

```TypeScript
// tests/integration/github-api.test.ts
describe('GitHub API Integration', () => {
  beforeEach(async () => {
    // テスト用データベースの準備
    await setupTestDatabase();
  });

  it('should fetch and store repository data end-to-end', async () => {
    const repoName = 'octocat/Hello-World';

    // 実際のAPI呼び出しをモック
    mockGitHubApi.onGet(\`/repos/\${repoName}\`).reply(200, mockRepoData);

    await collectAndStoreRepository(repoName);

    const stored = await getRepositoryFromDb(repoName);
    expect(stored).toMatchObject({
      fullName: repoName,
      stargazersCount: expect.any(Number),
    });
  });
});
```

## ロギング戦略

### ロギング実装の必須要件

**TL;DR**

1. 適切なロギングライブラリを使用: (例: pino, winston) 必要であれば導入を提案してください。シンプルな用途であれば console でも構いません。

2. 関数・メソッドの開始と終了時にログを出力: 特に時間のかかる処理や重要な処理。

3. エラー処理時にログを出力: try-catch文のcatchブロックでエラーオブジェクトを記録します。

4. ログレベルの使い分け:
  - `console.debug (DEBUG)`: 詳細な実行フロー、変数の値など。

  - `console.info (INFO)`: 重要な処理の完了、状態変更。

  - `console.warn (WARNING)`: 異常ではないが注意が必要な状況。

  - `console.error (ERROR)`: エラー発生時。

**実装例**
```TypeScript
// src/core/collector.ts
export async function collectRepoData(repoName: string) {
  console.info(`[Collector] Starting data collection for: ${repoName}`);

  try {
    // ... データ収集処理 ...
    console.info(`[Collector] Successfully collected data for: ${repoName}`);
  } catch (error) {
    console.error(`[Collector] Failed to collect data for: ${repoName}`, error);
    throw error; // エラーを再スローして呼び出し元に伝える
  }
}
```

## パフォーマンス測定・最適化

### パフォーマンス測定の基本原則

**測定なくして最適化なし** - すべての最適化は測定に基づいて行ってください。

#### 1. ベンチマーク手法

```TypeScript
// src/utils/benchmark.ts
export class Benchmark {
  private samples: number[] = [];

  async measure<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.samples.push(duration);
      console.log(`[BENCH] ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`[BENCH] ${name}: ${duration.toFixed(2)}ms (FAILED)`);
      throw error;
    }
  }

  getStats(name: string): { avg: number; min: number; max: number; p95: number } {
    if (this.samples.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };

    const sorted = [...this.samples].sort((a, b) => a - b);
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    console.log(`[STATS] ${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms, p95=${p95.toFixed(2)}ms`);
    return { avg, min, max, p95 };
  }
}
```

#### 2. プロファイリング

```TypeScript
// Node.js プロファイリング例
import { performance, PerformanceObserver } from 'node:perf_hooks';

const obs = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });

export async function profiledApiCall(repoName: string) {
  performance.mark('api-start');

  try {
    const data = await fetchRepositoryData(repoName);
    performance.mark('api-end');
    performance.measure('GitHub API Call', 'api-start', 'api-end');

    return data;
  } catch (error) {
    performance.mark('api-error');
    performance.measure('GitHub API Call (Error)', 'api-start', 'api-error');
    throw error;
  }
}
```

#### 3. メモリプロファイリング

```TypeScript
// メモリ使用量監視
export function monitorMemory(operation: string) {
  const initial = process.memoryUsage();

  return {
    end: () => {
      const final = process.memoryUsage();
      const delta = {
        rss: (final.rss - initial.rss) / 1024 / 1024,
        heapTotal: (final.heapTotal - initial.heapTotal) / 1024 / 1024,
        heapUsed: (final.heapUsed - initial.heapUsed) / 1024 / 1024,
        external: (final.external - initial.external) / 1024 / 1024,
      };

      console.log(`[MEMORY] ${operation}:`, {
        'RSS Delta': `${delta.rss.toFixed(2)} MB`,
        'Heap Used Delta': `${delta.heapUsed.toFixed(2)} MB`,
        'Heap Total Delta': `${delta.heapTotal.toFixed(2)} MB`,
      });

      return delta;
    }
  };
}

// 使用例
const memMonitor = monitorMemory('Large Dataset Processing');
await processLargeDataset(data);
memMonitor.end();
```

#### 4. データベースクエリ最適化

```TypeScript
// クエリ実行時間測定
export async function executeWithTiming<T>(
  query: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    if (duration > 100) { // 100ms以上は警告
      console.warn(`[SLOW QUERY] ${duration.toFixed(2)}ms: ${query}`);
    } else {
      console.debug(`[QUERY] ${duration.toFixed(2)}ms: ${query}`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[FAILED QUERY] ${duration.toFixed(2)}ms: ${query}`, error);
    throw error;
  }
}
```

#### 5. 最適化の記録テンプレート

```TypeScript
// AIDEV-PERF: [最適化内容の要約]
// Problem: [問題の説明]
// Solution: [解決方法]
// Before: [改善前の測定値]
// After: [改善後の測定値]
// Improvement: [改善率/効果]
// Date: [実施日]

// AIDEV-PERF: データベース接続プーリング最適化
// Problem: 各リクエストで新しいDB接続を作成していた
// Solution: 接続プールを実装し、接続を再利用
// Before: 平均レスポンス時間 850ms、接続エラー率 3.2%
// After: 平均レスポンス時間 340ms、接続エラー率 0.1%
// Improvement: 60%高速化、99%エラー削減
// Date: 2025-06-27
```

## CLAUDE.md自動更新トリガー

**重要**: 以下の状況でCLAUDE.mdの更新を検討してください：

### 変更ベースのトリガー
- 仕様の追加・変更があった場合
- 新しい依存関係の追加時
- プロジェクト構造の変更
- コーディング規約の更新

### 頻度ベースのトリガー

- **同じ質問が2回以上発生** → 即座にFAQとして追加
- **新しいエラーパターンを2回以上確認** → トラブルシューティングに追加

## トラブルシューティング

### 依存関係のエラー

#### パッケージインストールの問題
```bash
# node_modulesとキャッシュを削除して再インストール
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 特定のパッケージが見つからない場合
npm ls <package-name>  # インストール状況確認
npm install <package-name> --save-dev  # 開発依存関係として追加
```

#### Node.js バージョンの問題
```bash
# 現在のNode.jsバージョン確認
node --version
npm --version

# .nvmrcファイルがある場合
nvm use

# パッケージがサポートするNode.jsバージョンを確認
npm info <package-name> engines
```

### TypeScript関連の問題

#### 型エラーの解決
```bash
# 型チェックの実行
npm run type-check

# 特定ファイルの型チェック
npx tsc --noEmit src/specific-file.ts

# 型定義ファイルが見つからない場合
npm install @types/<package-name> --save-dev
```

#### tsconfig.json設定の確認
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

### データベース関連の問題

#### Drizzleのマイグレーションがうまくいかない
1. **スキーマ定義の確認**
   ```bash
   # スキーマファイルの構文チェック
   npx tsc --noEmit drizzle/schema.ts
   ```

2. **設定ファイルの確認**
   ```bash
   # drizzle.config.tsの設定確認
   cat drizzle.config.ts
   ```

3. **マイグレーション生成とデバッグ**
   ```bash
   # マイグレーションファイル生成（詳細ログ付き）
   npm run db:generate -- --verbose

   # 既存のマイグレーションファイル確認
   ls -la drizzle/migrations/

   # 手動でマイグレーション実行
   npm run db:migrate
   ```

#### SQLite データベースの問題
```bash
# データベースファイルの存在確認
ls -la data/stellar.db

# データベースの権限確認
ls -la data/

# データベースファイルが破損している場合
rm data/stellar.db
npm run db:migrate  # 再作成
```

### GitHub API関連の問題

#### API レートリミット
```TypeScript
// レートリミット情報の確認
const response = await octokit.request('GET /rate_limit');
console.log('Rate limit status:', response.data);

// リクエスト前にレートリミットチェック
if (response.data.rate.remaining < 100) {
  const resetTime = new Date(response.data.rate.reset * 1000);
  console.warn(`Rate limit low. Resets at: ${resetTime}`);
}
```

#### 認証の問題
```bash
# GitHub トークンの環境変数確認
echo $GITHUB_TOKEN

# トークンの有効性確認
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

### テスト関連の問題

#### Vitestの設定問題
```bash
# テスト設定の確認
cat vitest.config.ts

# 特定のテストファイルのみ実行
npm test -- specific-test.test.ts

# デバッグモードでテスト実行
npm test -- --reporter=verbose
```

#### テストが不安定な場合
```TypeScript
// タイムアウトの調整
import { test, expect } from 'vitest';

test('async operation', async () => {
  // タイムアウトを5秒に設定
  const result = await Promise.race([
    someAsyncOperation(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
  ]);

  expect(result).toBeDefined();
});
```

### パフォーマンス問題のデバッグ

#### メモリリークの調査
```bash
# Node.js のメモリ使用量監視
node --inspect --max-old-space-size=4096 src/your-script.js

# プロセス監視
top -p $(pgrep node)
```

#### プロファイリング
```bash
# CPU プロファイリング
node --prof src/your-script.js
node --prof-process isolate-*.log > profile.txt

# ヒープスナップショット
node --inspect-brk=0.0.0.0:9229 src/your-script.js
# Chrome DevTools でヒープスナップショット取得
```

### よくあるエラーメッセージと対処法

#### `MODULE_NOT_FOUND`
```bash
# モジュールが見つからない場合
npm install
# または
npm install <missing-module>
```

#### `Permission denied`
```bash
# ファイル権限の問題
chmod +x <script-file>
# または
sudo chown -R $USER:$USER <directory>
```

#### `EADDRINUSE: address already in use`
```bash
# ポートが使用中の場合、プロセスを確認
lsof -i :3000
# プロセスを終了
kill -9 <PID>
```

### デバッグ支援ツール

#### ログレベルの調整
```bash
# 詳細ログを有効にする
DEBUG=* npm run dev
NODE_ENV=development npm run dev
```

#### 設定の確認コマンド
```bash
# プロジェクト設定の一括確認
echo "=== Node.js Version ===" && node --version
echo "=== NPM Version ===" && npm --version
echo "=== TypeScript Version ===" && npx tsc --version
echo "=== Package Dependencies ===" && npm ls --depth=0
echo "=== Environment Variables ===" && env | grep -E "(NODE_|NPM_|GITHUB_)"
```
