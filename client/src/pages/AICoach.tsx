import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: Date;
}

/**
 * E9th AI Coach チャット画面
 * AIコーチとの1対1チャット形式でのコーチング
 */
export default function AICoach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "coach",
      content: "こんにちは！E9th AI Coach です。あなたの栄養管理とボディメイクをサポートします。何かご質問や相談があればお気軽にどうぞ！",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ユーザー設定を取得（デフォルト値を使用）
  const userSettings = {
    diet_mode: 'normal' as const,
    daily_calorie_goal: 2200,
    daily_protein_goal: 180,
  };

  // 本日の進捗を取得
  const { data: todayProgress } = trpc.customer.getTodayProgress.useQuery(undefined, {
    enabled: !!user && user.role === 'customer',
  });

  // AIコーチチャット API
  const coachChatMutation = trpc.ai.coachChat.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            role: "coach",
            content: data.reply,
            timestamp: new Date(),
          },
        ]);
      }
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Coach chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: "coach",
          content: "申し訳ありません。エラーが発生しました。もう一度お試しください。",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userSettings || !todayProgress) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // AI コーチにメッセージを送信
    coachChatMutation.mutate({
      message: input,
      context: {
        dietMode: "通常",
        dailyGoals: {
          calories: 2200,
          protein: 180,
        },
        todayProgress: {
          calories: todayProgress.caloriesConsumed,
          protein: todayProgress.proteinConsumed,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        {/* ヘッダー */}
        <div className="mb-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">E9th AI Coach</h1>
            <p className="text-gray-600 mt-1">
              科学的根拠に基づいたボディメイクサポート
            </p>
          </div>
        </div>

        {/* チャットエリア */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">コーチとの対話</CardTitle>
            <CardDescription>
              食事、トレーニング、栄養に関する質問にお答えします
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "coach" && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">AI</span>
                      </div>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      {message.role === "coach" ? (
                        <Streamdown>{message.content}</Streamdown>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          message.role === "user"
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
                  <div className="flex justify-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                      <p className="text-sm">考え中...</p>
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
                placeholder="質問を入力..."
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

        {/* よくある質問 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("タンパク質の目標摂取量は？")}
            disabled={isLoading}
          >
            タンパク質について
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("ケトジェニックダイエットについて教えてください")}
            disabled={isLoading}
          >
            ケトジェニックについて
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("バルクアップ時の食事戦略は？")}
            disabled={isLoading}
          >
            バルクアップ戦略
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("微量栄養素の重要性は？")}
            disabled={isLoading}
          >
            微量栄養素について
          </Button>
        </div>
      </div>
    </div>
  );
}
