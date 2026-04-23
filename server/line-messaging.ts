/**
 * LINE Messaging API 統合
 * 
 * LINE を通じてユーザーに通知を送信するための機能を提供します。
 */

/**
 * LINE Messaging API クライアント
 * 
 * 本番環境では、@line/bot-sdk をインストールして使用してください：
 * pnpm add @line/bot-sdk
 */

interface LineMessage {
  type: 'text' | 'image' | 'template';
  text?: string;
  altText?: string;
  template?: any;
}

/**
 * LINE で通知を送信
 * 
 * @param lineUserId - LINE ユーザーID
 * @param message - 送信するメッセージ
 */
export async function sendLineMessage(
  lineUserId: string,
  message: LineMessage
): Promise<void> {
  try {
    const accessToken = process.env.LINE_MESSAGING_API_KEY;
    if (!accessToken) {
      console.warn('[LINE] LINE_MESSAGING_API_KEY not configured');
      return;
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [message],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[LINE] Failed to send message:', error);
      throw new Error(`LINE API error: ${error.message}`);
    }

    console.log(`[LINE] Message sent to ${lineUserId}`);
  } catch (error) {
    console.error('[LINE] Error sending message:', error);
    // エラーをスロー（呼び出し側で処理）
    throw error;
  }
}

/**
 * テキストメッセージを送信
 */
export async function sendLineTextMessage(
  lineUserId: string,
  text: string
): Promise<void> {
  await sendLineMessage(lineUserId, {
    type: 'text',
    text,
  });
}

/**
 * 食事記録通知を送信
 */
export async function sendLineMealRecordedNotification(
  lineUserId: string,
  customerName: string,
  mealTimeCategory: string,
  totalCalories: number
): Promise<void> {
  const text = `【${mealTimeCategory}の記録】\n${customerName}が${mealTimeCategory}を記録しました\n\n📊 カロリー: ${totalCalories} kcal`;
  await sendLineTextMessage(lineUserId, text);
}

/**
 * タスク割り当て通知を送信
 */
export async function sendLineTaskAssignedNotification(
  lineUserId: string,
  trainerName: string,
  taskDescription: string,
  dueDate?: string
): Promise<void> {
  let text = `【新しいタスク】\n${trainerName}があなたに新しいタスクを割り当てました\n\n📋 ${taskDescription}`;
  if (dueDate) {
    text += `\n⏰ 期限: ${dueDate}`;
  }
  await sendLineTextMessage(lineUserId, text);
}

/**
 * フィードバック通知を送信
 */
export async function sendLineFeedbackNotification(
  lineUserId: string,
  trainerName: string,
  feedbackMessage: string
): Promise<void> {
  const text = `【フィードバック】\n${trainerName}からのコメント:\n\n💬 ${feedbackMessage}`;
  await sendLineTextMessage(lineUserId, text);
}

/**
 * リッチメッセージテンプレート（ボタン付き）を送信
 */
export async function sendLineButtonMessage(
  lineUserId: string,
  title: string,
  text: string,
  buttons: Array<{
    label: string;
    action: 'uri' | 'postback' | 'message';
    value: string;
  }>
): Promise<void> {
  const templateButtons = buttons.map((btn) => {
    if (btn.action === 'uri') {
      return {
        type: 'uri',
        label: btn.label,
        uri: btn.value,
      };
    } else if (btn.action === 'postback') {
      return {
        type: 'postback',
        label: btn.label,
        data: btn.value,
      };
    } else {
      return {
        type: 'message',
        label: btn.label,
        text: btn.value,
      };
    }
  });

  await sendLineMessage(lineUserId, {
    type: 'template',
    altText: title,
    template: {
      type: 'buttons',
      title,
      text,
      actions: templateButtons,
    },
  });
}
