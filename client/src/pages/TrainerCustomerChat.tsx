import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * トレーナー・顧客間チャット画面
 * リアルタイムメッセージ送受信・履歴表示
 */
export default function TrainerCustomerChat() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: "customer",
      senderName: "山田太郎",
      content: "昨日の夜ご飯、タンパク質が足りなかったんですが、何か良い方法ありますか？",
      timestamp: new Date(Date.now() - 3600000),
      read: true,
    },
    {
      id: 2,
      sender: "trainer",
      senderName: "トレーナー",
      content: "お疲れ様です！夜間食にプロテインシェイクを追加するのがおすすめです。寝る前に飲むと筋肉合成が促進されます。",
      timestamp: new Date(Date.now() - 3000000),
      read: true,
    },
    {
      id: 3,
      sender: "customer",
      senderName: "山田太郎",
      content: "なるほど！明日から試してみます。",
      timestamp: new Date(Date.now() - 2400000),
      read: true,
    },
    {
      id: 4,
      sender: "trainer",
      senderName: "トレーナー",
      content: "良いですね。記録も忘れずに！",
      timestamp: new Date(Date.now() - 1800000),
      read: true,
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // メッセージを追加
    const newMessage = {
      id: messages.length + 1,
      sender: "trainer",
      senderName: "トレーナー",
      content: inputValue,
      timestamp: new Date(),
      read: false,
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
    setIsLoading(true);

    // シミュレーション：1秒後に返信
    setTimeout(() => {
      const response = {
        id: messages.length + 2,
        sender: "customer",
        senderName: "山田太郎",
        content: "ありがとうございます！参考になります。",
        timestamp: new Date(),
        read: false,
      };
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 1000);

    // TODO: API連携してメッセージを送信
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー */}
      <Card className="rounded-none border-b">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/trainer/dashboard")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="font-semibold">山田太郎</h2>
                <p className="text-xs text-gray-600">オンライン</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* メッセージ表示エリア */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "trainer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "trainer"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === "trainer" ? "text-blue-100" : "text-gray-600"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* 入力エリア */}
      <Card className="rounded-none border-t">
        <CardContent className="p-4">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Input
              placeholder="メッセージを入力..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
              disabled={isLoading || !inputValue.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
