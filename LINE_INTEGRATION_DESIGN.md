# LINE API 連携設計書

## 概要

E9th Connect アプリに LINE API を統合し、以下の機能を実装します：

1. **LINE ログイン機能**：ユーザーが LINE アカウントで簡単にログイン
2. **LINE Messaging API による通知**：トレーナーと顧客が LINE で通知を受け取る

---

## 1. LINE ログイン機能

### 1.1 実装概要

LINE ログインを既存の認証フローに統合し、ユーザーが LINE アカウントで登録・ログインできるようにします。

### 1.2 フロー

```
[ユーザー] 
    ↓
[LINE ログインボタン]
    ↓
[LINE プラットフォーム（認可画面）]
    ↓
[認可コード取得]
    ↓
[バックエンド: 認可コードを ID トークンに交換]
    ↓
[LINE ユーザー情報取得]
    ↓
[ユーザーをデータベースに登録/更新]
    ↓
[セッションクッキー発行]
    ↓
[ログイン完了]
```

### 1.3 必要な環境変数

```
LINE_CHANNEL_ID=<LINE Channel ID>
LINE_CHANNEL_SECRET=<LINE Channel Secret>
LINE_MESSAGING_API_KEY=<LINE Messaging API Key>
```

### 1.4 実装ステップ

#### Step 1: LINE SDK のインストール

```bash
pnpm add @line/bot-sdk
```

#### Step 2: フロントエンド（LINE ログインボタン）

```typescript
// client/src/pages/Login.tsx
import { useEffect } from 'react';

export function Login() {
  useEffect(() => {
    // LINE SDK を動的にロード
    const script = document.createElement('script');
    script.src = 'https://d.line-scdn.net/liff/edge/2/sdk.js';
    document.body.appendChild(script);

    script.onload = () => {
      window.liff.init({
        liffId: import.meta.env.VITE_LINE_LIFF_ID,
      });
    };
  }, []);

  const handleLineLogin = async () => {
    if (!window.liff.isLoggedIn()) {
      window.liff.login();
    } else {
      const idToken = window.liff.getIDToken();
      // バックエンドに ID トークンを送信
      const response = await fetch('/api/auth/line-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      // レスポンス処理...
    }
  };

  return (
    <button onClick={handleLineLogin}>
      LINE でログイン
    </button>
  );
}
```

#### Step 3: バックエンド（LINE ログイン処理）

```typescript
// server/routers/auth.ts
import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { verify } from 'jsonwebtoken';
import { upsertUser } from '../db';

export const authRouter = router({
  lineLogin: publicProcedure.input(
    z.object({
      idToken: z.string(),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      // ID トークンを検証
      const decoded = verify(input.idToken, process.env.LINE_CHANNEL_SECRET!);
      
      const lineUserId = (decoded as any).sub;
      const lineUserName = (decoded as any).name;
      const lineUserEmail = (decoded as any).email;

      // ユーザーをデータベースに登録/更新
      await upsertUser({
        openId: lineUserId,
        name: lineUserName,
        email: lineUserEmail,
        loginMethod: 'line',
      });

      // セッション設定...
      return { success: true };
    } catch (error) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
  }),
});
```

---

## 2. LINE Messaging API による通知

### 2.1 実装概要

トレーナーと顧客が LINE で通知を受け取るために、LINE Messaging API を使用します。

### 2.2 フロー

```
[E9th Connect イベント（食事記録、タスク割り当て等）]
    ↓
[通知ロジック実行]
    ↓
[ユーザーの LINE User ID を取得]
    ↓
[LINE Messaging API に通知送信]
    ↓
[ユーザーの LINE で通知受信]
```

### 2.3 実装ステップ

#### Step 1: ユーザーテーブルに LINE User ID カラムを追加

```sql
ALTER TABLE users ADD COLUMN line_user_id VARCHAR(255) UNIQUE;
```

#### Step 2: 通知ロジックの実装

```typescript
// server/notification.ts
import { Client } from '@line/bot-sdk';

const lineClient = new Client({
  channelAccessToken: process.env.LINE_MESSAGING_API_KEY!,
});

/**
 * LINE で通知を送信
 */
async function sendLineNotification(
  lineUserId: string,
  title: string,
  message: string
): Promise<void> {
  try {
    await lineClient.pushMessage(lineUserId, {
      type: 'text',
      text: `【${title}】\n${message}`,
    });
    console.log(`[LINE Notification] Sent to ${lineUserId}`);
  } catch (error) {
    console.error('Failed to send LINE notification:', error);
  }
}

/**
 * トレーナーに食事記録通知を送信（LINE）
 */
export async function notifyTrainerMealRecordedViaLine(
  trainer_id: number,
  customer_name: string,
  meal_time_category: string,
  total_calories: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const trainer = await db
      .select()
      .from(users)
      .where(eq(users.id, trainer_id))
      .limit(1);

    if (!trainer || !trainer[0].line_user_id) return;

    const title = `${meal_time_category}の記録`;
    const message = `${customer_name}が${meal_time_category}を記録しました（${total_calories}kcal）`;

    await sendLineNotification(trainer[0].line_user_id, title, message);
  } catch (error) {
    console.error('Error sending LINE notification:', error);
  }
}
```

#### Step 3: 既存の通知ロジックに LINE 通知を統合

```typescript
// server/notification.ts
export async function notifyTrainerMealRecorded(
  customer_id: number,
  meal_id: number,
  meal_time_category: string,
  total_calories: number
): Promise<void> {
  // ... 既存のシステム内通知ロジック ...

  // LINE 通知も送信
  const customer = await db
    .select()
    .from(users)
    .where(eq(users.id, customer_id))
    .limit(1);

  if (customer && customer[0].assigned_trainer_id) {
    await notifyTrainerMealRecordedViaLine(
      customer[0].assigned_trainer_id,
      customer[0].name || '顧客',
      meal_time_category,
      total_calories
    );
  }
}
```

---

## 3. LINE ログインフロー（LIFF）の設定

### 3.1 LIFF とは

LIFF（LINE Front-end Framework）は、LINE アプリ内でウェブアプリを実行するためのフレームワークです。

### 3.2 環境変数

```
VITE_LINE_LIFF_ID=<LIFF ID>
```

### 3.3 フロントエンド実装

```typescript
// client/src/lib/line.ts
export async function initLIFF(): Promise<void> {
  const liffId = import.meta.env.VITE_LINE_LIFF_ID;
  
  if (!liffId) {
    console.warn('LIFF ID not configured');
    return;
  }

  try {
    await window.liff.init({ liffId });
    console.log('[LIFF] Initialized');
  } catch (error) {
    console.error('[LIFF] Failed to initialize:', error);
  }
}

export function isLineApp(): boolean {
  return window.liff?.isInClient() ?? false;
}

export function getLineUserProfile(): Promise<any> {
  return window.liff.getProfile();
}
```

---

## 4. セキュリティ考慮事項

### 4.1 ID トークン検証

- LINE から発行された ID トークンは、必ず署名を検証してください
- `jsonwebtoken` ライブラリを使用して検証

### 4.2 LINE User ID の安全な保存

- LINE User ID は、ユーザーテーブルに UNIQUE 制約付きで保存
- 個人情報（名前、メールアドレス）は LINE から取得した情報を使用

### 4.3 環境変数の管理

- `LINE_CHANNEL_SECRET` と `LINE_MESSAGING_API_KEY` は、絶対に公開しないこと
- `.env.local` ファイルに保存し、Git にコミットしない

---

## 5. テスト方法

### 5.1 LINE ログインのテスト

1. LINE Developers コンソールで LIFF を設定
2. ローカル環境で `http://localhost:5173` にアクセス
3. LINE ログインボタンをクリック
4. LINE の認可画面で承認
5. ログイン完了を確認

### 5.2 LINE 通知のテスト

1. LINE Messaging API の設定を確認
2. テスト用の LINE アカウントで通知を送信
3. 実際に LINE で通知が受け取れることを確認

---

## 6. 今後の拡張

- **リッチメニュー**：LINE 上でメニューを表示
- **リッチメッセージ**：画像やボタン付きの通知
- **LINE Pay 連携**：支払い機能の統合
- **LINE 公式アカウント**：ビジネスアカウントとしての運用

---

## 参考資料

- [LINE Developers](https://developers.line.biz/)
- [LINE ログイン](https://developers.line.biz/ja/services/line-login/)
- [LINE Messaging API](https://developers.line.biz/ja/services/messaging-api/)
- [LIFF](https://developers.line.biz/ja/services/liff/)
