# E9th Connect 実装サマリー（最新版）

**最終更新:** 2026年4月20日  
**バージョン:** 2.1  
**ステータス:** 実装進行中（Phase 3）

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [公開方針とコミュニケーション設計](#公開方針とコミュニケーション設計)
3. [実装済み機能](#実装済み機能)
4. [進行中の実装](#進行中の実装)
5. [今後の実装予定](#今後の実装予定)
6. [技術スタック](#技術スタック)
7. [デプロイ情報](#デプロイ情報)

---

## プロジェクト概要

**E9th Connect** は、個人ジムにおけるトレーナーと顧客の連携を強化するための SaaS プラットフォームです。

### 主な機能

- 🍽️ **食事記録・管理**：AI による自動栄養計算
- 📊 **進捗追跡**：PFC 目標管理、体調ログ
- ✅ **タスク管理**：コンディショニング・タスクの割り当てと完了チェック
- 📱 **PWA 対応**：スマートフォンのホーム画面から利用可能
- 🔐 **セキュリティ**：RLS によるデータ分離

---

## 公開方針とコミュニケーション設計

### コミュニケーション設計の変更（Ver 2.1）

アプリの役割を明確化し、コミュニケーションを公式LINEに集約する方針に変更しました。

- **アプリの役割**: 食事記録、体調ログ、タスク管理（完了チェック）に特化。
- **公式LINEの役割**: 実際の会話、指導、相談の場。
- **変更点**:
  - アプリ内チャット・メッセージ機能を完全に削除。
  - UIから「Consult Trainer」ボタンやチャットアイコンを削除し、記録画面を広くクリーンに。
  - **通知機能は維持**: 顧客が食事を記録した際、担当トレーナーに通知が飛ぶ仕組みは継続し、トレーナーは通知を見てアプリで内容を確認後、公式LINEでフィードバックを行う運用とします。

### 採用プラットフォーム

| 項目 | 選択 | 理由 |
|------|------|------|
| **フロントエンド/API** | Vercel (Hobby Plan) | 無料枠、即時デプロイ、自動スケーリング |
| **データベース** | Supabase (Free Tier) | PostgreSQL、RLS対応、無料枠充実 |
| **ストレージ** | Supabase Storage | 統合管理、無料枠内で運用 |
| **配布形態** | PWA (Web App) | App Store/Google Play 審査不要、即時更新 |

### PWA 対応

- ✅ `manifest.json` 設定完了
- ✅ Service Worker 登録完了
- ✅ ホーム画面追加対応
- ✅ アイコン設定（192x192px, 512x512px）
- ✅ オフライン対応（IndexedDB キャッシュ）

---

## 実装済み機能

### ✅ Phase 1: RLS 設定と担当トレーナー通知機能

#### 1.1 通知システムの基盤
- **ファイル:** `server/notification.ts`
- **機能:**
  - トレーナーへの食事記録通知（維持）
  - 顧客へのタスク割り当て通知
  - 通知一覧取得・既読マーク

#### 1.2 食事記録時の自動通知
- **実装:** `server/routers/customer.ts` の `recordMeal` メソッド
- **フロー:** 顧客が食事記録 → 担当トレーナーに自動通知
- **データベース:** `notifications` テーブルに記録

#### 1.3 データベーススキーマの拡張
- **新規テーブル:**
  - `notifications`：通知管理
  - `health_logs`：体調ログ
  - `conditioning_tasks`：コンディショニング・タスク
- **削除テーブル:**
  - `chats`：チャット機能削除に伴い削除

### ✅ Phase 2: 体調ログ機能とコンディショニング・タスク機能

#### 2.1 体調ログ機能（Health Router）
- **ファイル:** `server/routers/health.ts`
- **API エンドポイント:**
  - `health.getTodayHealthLog`：本日の体調ログ取得
  - `health.getHealthLogsByDateRange`：期間指定で体調ログ取得
  - `health.recordHealthLog`：体調ログ記録・更新
  - `health.deleteHealthLog`：体調ログ削除

- **入力項目:**
  - 疲労度：Good / Normal / Bad
  - むくみ：有無
  - 睡眠時間：数値
  - メモ：テキスト

#### 2.2 コンディショニング・タスク機能（Conditioning Router）
- **ファイル:** `server/routers/conditioning.ts`
- **API エンドポイント:**
  - `conditioning.getAssignedTasks`：割り当てられたタスク一覧
  - `conditioning.getIncompleteTasks`：未完了タスク一覧
  - `conditioning.completeTask`：タスク完了マーク
  - `conditioning.assignTask`：トレーナーがタスク割り当て
  - `conditioning.getCustomerTasks`：顧客のタスク一覧（トレーナー用）
  - `conditioning.updateTask`：タスク更新
  - `conditioning.deleteTask`：タスク削除

- **機能:**
  - トレーナーが顧客にストレッチなどのタスクを割り当て
  - 顧客がタスク完了をチェックマーク
  - 動画リンク付きタスク対応
  - 期限設定機能

### ✅ PWA 対応

- **manifest.json**：アプリ設定（名前、アイコン、テーマカラー）
- **Service Worker**：キャッシング、オフライン対応
- **PWA 初期化モジュール**：`client/src/lib/pwa.ts`
  - Service Worker 登録
  - インストールプロンプト管理
  - オンライン/オフライン監視
  - IndexedDB オフラインデータ保存

### ✅ PostgreSQL への移行

- **ドライバー:** `drizzle-orm/postgres-js`
- **接続:** `postgres://` URL対応
- **マイグレーション:** Drizzle Kit で自動生成
- **型修正:** MySQL から PostgreSQL への型変換完了

---

## 進行中の実装

### 🔄 Phase 3: LINE API 連携

#### 3.1 LINE ログイン機能（設計完了）
- **ドキュメント:** `LINE_INTEGRATION_DESIGN.md`
- **実装予定:**
  - LIFF（LINE Front-end Framework）統合
  - LINE アカウントでのログイン
  - ユーザー情報の自動取得

#### 3.2 LINE Messaging API による通知（設計完了）
- **実装予定:**
  - トレーナーへの LINE 通知
  - 顧客への LINE 通知
  - リッチメッセージ対応

### 🔒 RLS（Row Level Security）設計完了

- **ドキュメント:** `RLS_SECURITY_DESIGN.md`
- **実装予定:**
  - Supabase での RLS ポリシー設定
  - テーブルごとのアクセス制御
  - セキュリティ監査ログ

---

## 今後の実装予定

### Phase 4: 最終確認と本番化

1. **フロントエンド UI 実装**
   - 体調ログ入力フォーム
   - コンディショニング・タスク表示
   - LINE ログインボタン

2. **環境変数設定**
   - Vercel への環境変数登録
   - Supabase 接続情報設定
   - LINE API キー設定

3. **Supabase RLS ポリシー適用**
   - SQL スクリプト実行
   - アクセステスト

4. **本番デプロイ**
   - Vercel へのデプロイ
   - Supabase データベース初期化
   - ドメイン設定

---

## 技術スタック

### フロントエンド

| 技術 | 用途 |
|------|------|
| **Vite** | ビルドツール |
| **React** | UI フレームワーク |
| **TypeScript** | 型安全性 |
| **TailwindCSS** | スタイリング |
| **tRPC** | API 通信 |

### バックエンド

| 技術 | 用途 |
|------|------|
| **Node.js** | ランタイム |
| **Express** | Web フレームワーク |
| **tRPC** | RPC フレームワーク |
| **Drizzle ORM** | ORM |
| **PostgreSQL** | データベース |

### インフラ

| サービス | 用途 |
|---------|------|
| **Vercel** | ホスティング |
| **Supabase** | PostgreSQL + Auth + Storage |
| **LINE API** | ログイン・通知 |

---

## デプロイ情報

### 環境変数（必須）

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
DATABASE_URL=postgresql://xxx:xxx@xxx.supabase.co:5432/postgres

# LINE API（今後）
LINE_CHANNEL_ID=xxx
LINE_CHANNEL_SECRET=xxx
LINE_MESSAGING_API_KEY=xxx
VITE_LINE_LIFF_ID=xxx

# その他
OWNER_OPEN_ID=xxx
```

### デプロイ手順

1. **Vercel へのデプロイ**
   ```bash
   vercel deploy --prod
   ```

2. **Supabase データベース初期化**
   ```bash
   # マイグレーション SQL を実行
   psql $DATABASE_URL < drizzle/0000_flowery_cyclops.sql
   ```

3. **RLS ポリシー適用**
   ```bash
   # RLS_SECURITY_DESIGN.md の SQL を実行
   ```

---

## 優先順位と進捗

| 優先度 | 機能 | ステータス | 備考 |
|--------|------|-----------|------|
| 🔴 高 | RLS 設定 | 🔄 設計完了 | Supabase で実装予定 |
| 🔴 高 | トレーナー通知 | ✅ 実装完了 | システム内通知 |
| 🟠 中 | LINE ログイン | 🔄 設計完了 | 実装予定 |
| 🟠 中 | LINE 通知 | 🔄 設計完了 | 実装予定 |
| 🟡 低 | 体調ログ | ✅ 実装完了 | UI 実装待ち |
| 🟡 低 | タスク機能 | ✅ 実装完了 | UI 実装待ち |

---

## 次のステップ

1. **フロントエンド UI 実装**
   - 体調ログ入力フォーム
   - タスク表示・完了機能
   - LINE ログインボタン

2. **LINE API 統合**
   - LINE SDK インストール
   - ログイン機能実装
   - 通知機能実装

3. **RLS ポリシー適用**
   - Supabase コンソールで SQL 実行
   - アクセステスト

4. **本番デプロイ**
   - Vercel へのデプロイ
   - Supabase 初期化
   - ドメイン設定

---

**作成日:** 2026年4月20日  
**最終更新:** 2026年4月20日
