# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-15

### Added

- `plan.md` — 実装計画ドキュメント
- `page get` — Notion page のプロパティ・ブロック取得
- `page create` — 新規 page 作成（title, properties, children）
- `page edit` — page のプロパティ更新・ブロック追加
- `page move` — page の親変更による移動
- `page delete` — page のアーカイブ削除
- `page list` — 親配下の page 一覧
- `db get` — database のメタデータ・プロパティスキーマ取得
- `db create` — 新規 database 作成（title, properties schema）
- `db edit` — database の title / description / properties 更新
- `db query` — database のフィルター・ソート・ページネーション付き検索
- `db list` — integration がアクセス可能な全 database 一覧
- `db move` — database のコピーによる移動（API 制限の代替）
- `batch create` — JSON / YAML ファイルからの一括 page 作成
- `--resume` — バッチ処理エラーからの再開
- `--var` — batch テンプレート変数置換（`{{var}}`）
- `--concurrency` — バッチ並列リクエスト数制御
- TokenBucket Rate-limiter — Notion API レート制限対応
- `--json` — 全コマンドで JSON 出力対応
- ESLint + Prettier + Vitest 開発基盤
- GitHub Actions CI（lint / typecheck / test / build / publish）
