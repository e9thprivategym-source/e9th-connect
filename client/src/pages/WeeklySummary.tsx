import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Calendar, Target } from "lucide-react";

/**
 * 週次集計画面
 * 1週間単位のPFC・カロリー達成率をグラフで表示
 */
export default function WeeklySummary() {
  // ダミーデータ（実装時はAPIから取得）
  const weeklyData = [
    { day: "月", calories: 1850, protein: 150, fat: 65, carbs: 210, achieved: true },
    { day: "火", calories: 2100, protein: 165, fat: 72, carbs: 250, achieved: true },
    { day: "水", calories: 1950, protein: 155, fat: 68, carbs: 225, achieved: true },
    { day: "木", calories: 2200, protein: 180, fat: 75, carbs: 280, achieved: true },
    { day: "金", calories: 2050, protein: 160, fat: 70, carbs: 240, achieved: false },
    { day: "土", calories: 1800, protein: 145, fat: 62, carbs: 200, achieved: true },
    { day: "日", calories: 0, protein: 0, fat: 0, carbs: 0, achieved: false },
  ];

  const weeklyStats = {
    totalCalories: 13950,
    targetCalories: 15400, // 2200 * 7
    totalProtein: 1105,
    targetProtein: 1260, // 180 * 7
    totalFat: 482,
    targetFat: 490, // 70 * 7
    totalCarbs: 1405,
    targetCarbs: 1960, // 280 * 7
    achievedDays: 6,
    totalDays: 7,
  };

  const macroChartData = [
    { name: "タンパク質", value: weeklyStats.totalProtein, target: weeklyStats.targetProtein, fill: "#ef4444" },
    { name: "脂質", value: weeklyStats.totalFat, target: weeklyStats.targetFat, fill: "#f59e0b" },
    { name: "炭水化物", value: weeklyStats.totalCarbs, target: weeklyStats.targetCarbs, fill: "#10b981" },
  ];

  const COLORS = ["#ef4444", "#f59e0b", "#10b981"];

  const calculateAchievementRate = (actual: number, target: number) => {
    return Math.min(100, (actual / target) * 100);
  };

  const calorieAchievementRate = calculateAchievementRate(weeklyStats.totalCalories, weeklyStats.targetCalories);
  const proteinAchievementRate = calculateAchievementRate(weeklyStats.totalProtein, weeklyStats.targetProtein);
  const fatAchievementRate = calculateAchievementRate(weeklyStats.totalFat, weeklyStats.targetFat);
  const carbsAchievementRate = calculateAchievementRate(weeklyStats.totalCarbs, weeklyStats.targetCarbs);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold">週間統計</h1>
        <p className="text-gray-600 mt-1">
          {new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toLocaleDateString("ja-JP")} ～ {new Date().toLocaleDateString("ja-JP")}
        </p>
      </div>

      {/* 週間達成率サマリー */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">カロリー達成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(calorieAchievementRate)}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {Math.round(weeklyStats.totalCalories)} / {weeklyStats.targetCalories} kcal
            </p>
            <Progress value={calorieAchievementRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">タンパク質達成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{Math.round(proteinAchievementRate)}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {Math.round(weeklyStats.totalProtein)} / {weeklyStats.targetProtein}g
            </p>
            <Progress value={proteinAchievementRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">脂質達成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{Math.round(fatAchievementRate)}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {Math.round(weeklyStats.totalFat)} / {weeklyStats.targetFat}g
            </p>
            <Progress value={fatAchievementRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">炭水化物達成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{Math.round(carbsAchievementRate)}%</div>
            <p className="text-xs text-gray-600 mt-1">
              {Math.round(weeklyStats.totalCarbs)} / {weeklyStats.targetCarbs}g
            </p>
            <Progress value={carbsAchievementRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* 日別カロリー推移 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            日別カロリー推移
          </CardTitle>
          <CardDescription>目標: 2200 kcal/日</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#3b82f6"
                name="摂取カロリー"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey={() => 2200}
                stroke="#ef4444"
                name="目標カロリー"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* PFC比較 */}
      <Card>
        <CardHeader>
          <CardTitle>PFC達成状況</CardTitle>
          <CardDescription>週間合計の目標達成度</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={macroChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name="実績" />
              <Bar dataKey="target" fill="#e5e7eb" name="目標" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 日別詳細 */}
      <Card>
        <CardHeader>
          <CardTitle>日別詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyData.map((day, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="font-semibold w-8">{day.day}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {day.calories > 0 ? `${day.calories} kcal` : "未記録"}
                    </div>
                    {day.calories > 0 && (
                      <div className="text-xs text-gray-600">
                        P: {day.protein}g | F: {day.fat}g | C: {day.carbs}g
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {day.calories > 0 && (
                    <>
                      <Progress
                        value={calculateAchievementRate(day.calories, 2200)}
                        className="w-20 h-2"
                      />
                      <Badge variant={day.achieved ? "default" : "secondary"}>
                        {day.achieved ? "達成" : "未達成"}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 週間統計サマリー */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            週間統計サマリー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">記録日数</p>
              <p className="text-2xl font-bold">{weeklyStats.achievedDays}/{weeklyStats.totalDays}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">平均カロリー</p>
              <p className="text-2xl font-bold">{Math.round(weeklyStats.totalCalories / weeklyStats.achievedDays)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">平均タンパク質</p>
              <p className="text-2xl font-bold">{Math.round(weeklyStats.totalProtein / weeklyStats.achievedDays)}g</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">総カロリー</p>
              <p className="text-2xl font-bold">{Math.round(weeklyStats.totalCalories)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクション */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          <Calendar className="h-4 w-4 mr-2" />
          前週を見る
        </Button>
        <Button className="flex-1">
          <Calendar className="h-4 w-4 mr-2" />
          来週を見る
        </Button>
      </div>
    </div>
  );
}
