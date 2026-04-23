# E9th Connect - デプロイガイド

このドキュメントでは、E9th Connect を Vercel および Supabase にデプロイするための手順を説明します。

## 1. 環境変数の設定

Vercel のプロジェクト設定（Environment Variables）に以下の変数を追加してください。

### データベース関連 (Supabase / Neon)
- `DATABASE_URL`: PostgreSQL の接続文字列
  - 例: `postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres`

### LINE API 関連
- `LINE_CHANNEL_ID`: LINE Developers で発行されたチャネルID
- `LINE_CHANNEL_SECRET`: LINE Developers で発行されたチャネルシークレット
- `LINE_MESSAGING_API_KEY`: Messaging API のチャネルアクセストークン（長期）
- `VITE_LINE_LIFF_ID`: LIFF アプリの ID

### その他
- `OWNER_OPEN_ID`: 管理者権限を付与するユーザーの OpenID（任意）

---

## 2. データベースのセットアップ

### マイグレーションの実行
Supabase の SQL Editor を開き、プロジェクト内の `drizzle/0000_flowery_cyclops.sql` の内容をコピー＆ペーストして実行してください。これにより、以下のテーブルが作成されます：
- `users` (ユーザー管理)
- `meals` (食事記録)
- `notifications` (通知)
- `health_logs` (体調ログ)
- `conditioning_tasks` (タスク管理)

---

## 3. RLS (Row Level Security) の設定

Supabase でデータの安全性を確保するため、以下の SQL を実行して RLS ポリシーを適用してください。

```sql
-- RLS を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditioning_tasks ENABLE ROW LEVEL SECURITY;

-- ユーザー自身のデータのみアクセス可能にするポリシー (例: health_logs)
CREATE POLICY "Users can manage their own health logs" ON health_logs
  FOR ALL USING (auth.uid()::text = (SELECT "openId" FROM users WHERE id = user_id));

-- トレーナーが担当顧客のデータを見れるようにするポリシー
CREATE POLICY "Trainers can view assigned customer health logs" ON health_logs
  FOR SELECT USING (auth.uid()::text = (SELECT "openId" FROM users WHERE id = (SELECT assigned_trainer_id FROM users WHERE id = health_logs.user_id)));
```

---

## 4. Vercel へのデプロイ

1. GitHub リポジトリにソースコードをプッシュします。
2. Vercel で「New Project」を選択し、リポジトリをインポートします。
3. 上記の環境変数を設定します。
4. 「Deploy」をクリックします。

---

## 5. PWA の確認

デプロイ完了後、スマートフォンで URL にアクセスし、ブラウザのメニューから「ホーム画面に追加」を選択してください。アプリアイコンが表示され、ネイティブアプリのように動作します。
