# Row Level Security (RLS) 設計書

## 概要

E9th Connect アプリでは、Supabase の Row Level Security (RLS) を使用して、顧客間のデータを完全に分離し、セキュリティを確保します。

---

## 1. RLS の基本概念

### 1.1 RLS とは

Row Level Security は、PostgreSQL のセキュリティ機能で、データベースレベルでユーザーごとにアクセス可能な行を制限します。

### 1.2 利点

- **データベースレベルのセキュリティ**：アプリケーション層のバグでもデータ漏洩を防止
- **パフォーマンス**：フィルタリングがデータベース側で行われる
- **監査**：すべてのアクセスがログに記録される

---

## 2. RLS ポリシーの設計

### 2.1 ユーザーテーブル

**ポリシー：** ユーザーは自分の情報のみアクセス可能

```sql
-- RLS を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー：自分のレコードのみ取得
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (auth.uid()::text = openId);

-- UPDATE ポリシー：自分のレコードのみ更新
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (auth.uid()::text = openId)
  WITH CHECK (auth.uid()::text = openId);

-- DELETE ポリシー：自分のレコードのみ削除
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  USING (auth.uid()::text = openId);

-- INSERT ポリシー：新規ユーザーのみ作成可能
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = openId);
```

### 2.2 食事ログテーブル（meals）

**ポリシー：** 顧客は自分の食事ログのみ、トレーナーは担当顧客の食事ログのみアクセス可能

```sql
-- RLS を有効化
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー：顧客は自分の、トレーナーは担当顧客のログを取得
CREATE POLICY meals_select_policy ON meals
  FOR SELECT
  USING (
    -- 自分のログ、または
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    OR
    -- 自分が担当するトレーナーの場合
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = meals.user_id
      AND users.assigned_trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    )
  );

-- INSERT ポリシー：顧客は自分のログのみ作成
CREATE POLICY meals_insert_policy ON meals
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );

-- UPDATE ポリシー：顧客は自分の、トレーナーは担当顧客のログを更新
CREATE POLICY meals_update_policy ON meals
  FOR UPDATE
  USING (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = meals.user_id
      AND users.assigned_trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    )
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = meals.user_id
      AND users.assigned_trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    )
  );

-- DELETE ポリシー：顧客は自分の、トレーナーは担当顧客のログを削除
CREATE POLICY meals_delete_policy ON meals
  FOR DELETE
  USING (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = meals.user_id
      AND users.assigned_trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    )
  );
```

### 2.3 通知テーブル（notifications）

**ポリシー：** ユーザーは自分宛の通知のみアクセス可能

```sql
-- RLS を有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー：自分宛の通知のみ取得
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT
  USING (
    recipient_user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );

-- UPDATE ポリシー：自分宛の通知のみ更新（既読マーク等）
CREATE POLICY notifications_update_policy ON notifications
  FOR UPDATE
  USING (
    recipient_user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  )
  WITH CHECK (
    recipient_user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );

-- DELETE ポリシー：自分宛の通知のみ削除
CREATE POLICY notifications_delete_policy ON notifications
  FOR DELETE
  USING (
    recipient_user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );

-- INSERT ポリシー：システムのみが通知を作成（アプリケーション側で制御）
CREATE POLICY notifications_insert_policy ON notifications
  FOR INSERT
  WITH CHECK (true); -- サーバー側でのみ実行
```

### 2.4 体調ログテーブル（health_logs）

**ポリシー：** 顧客は自分の、トレーナーは担当顧客の体調ログのみアクセス可能

```sql
-- RLS を有効化
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー
CREATE POLICY health_logs_select_policy ON health_logs
  FOR SELECT
  USING (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = health_logs.user_id
      AND users.assigned_trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    )
  );

-- INSERT ポリシー
CREATE POLICY health_logs_insert_policy ON health_logs
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );

-- UPDATE ポリシー
CREATE POLICY health_logs_update_policy ON health_logs
  FOR UPDATE
  USING (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );

-- DELETE ポリシー
CREATE POLICY health_logs_delete_policy ON health_logs
  FOR DELETE
  USING (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );
```

### 2.5 コンディショニング・タスクテーブル（conditioning_tasks）

**ポリシー：** 顧客は自分に割り当てられたタスク、トレーナーは自分が割り当てたタスクのみアクセス可能

```sql
-- RLS を有効化
ALTER TABLE conditioning_tasks ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー
CREATE POLICY conditioning_tasks_select_policy ON conditioning_tasks
  FOR SELECT
  USING (
    user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    OR
    trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );

-- INSERT ポリシー：トレーナーのみがタスクを作成
CREATE POLICY conditioning_tasks_insert_policy ON conditioning_tasks
  FOR INSERT
  WITH CHECK (
    trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );

-- UPDATE ポリシー
CREATE POLICY conditioning_tasks_update_policy ON conditioning_tasks
  FOR UPDATE
  USING (
    trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    OR
    (
      user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
      AND is_completed = false
    )
  )
  WITH CHECK (
    trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
    OR
    (
      user_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
      AND is_completed = false
    )
  );

-- DELETE ポリシー：トレーナーのみが削除
CREATE POLICY conditioning_tasks_delete_policy ON conditioning_tasks
  FOR DELETE
  USING (
    trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text)
  );
```

---

## 3. RLS の有効化手順（Supabase）

### 3.1 Supabase コンソールでの設定

1. Supabase ダッシュボードにログイン
2. プロジェクトを選択
3. **SQL Editor** に移動
4. 上記の SQL ポリシーを実行

### 3.2 アプリケーション側の設定

Supabase クライアントは、ユーザーの認証情報を自動的に使用します。

```typescript
// server/db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

// RLS ポリシーを適用したクエリ
export async function getMeals(userId: string) {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}
```

---

## 4. RLS のテスト

### 4.1 テストシナリオ

#### シナリオ 1：顧客が他の顧客のデータにアクセス

```sql
-- 顧客 A のセッションで
SELECT * FROM meals WHERE user_id = (SELECT id FROM users WHERE name = '顧客 B');
-- 結果：0 行（アクセス拒否）
```

#### シナリオ 2：トレーナーが担当顧客のデータにアクセス

```sql
-- トレーナーのセッションで
SELECT * FROM meals WHERE user_id = (SELECT id FROM users WHERE assigned_trainer_id = (SELECT id FROM users WHERE openId = auth.uid()::text));
-- 結果：担当顧客のデータのみ表示
```

#### シナリオ 3：トレーナーが担当していない顧客のデータにアクセス

```sql
-- トレーナーのセッションで
SELECT * FROM meals WHERE user_id = (SELECT id FROM users WHERE name = '未担当顧客');
-- 結果：0 行（アクセス拒否）
```

---

## 5. パフォーマンス最適化

### 5.1 インデックスの追加

```sql
-- user_id に対するインデックス
CREATE INDEX meals_user_id_idx ON meals(user_id);
CREATE INDEX health_logs_user_id_idx ON health_logs(user_id);
CREATE INDEX conditioning_tasks_user_id_idx ON conditioning_tasks(user_id);
CREATE INDEX conditioning_tasks_trainer_id_idx ON conditioning_tasks(trainer_id);

-- assigned_trainer_id に対するインデックス
CREATE INDEX users_assigned_trainer_id_idx ON users(assigned_trainer_id);

-- recipient_user_id に対するインデックス
CREATE INDEX notifications_recipient_user_id_idx ON notifications(recipient_user_id);
```

### 5.2 クエリの最適化

RLS ポリシーが複雑な場合、クエリが遅くなる可能性があります。以下の対策を検討してください：

- **ビューの使用**：複雑なポリシーをビューで実装
- **マテリアライズドビュー**：頻繁にアクセスされるデータをキャッシュ
- **キャッシング**：アプリケーション層でキャッシュを使用

---

## 6. セキュリティベストプラクティス

### 6.1 ポリシーの原則

- **最小権限の原則**：必要最小限のアクセス権のみを付与
- **明示的な許可**：デフォルトは拒否、明示的に許可
- **定期的な監査**：ポリシーの見直しと監査

### 6.2 監査ログの有効化

```sql
-- 監査ログを有効化（Supabase では自動的に有効）
-- すべてのアクセスが記録されます
```

### 6.3 管理者アカウント

```sql
-- 管理者は RLS をバイパス可能（慎重に使用）
-- Supabase では、サービスロールキーを使用して RLS をバイパス可能
```

---

## 7. トラブルシューティング

### 7.1 「Permission denied」エラー

- RLS ポリシーが正しく設定されているか確認
- ユーザーの認証情報が正しく渡されているか確認
- ポリシーのロジックを見直す

### 7.2 パフォーマンス低下

- インデックスが正しく設定されているか確認
- ポリシーのロジックが複雑すぎないか確認
- クエリプランを確認（`EXPLAIN ANALYZE`）

---

## 参考資料

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
