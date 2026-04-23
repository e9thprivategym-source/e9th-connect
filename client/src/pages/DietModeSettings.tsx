import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

/**
 * ダイエットモード設定画面
 * バルクアップ・ケトジェニック・通常モードの切り替え
 */
export default function DietModeSettings() {
  const [selectedMode, setSelectedMode] = useState<"bulkup" | "keto" | "normal">("normal");
  const [bodyWeight, setBodyWeight] = useState(75);
  const [activityLevel, setActivityLevel] = useState<"sedentary" | "light" | "moderate" | "active">("moderate");

  // モード別の栄養目標設定
  const dietModes = {
    bulkup: {
      name: "バルクアップ",
      description: "筋肉量を増やしながら体重を増加させるモード",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "bg-red-100 text-red-800",
      macroRatio: { protein: 30, fat: 25, carbs: 45 },
      calorieMultiplier: 1.1, // TDEE × 1.1
      details: [
        "高タンパク質（体重×1.8～2.0g）",
        "カロリー過剰（TDEE + 300～500kcal）",
        "トレーニング後の栄養補給が重要",
        "週1～2回の体重測定推奨",
      ],
    },
    keto: {
      name: "ケトジェニック",
      description: "低炭水化物・高脂質で脂肪燃焼を促進するモード",
      icon: <TrendingDown className="h-6 w-6" />,
      color: "bg-blue-100 text-blue-800",
      macroRatio: { protein: 30, fat: 65, carbs: 5 },
      calorieMultiplier: 0.85, // TDEE × 0.85
      details: [
        "超低炭水化物（1日50g以下）",
        "高脂質（総カロリーの60～70%）",
        "適応期間に2～3週間必要",
        "電解質補給に注意",
      ],
    },
    normal: {
      name: "通常モード",
      description: "バランスの取れた栄養で健康的に体を作るモード",
      icon: <Activity className="h-6 w-6" />,
      color: "bg-green-100 text-green-800",
      macroRatio: { protein: 25, fat: 30, carbs: 45 },
      calorieMultiplier: 0.95, // TDEE × 0.95
      details: [
        "バランスの取れたPFC配分",
        "カロリー管理で体脂肪を減らす",
        "継続性が高いモード",
        "初心者向けの推奨設定",
      ],
    },
  };

  const activityLevels = {
    sedentary: { label: "ほぼ運動なし", multiplier: 1.2 },
    light: { label: "週1～3日の運動", multiplier: 1.375 },
    moderate: { label: "週3～5日の運動", multiplier: 1.55 },
    active: { label: "毎日運動", multiplier: 1.725 },
  };

  // TDEE計算（簡易版：Harris-Benedict式）
  const calculateTDEE = () => {
    const basalMetabolicRate = 88.362 + 13.397 * bodyWeight + 4.799 * 175 - 5.677 * 30; // 仮の値
    return Math.round(basalMetabolicRate * activityLevels[activityLevel].multiplier);
  };

  const currentMode = dietModes[selectedMode];
  const tdee = calculateTDEE();
  const dailyCalories = Math.round(tdee * currentMode.calorieMultiplier);
  const dailyProtein = Math.round((dailyCalories * (currentMode.macroRatio.protein / 100)) / 4);
  const dailyFat = Math.round((dailyCalories * (currentMode.macroRatio.fat / 100)) / 9);
  const dailyCarbs = Math.round((dailyCalories * (currentMode.macroRatio.carbs / 100)) / 4);

  const handleSaveSettings = () => {
    toast.success(`${currentMode.name}の設定を保存しました`);
    // TODO: API連携して設定を保存
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold">ダイエットモード設定</h1>
        <p className="text-gray-600 mt-1">目標に応じてモードを選択し、栄養目標を自動計算</p>
      </div>

      {/* 体重・活動レベル入力 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>栄養目標の計算に使用します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">体重 (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="tdee">推定TDEE</Label>
              <div className="mt-2 p-3 bg-gray-100 rounded-lg font-semibold">
                {tdee} kcal
              </div>
            </div>
          </div>

          <div>
            <Label>活動レベル</Label>
            <RadioGroup value={activityLevel} onValueChange={(v: any) => setActivityLevel(v)}>
              <div className="space-y-3 mt-3">
                {Object.entries(activityLevels).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={key} id={key} />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                      {value.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* モード選択 */}
      <div>
        <h2 className="text-xl font-bold mb-4">ダイエットモード選択</h2>
        <RadioGroup value={selectedMode} onValueChange={(v: any) => setSelectedMode(v)}>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(dietModes).map(([key, mode]: [string, any]) => (
              <div
                key={key}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedMode === key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedMode(key as any)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${mode.color}`}>{mode.icon}</div>
                  <div>
                    <h3 className="font-semibold">{mode.name}</h3>
                    <p className="text-xs text-gray-600">{mode.description}</p>
                  </div>
                </div>
                <RadioGroupItem value={key} id={key} className="absolute top-4 right-4" />
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* 選択モードの詳細 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${currentMode.color}`}>
              {currentMode.icon}
            </div>
            {currentMode.name} - 栄養目標
          </CardTitle>
          <CardDescription>{currentMode.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 栄養目標 */}
          <div>
            <h3 className="font-semibold mb-4">1日の栄養目標</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <p className="text-sm text-gray-600">カロリー</p>
                <p className="text-2xl font-bold text-orange-600">{dailyCalories}</p>
                <p className="text-xs text-gray-600 mt-1">kcal</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                <p className="text-sm text-gray-600">タンパク質</p>
                <p className="text-2xl font-bold text-red-600">{dailyProtein}</p>
                <p className="text-xs text-gray-600 mt-1">g ({currentMode.macroRatio.protein}%)</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                <p className="text-sm text-gray-600">脂質</p>
                <p className="text-2xl font-bold text-yellow-600">{dailyFat}</p>
                <p className="text-xs text-gray-600 mt-1">g ({currentMode.macroRatio.fat}%)</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <p className="text-sm text-gray-600">炭水化物</p>
                <p className="text-2xl font-bold text-green-600">{dailyCarbs}</p>
                <p className="text-xs text-gray-600 mt-1">g ({currentMode.macroRatio.carbs}%)</p>
              </div>
            </div>
          </div>

          {/* モードの詳細情報 */}
          <div>
            <h3 className="font-semibold mb-3">このモードの特徴</h3>
            <ul className="space-y-2">
              {currentMode.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <span className="text-gray-700">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 注意事項 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ 注意事項</p>
            <p className="text-sm text-yellow-800">
              これらの値は推定値です。実際の栄養目標は、トレーナーと相談して調整してください。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">キャンセル</Button>
        <Button onClick={handleSaveSettings} className="flex-1">
          設定を保存
        </Button>
      </div>
    </div>
  );
}
