import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "trainer" | "customer";
  senderName: string;
  content: string;
  timestamp: Date;
  relatedMealId?: number;
}

/**
 * トレーナー・顧客チャット画面
 * 1対1の指導チャット、食事記録への直接コメント
 */
export default function TrainerChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "customer",
      senderName: "田中太郎",
      content: "今日の夕食、タンパク質が足りないと思うんですが、何か追加した方がいいですか？",
      timestamp: new Date(Date.now() - 10 * 60000),
      relatedMealId: 5,
    },
    {
      id: "2",
      sender: "trainer",
      senderName: "トレーナー",
      content:
        "良い質問ですね。現在のタンパク質が150gということですね。目標の200gまで、あと50g必要です。\n\n以下の選択肢をお勧めします：\n1. 鶏むね肉100g（タンパク質約25g）\n2. プロテインシェイク（タンパク質25g）\n3. ギリシャヨーグルト200g（タンパク質約20g）\n\nいずれか2つ組み合わせると目標に到達します。",
      timestamp: new Date(Date.now() - 5 * 60000),
    },
    {
      id: "3",
      sender: "customer",
      senderName: "田中太郎",
      content: "プロテインシェイクとギリシャヨーグルトの組み合わせでいきます。ありがとうございます！",
      timestamp: new Date(Date.now() - 2 * 60000),
    },
    {
      id: "4",
      sender: "trainer",
      senderName: "トレーナー",
      content: "完璧です！その組み合わせなら合計45gのタンパク質が追加されるので、目標達成できますね。継続頑張ってください！",
      timestamp: new Date(Date.now() - 1 * 60000),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "trainer",
      senderName: "トレーナー",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    // シミュレーション：顧客からのレスポンス
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "customer",
        senderName: "田中太郎",
        content: "ありがとうございます。参考になります。実行してみます！",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        {/* ヘッダー */}
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">田中太郎さん</h1>
            <p className="text-sm text-gray-600">バルクアップ | 本日記録済み</p>
          </div>
        </div>

        {/* チャットエリア */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">トレーナー指導チャット</CardTitle>
            <CardDescription>
              食事記録や栄養についての相談、直接指導をここで行います
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "trainer" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === "trainer"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {message.senderName}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.relatedMealId && (
                        <Badge
                          variant="secondary"
                          className="mt-2 text-xs"
                        >
                          食事記録 #{message.relatedMealId}
                        </Badge>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "trainer"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* 入力エリア */}
          <div className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="指導メッセージを入力..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Shift + Enter で改行、Enter で送信
            </p>
          </div>
        </Card>

        {/* クイックテンプレート */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("タンパク質の摂取量について相談があります")}
          >
            タンパク質について
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("本日の食事記録を確認しました。良い進捗ですね。")}
          >
            励ましメッセージ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("明日のトレーニング内容に合わせて、食事計画を立てましょう")}
          >
            食事計画
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("週間の達成状況を確認しました。素晴らしい！")}
          >
            週間フィードバック
          </Button>
        </div>
      </div>
    </div>
  );
}
