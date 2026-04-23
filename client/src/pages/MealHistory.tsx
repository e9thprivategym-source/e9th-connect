import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

/**
 * 食事履歴表示画面
 * 日別・カテゴリ別に食事記録を表示
 */
export default function MealHistory() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<"朝食" | "昼食" | "夕食" | "間食" | "all">("all");

  // 本日の食事を取得
  const { data: todayMeals = [], isLoading } = trpc.customer.getTodayMeals.useQuery();

  const mealCategories = ["朝食", "昼食", "夕食", "間食"];

  // フィルタリング
  const filteredMeals = selectedCategory === "all"
    ? todayMeals
    : todayMeals.filter((meal: any) => meal.meal_time_category === selectedCategory);

  // 合計計算
  const totals = filteredMeals.reduce(
    (acc: any, meal: any) => ({
      calories: acc.calories + parseFloat(meal.total_calories?.toString() || "0"),
      protein: acc.protein + parseFloat((meal.total_pfc_json as any)?.protein?.toString() || "0"),
      fat: acc.fat + parseFloat((meal.total_pfc_json as any)?.fat?.toString() || "0"),
      carbs: acc.carbs + parseFloat((meal.total_pfc_json as any)?.carbs?.toString() || "0"),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleDeleteMeal = (mealId: number) => {
    toast.success("食事記録を削除しました");
    // TODO: 実装時はAPIで削除
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMealCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "朝食":
        return "bg-yellow-100 text-yellow-800";
      case "昼食":
        return "bg-blue-100 text-blue-800";
      case "夕食":
        return "bg-purple-100 text-purple-800";
      case "間食":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">食事履歴</h1>
          <p className="text-gray-600 mt-1">日別の食事記録を確認・管理できます</p>
        </div>

        {/* 日付選択 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center flex-1">
                <p className="text-lg font-semibold">{formatDate(selectedDate)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* カテゴリフィルター */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">すべて</TabsTrigger>
                <TabsTrigger value="朝食">朝食</TabsTrigger>
                <TabsTrigger value="昼食">昼食</TabsTrigger>
                <TabsTrigger value="夕食">夕食</TabsTrigger>
                <TabsTrigger value="間食">間食</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* 食事一覧 */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">読み込み中...</p>
            </CardContent>
          </Card>
        ) : filteredMeals.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                {selectedCategory === "all" ? "本日の食事記録がありません" : `${selectedCategory}の記録がありません`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMeals.map((meal: any) => (
              <Card key={meal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getMealCategoryBadgeColor(meal.meal_time_category)}>
                        {meal.meal_time_category}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(meal.created_at).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMeal(meal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 食品一覧 */}
                  <div className="space-y-2">
                    {(meal.food_items_json as any[])?.map((food: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{food.name}</span>
                        <span className="text-gray-600">{food.quantity}{food.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* 栄養情報 */}
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-600">カロリー</p>
                      <p className="font-semibold">{Math.round(parseFloat(meal.total_calories?.toString() || "0"))} kcal</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">タンパク質</p>
                      <p className="font-semibold">{Math.round(parseFloat((meal.total_pfc_json as any)?.protein?.toString() || "0"))}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">脂質</p>
                      <p className="font-semibold">{Math.round(parseFloat((meal.total_pfc_json as any)?.fat?.toString() || "0"))}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">炭水化物</p>
                      <p className="font-semibold">{Math.round(parseFloat((meal.total_pfc_json as any)?.carbs?.toString() || "0"))}g</p>
                    </div>
                  </div>

                  {/* AIフィードバック */}
                  {meal.ai_feedback && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-1">E9th AI Coach からのフィードバック</p>
                      <p className="text-sm text-blue-800">{meal.ai_feedback}</p>
                    </div>
                  )}

                  {/* トレーナーコメント */}
                  {meal.trainer_comment && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-semibold text-green-900 mb-1">トレーナーからのコメント</p>
                      <p className="text-sm text-green-800">{meal.trainer_comment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* 合計 */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedCategory === "all" ? "本日の合計" : `${selectedCategory}の合計`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">カロリー</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(totals.calories)}
                    </p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">タンパク質</p>
                    <p className="text-2xl font-bold text-red-600">
                      {Math.round(totals.protein)}
                    </p>
                    <p className="text-xs text-gray-500">g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">脂質</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {Math.round(totals.fat)}
                    </p>
                    <p className="text-xs text-gray-500">g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">炭水化物</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(totals.carbs)}
                    </p>
                    <p className="text-xs text-gray-500">g</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
