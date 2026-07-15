# Notion Tools — Implementation Plan

## Executive Summary

CLI 工具集，基于 Notion Official API + TypeScript，提供 page/database の CRUD、移動、批量操作。
Monorepo（pnpm workspace）構成、Commander.js + `@notionhq/client` で構築。5 つの Milestone で段階的交付。

## 技術選定

| 領域 | 選定 | 理由 |
|------|------|------|
| 言語 | TypeScript | 公式 SDK あり、エコシステム豊富、型安全 |
| ランタイム | Node.js 18+ LTS | 安定・広範な互換性 |
| パッケージ管理 | pnpm workspace | 高速・monorepo 標準 |
| CLI フレームワーク | Commander.js | 最も普及、プラグイン不要で十分 |
| Notion SDK | `@notionhq/client` | Notion 公式メンテナンス |
| テスト | Vitest | Vite エコシステム、高速 |
| バリデーション | zod | Notion property スキーマに最適 |
| 出力 | `chalk` + `@clack/core` | 色付け・人間可読＋JSON 両対応 |

## Requirement Analysis Snapshot

- **Goals**
  - Notion Token 認証で自 Workspace を操作
  - Page/Database の作成・編集・読み取り・移動
  - 複数 Page の一括作成
  - 純 CLI、スクリプト・CI/CD に組み込み可能

- **Constraints**
  - Notion Official API のみ（Internal API 不使用）
  - Rate limit: 3 req/sec per integration, burst 90/min
  - Database の移動は API 非対応
  - ファイルアップロード不可（API 制限）

- **Assumptions**
  - Token は `NOTION_TOKEN` 環境変数 or `--token` 引数
  - 出力は `--json` フラグで JSON にも対応
  - 対話モードは実装しない

## Milestones

| # | Milestone | 主要交付物 | 想定工数 |
|---|-----------|-----------|---------|
| M1 | プロジェクト scaffold +  core クライアント | monorepo 構造、`@notion-tools/core`、ConfigManager、型定義 | 2日 |
| M2 | Page 操作コマンド | `page get/create/edit/move/delete/list` | 3日 |
| M3 | Database 操作コマンド | `db get/create/edit/query/list/move` | 3日 |
| M4 | バッチ操作 | `batch create`、進捗表示、エラー復帰 | 2日 |
| M5 | ドキュメント・リリース | README、CHANGELOG、npm publish CI | 1日 |

## Detailed Tasks

### M1 — プロジェクト scaffold & core クライアント

- [ ] `pnpm init` monorepo、`packages/core` `packages/cli` 構成
- [ ] `packages/core` で `@notionhq/client` ラッパー（エラーハンドリング、rate-limit 退避、ログ）
- [ ] ConfigManager — `NOTION_TOKEN` env / `--token` flag / `.env`
- [ ] CLI エントリポイント — `commander` ルートコマンド、`--version` `--json` global flag
- [ ] Notion 型定義 — `zod` schema で property types を網羅
- [ ] Vitest セットアップ、core ユニットテスト
- [ ] ESLint + Prettier（`@notion-tools/eslint-config`）

### M2 — Page 操作コマンド

- [ ] `page get <id>` — page プロパティ + blocks（`--content`）
- [ ] `page create <parent-id>` — `--title`、`--properties <json>`、`--children <json>`
- [ ] `page edit <id>` — properties 更新、children append
- [ ] `page move <id> <new-parent>` — parent 書き換え
- [ ] `page delete <id>` — archived=true
- [ ] `page list <parent-type> <parent-id>` — 子ページ一覧

### M3 — Database 操作コマンド

- [ ] `db get <id>` — metadata + properties schema
- [ ] `db create <parent-id>` — `--title`、`--properties <json>`
-  [ ] `db edit <id>` — title / description / properties 更新
- [ ] `db query <id>` — `--filter` `--sort` `--limit`
- [ ] `db list <parent-id>` — 子 database 一覧
- [ ] `db move <id> <new-parent>` — copy + delete で代替（API 制限のため）

### M4 — バッチ操作

- [ ] `batch create <file>` — JSON/CSV/YAML 入力、テンプレート変数置換
- [ ] 進捗表示（`@clack/spinner`）、成功/失敗サマリ
- [ ] エラー復帰 — 失敗行を `<input>.errors.json` に書き出し、`--resume` 対応
- [ ] Rate-limit 制御 — token bucket、最大 3 req/s

### M5 — ドキュメント & リリース

- [ ] README（インストール・設定・コマンドリファレンス・例）
- [ ] CHANGELOG（Keep a Changelog）
- [ ] GitHub Actions — lint / test / build / publish
- [ ] npm publish

## Risks and Mitigations

| リスク | 確率 | 影響 | 緩和策 |
|--------|------|------|--------|
| Rate limit (429) | 高 | 中 | Token bucket + exponential backoff |
| Notion API フィールド変更 | 低 | 高 | 型定義を一元管理、CI で定期 E2E |
| バッチ中途半端失敗 | 中 | 高 | `--resume` + エラーファイル出力、べき等設計 |
| Token 漏洩 | 低 | 高 | `.env` + `.gitignore` 推奨、ドキュメントで注意喚起 |
| Database move 非対応 | 高 | 中 | ドキュメントで制限明示、代替手順を提示 |

## Success Metrics

- CLI カバレッジ: Notion API page/db 操作の 90% 以上
- バッチ成功率: 99% 以上（API 明確拒否を除く）
- テストカバレッジ（core）: ≥ 85%
- 初回体験: `npm install` → 初回成功まで 5 ステップ以内
- エラー品質: 全エラーに actionable な修正ヒント

## Validation Strategy

- **単体テスト**: Vitest、全 command handler を mock SDK で網羅
- **統合テスト**: 専用 test workspace + test token で実 API 呼び出し（CI では skip、`--e2e` で実行）
- **E2E テスト**: create → edit → query → move → delete フロー
- **スキーマ検証**: zod で JSON 入力をランタイムバリデーション
- **Dry-run**: `--dry-run` で API コールせず検証

## Quality Rubric Scores (Final)

| カテゴリ | スコア | 理由 |
|----------|--------|------|
| Completeness | 5/5 | 全 page/db 操作＋バッチを網羅 |
| Feasibility | 5/5 | 全タスクが公式 SDK + 成熟ライブラリで実現可能 |
| Risk Coverage | 4/5 | Database move の回避策はドキュメントのみで未実証 |
| Testability | 5/5 | Unit + Integration + E2E + Dry-run の多層テスト |
| Maintainability | 5/5 | Monorepo 層分離、型・zod schema 一元管理 |

## Refinement Notes

初版から以下を改善:
- バッチ操作のエラー復帰機構 (`--resume`、エラーファイル) を追加
- Database move の API 制限を明記し、copy + delete 代替案を提示
- 出力形式の二面性（human-readable + `--json`）を確立
- Zod によるランタイムバリデーションを導入し、エラー耐性を向上
