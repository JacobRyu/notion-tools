# Notion Tools

CLI ツールセット — Notion API を使って page / database の作成、編集、移動、一括操作を行います。

## インストール

```bash
npm install -g @notion-tools/cli
```

またはリポジトリから直接:

```bash
git clone <repo>
cd notion-tools
pnpm install
pnpm build
```

## セットアップ

Notion Integration Token が必要です。

1. [Notion Integrations](https://www.notion.so/profile/integrations) で Internal Integration を作成
2. Token をコピー
3. 以下のいずれかの方法で設定:

```bash
# 環境変数（推奨）
export NOTION_TOKEN=ntn_xxxxxxxxxxxx

# --token オプション
nt --token ntn_xxxxxxxxxxxx page get <id>
```

> **Note:** Integration を操作したい page / database に **接続** (Connect) しておく必要があります。

## 使い方

### Page 操作

```bash
# ページ取得
nt page get <page-id>

# ブロックも含めて取得
nt page get <page-id> --content

# ページ作成
nt page create <parent-id> --title "Hello World"

# プロパティ指定
nt page create <parent-id> \
  --title "Task" \
  --properties '{"status":{"type":"select","select":{"name":"Done"}}}'

# ブロック付き作成
nt page create <parent-id> \
  --title "Doc" \
  --children '[{"type":"paragraph","paragraph":{"rich_text":[{"type":"text","text":{"content":"Hello"}}]}}]'

# 編集
nt page edit <page-id> --properties '{"title":{"type":"title","title":[{"type":"text","text":{"content":"New Title"}}]}}'

# ブロック追加
nt page edit <page-id> --append-children '[{"type":"paragraph","paragraph":{"rich_text":[{"type":"text","text":{"content":"Appended"}}]}}]'

# 移動
nt page move <page-id> <new-parent-id>

# 削除（アーカイブ）
nt page delete <page-id>

# 一覧
nt page list --parent-id <parent-id>
```

### Database 操作

```bash
# 取得
nt db get <db-id>

# 作成
nt db create <parent-id> \
  --title "My DB" \
  --properties '{"Name":{"type":"title"},"Status":{"type":"select","select":{"options":[{"name":"To Do"},{"name":"Done"}]}}}'

# 編集
nt db edit <db-id> --title "Renamed"

# クエリ
nt db query <db-id> \
  --filter '{"property":"Status","select":{"equals":"Done"}}' \
  --sort '[{"property":"Name","direction":"ascending"}]' \
  --limit 10

# 一覧
nt db list

# 親フィルター付き一覧
nt db list --parent-id <page-id>

# 移動（コピー＋手動削除）
nt db move <db-id> <new-parent-id>
```

### 一括作成

```bash
# JSON ファイルから一括作成
nt batch create pages.json --parent-id <parent-id>

# YAML ファイルから
nt batch create pages.yaml --parent-id <parent-id>

# テンプレート変数
nt batch create pages.json --parent-id <parent-id> --var project=Alpha

# エラーから再開
nt batch create pages.json --parent-id <parent-id> --resume

# 並列数指定（デフォルト 3）
nt batch create pages.json --parent-id <parent-id> --concurrency 5
```

入力ファイル形式:

```json
[
  {
    "title": "Page 1",
    "properties": {
      "status": { "type": "select", "select": { "name": "Done" } }
    }
  }
]
```

```yaml
- title: "Page {{project}}"
  properties:
    status:
      type: select
      select:
        name: "In Progress"
```

## 共通オプション

| オプション | 説明 |
|-----------|------|
| `--token <token>` | Notion API token |
| `--json` | JSON 形式で出力 |
| `-h, --help` | ヘルプ表示 |

## 開発

```bash
pnpm install
pnpm build        # ビルド
pnpm test         # テスト
pnpm lint         # リント
pnpm typecheck    # 型チェック
```
