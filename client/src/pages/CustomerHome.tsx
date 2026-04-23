import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Apple, Flame, Dumbbell, TrendingUp, MessageSquare, Trophy, Calendar } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * 顧客用ホーム画面
 * 本日のカロリー・PFC進捗、動的マクロ目標、ナビゲーションを表示
 */
export default function CustomerHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isTrainingDay, setIsTrainingDay] = useState(true);

  // API からデータを取得
  const { data: todayProgress = {}, isLoading: progressLoading } = trpc.customer.getTodayProgress.useQuery();

  // ダミーデータ（実装時は API から取得）
  const todayStats = {
    calories: {
      consumed: 1850,
      target: 2200,
      unit: "kcal",
    },
    protein: {
      consumed: 150,
      target: 180,
      unit: "g",
    },
    fat: {
      consumed: 65,
      target: 70,
      unit: "g",
    },
    carbs: {
      consumed: 210,
      target: 280,
      unit: "g",
    },
  };

  const macroTargets = isTrainingDay
    ? {
        label: "トレーニング日（High Carb）",
        protein: "180g",
        fat: "70g",
        carbs: "280g",
      }
    : {
        label: "オフ日（Low Carb）",
        protein: "180g",
        fat: "75g",
        carbs: "150g",
      };

  const getProgressPercentage = (consumed: number, target: number) => {
    return Math.min((consumed / target) * 100, 100);
  };

  const ProgressCard = ({
    title,
    consumed,
    target,
    unit,
    icon: Icon,
    color,
  }: {
    title: string;
    consumed: number;
    target: number;
    unit: string;
    icon: React.ReactNode;
    color: string;
  }) => {
    const percentage = getProgressPercentage(consumed, target);
    const isExceeded = consumed > target;

    return (
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={`p-2 rounded-lg ${color}`}>{Icon}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                {consumed} / {target} {unit}
              </span>
              <span className={isExceeded ? "text-red-600" : "text-green-600"}>
                {isExceeded ? "超過" : "残り"} {Math.abs(consumed - target)} {unit}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              こんにちは、{user?.name}さん
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString("ja-JP", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <Button variant="outline">設定</Button>
        </div>

        {/* トレーニング日/オフ日切り替え */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">動的マクロ設定</CardTitle>
            <CardDescription>
              トレーニング実施日とオフ日で目標を自動切り替え
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Tabs
                value={isTrainingDay ? "training" : "off"}
                onValueChange={(v) => setIsTrainingDay(v === "training")}
              >
                <TabsList>
                  <TabsTrigger value="training">トレーニング日</TabsTrigger>
                  <TabsTrigger value="off">オフ日</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex-1 bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">
                  {macroTargets.label}
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">タンパク質</p>
                    <p className="font-bold text-lg">{macroTargets.protein}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">脂質</p>
                    <p className="font-bold text-lg">{macroTargets.fat}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">炭水化物</p>
                    <p className="font-bold text-lg">{macroTargets.carbs}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 本日の進捗 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">本日の進捗</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProgressCard
              title="カロリー"
              consumed={todayStats.calories.consumed}
              target={todayStats.calories.target}
              unit={todayStats.calories.unit}
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              color="bg-orange-100"
            />
            <ProgressCard
              title="タンパク質"
              consumed={todayStats.protein.consumed}
              target={todayStats.protein.target}
              unit={todayStats.protein.unit}
              icon={<Apple className="w-5 h-5 text-red-500" />}
              color="bg-red-100"
            />
            <ProgressCard
              title="脂質"
              consumed={todayStats.fat.consumed}
              target={todayStats.fat.target}
              unit={todayStats.fat.unit}
              icon={<Dumbbell className="w-5 h-5 text-blue-500" />}
              color="bg-blue-100"
            />
            <ProgressCard
              title="炭水化物"
              consumed={todayStats.carbs.consumed}
              target={todayStats.carbs.target}
              unit={todayStats.carbs.unit}
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              color="bg-green-100"
            />
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-16 text-lg" variant="default" onClick={() => setLocation("/customer/meal")}>
            食事を記録
          </Button>
          <Button className="h-16 text-lg" variant="outline" onClick={() => setLocation("/customer/weekly")}>
            週間統計
          </Button>
          <Button className="h-16 text-lg" variant="outline" onClick={() => setLocation("/customer/ai-coach")}>
            AIコーチに相談
          </Button>
        </div>

        {/* 最近の食事 */}
        <Card>
          <CardHeader>
            <CardTitle>最近の食事記録</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">朝食 - トースト＆卵</p>
                  <p className="text-sm text-gray-600">450 kcal</p>
                </div>
                <p className="text-sm text-gray-600">08:30</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">昼食 - 鶏むね肉弁当</p>
                  <p className="text-sm text-gray-600">650 kcal</p>
                </div>
                <p className="text-sm text-gray-600">12:15</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">間食 - プロテインバー</p>
                  <p className="text-sm text-gray-600">200 kcal</p>
                </div>
                <p className="text-sm text-gray-600">15:45</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
