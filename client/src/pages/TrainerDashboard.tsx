import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface CustomerWithProgress {
  id: number;
  name: string;
  email?: string;
  dietMode: "通常" | "バルクアップ" | "ケトジェニック";
  todayProgress?: {
    caloriesConsumed: number;
    caloriesTarget: number;
    proteinConsumed: number;
    proteinTarget: number;
    mealCount: number;
  };
  weeklyProgress?: {
    achievementRate: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  };
}

/**
 * トレーナー用ダッシュボード
 * 担当顧客の一覧、本日の記録状況、週間達成率を表示
 */
export default function TrainerDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  // API から担当顧客を取得
  const { data: assignedCustomers = [], isLoading: isLoadingCustomers } =
    trpc.trainer.getAssignedCustomers.useQuery(undefined, {
      enabled: !!user && user.role === 'trainer',
    });

  // 各顧客の本日進捗と週間達成率を取得
  const customerProgresses = assignedCustomers.map((customer) => {
    const { data: todayProgress } = trpc.trainer.getCustomerTodayProgress.useQuery(
      { customerId: customer.id },
      { enabled: !!customer.id }
    );

    const { data: weeklyProgress } = trpc.trainer.getWeeklyProgress.useQuery(
      { customerId: customer.id },
      { enabled: !!customer.id }
    );

    return {
      ...customer,
      todayProgress,
      weeklyProgress,
    };
  });

  const filteredCustomers = useMemo(
    () =>
      customerProgresses.filter((c) =>
        (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [customerProgresses, searchQuery]
  );

  const getDietModeBadgeColor = (mode?: string) => {
    switch (mode) {
      case "バルクアップ":
        return "bg-red-100 text-red-800";
      case "ケトジェニック":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getRecordStatusColor = (mealCount?: number) => {
    return (mealCount ?? 0) > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const recordedCount = customerProgresses.filter((c) => (c.todayProgress?.mealCount ?? 0) > 0).length;
  const averageAchievementRate =
    customerProgresses.length > 0
      ? Math.round(
          customerProgresses.reduce(
            (sum, c) => sum + (c.weeklyProgress?.achievementRate?.calories ?? 0),
            0
          ) / customerProgresses.length
        )
      : 0;

  if (isLoadingCustomers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">トレーナーダッシュボード</h1>
          <p className="text-gray-600 mt-1">担当顧客の管理と指導状況の確認</p>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                担当顧客数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{customerProgresses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                本日記録済み
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{recordedCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                平均達成率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{averageAchievementRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                要注意顧客
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {customerProgresses.filter((c) => (c.todayProgress?.mealCount ?? 0) === 0).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルター */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">顧客を検索</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="顧客名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 顧客一覧 */}
        <div className="space-y-3">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* 顧客情報 */}
                    <div className="md:col-span-3">
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getDietModeBadgeColor(customer.role)}>
                          {customer.role === 'customer' ? '顧客' : customer.role}
                        </Badge>
                        <Badge
                          className={getRecordStatusColor(customer.todayProgress?.mealCount)}
                        >
                          {(customer.todayProgress?.mealCount ?? 0) > 0 ? "本日記録済み" : "未記録"}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ID: {customer.id}
                      </p>
                    </div>

                    {/* 本日の進捗 */}
                    <div className="md:col-span-4">
                      {customer.todayProgress ? (
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">カロリー</span>
                              <span className="font-medium">
                                {Math.round(customer.todayProgress.caloriesConsumed)} / {customer.todayProgress.caloriesTarget} kcal
                              </span>
                            </div>
                            <Progress
                              value={Math.min(
                                (customer.todayProgress.caloriesConsumed / customer.todayProgress.caloriesTarget) * 100,
                                100
                              )}
                              className="h-1.5"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">タンパク質</span>
                              <span className="font-medium">
                                {Math.round(customer.todayProgress.proteinConsumed)} / {customer.todayProgress.proteinTarget}g
                              </span>
                            </div>
                            <Progress
                              value={Math.min(
                                (customer.todayProgress.proteinConsumed / customer.todayProgress.proteinTarget) * 100,
                                100
                              )}
                              className="h-1.5"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">データ読み込み中...</p>
                      )}
                    </div>

                    {/* 週間達成率 */}
                    <div className="md:col-span-2">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {customer.weeklyProgress
                            ? Math.round(customer.weeklyProgress.achievementRate.calories)
                            : '-'}
                          %
                        </p>
                        <p className="text-xs text-gray-600">週間達成率</p>
                      </div>
                    </div>

                    {/* アクション */}
                    <div className="md:col-span-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/trainer/customer/${customer.id}`)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        詳細
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">
                  {customerProgresses.length === 0
                    ? "担当顧客がまだいません"
                    : "該当する顧客がみつかりません"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
