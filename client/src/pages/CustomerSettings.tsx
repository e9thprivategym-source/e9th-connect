import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Target } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  calculateBMR,
  calculateTDEE,
  calculateMacroTargets,
  calculateDailyCalorieTargets,
  calculateLeanBodyMass,
} from "@/lib/nutritionCalculator";

/**
 * 顧客設定ページ
 * 身長・体重・体脂肪率の入力、BMR/TDEE計算、マクロ目標設定
 */
export default function CustomerSettings() {
  const { user } = useAuth();
  const [userName, setUserName] = useState(user?.name || "");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState("25");
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("70");
  const [bodyFatPercentage, setBodyFatPercentage] = useState("15");
  const [activityLevel, setActivityLevel] = useState("1.5");
  const [dietMode, setDietMode] = useState<"normal" | "bulking" | "keto">("normal");
  const [isSaving, setIsSaving] = useState(false);

  // tRPC Mutation
  const updateSettingsMutation = trpc.customer.updateSettings.useMutation();

  // 計算結果
  const bmr = calculateBMR(gender, parseFloat(weight), parseFloat(height), parseFloat(age));
  const tdee = calculateTDEE(bmr, parseFloat(activityLevel));
  const macroTargets = calculateMacroTargets(tdee, dietMode);
  const dailyCalories = calculateDailyCalorieTargets(tdee);
  const leanBodyMass = calculateLeanBodyMass(parseFloat(weight), parseFloat(bodyFatPercentage));

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        diet_mode: dietMode === "normal" ? "通常" : dietMode === "bulking" ? "バルクアップ" : "ケトジェニック",
        daily_calorie_target: tdee,
        name: userName,
        height: parseFloat(height),
        weight: parseFloat(weight),
        body_fat_percentage: parseFloat(bodyFatPercentage),
        age: parseFloat(age),
        gender: gender,
        activity_level: parseFloat(activityLevel),
      });
      toast.success("設定を保存しました");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("設定の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">設定</h1>
          <p className="text-gray-600 mt-1">プロフィール情報とマクロ栄養素目標を設定</p>
        </div>

        {/* タブナビゲーション */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
            <TabsTrigger value="nutrition">栄養計算</TabsTrigger>
            <TabsTrigger value="goals">目標設定</TabsTrigger>
          </TabsList>

          {/* プロフィールタブ */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  基本情報
                </CardTitle>
                <CardDescription>身長、体重、体脂肪率を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ユーザー名 */}
                <div className="space-y-2">
                  <Label htmlFor="userName">名前</Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="名前を入力"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>

                {/* 性別 */}
                <div className="space-y-2">
                  <Label htmlFor="gender">性別</Label>
                  <Select value={gender} onValueChange={(value: any) => setGender(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男性</SelectItem>
                      <SelectItem value="female">女性</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 年齢 */}
                <div className="space-y-2">
                  <Label htmlFor="age">年齢</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="120"
                  />
                </div>

                {/* 身長 */}
                <div className="space-y-2">
                  <Label htmlFor="height">身長（cm）</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    min="100"
                    max="250"
                  />
                </div>

                {/* 体重 */}
                <div className="space-y-2">
                  <Label htmlFor="weight">体重（kg）</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    min="30"
                    max="300"
                  />
                </div>

                {/* 体脂肪率 */}
                <div className="space-y-2">
                  <Label htmlFor="bodyFat">体脂肪率（%）</Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    placeholder="15"
                    value={bodyFatPercentage}
                    onChange={(e) => setBodyFatPercentage(e.target.value)}
                    min="5"
                    max="50"
                    step="0.1"
                  />
                </div>

                {/* 除脂肪体重表示 */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">除脂肪体重</p>
                  <p className="text-2xl font-bold text-gray-900">{leanBodyMass.toFixed(1)} kg</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 栄養計算タブ */}
          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  代謝計算
                </CardTitle>
                <CardDescription>基礎代謝と総消費カロリーを自動計算</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 運動活動強度 */}
                <div className="space-y-2">
                  <Label htmlFor="activity">運動活動強度</Label>
                  <Select value={activityLevel} onValueChange={setActivityLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.2">1.2 - ほぼ運動なし（座り仕事）</SelectItem>
                      <SelectItem value="1.375">1.375 - 軽い運動（週1-3日）</SelectItem>
                      <SelectItem value="1.55">1.55 - 中程度の運動（週3-5日）</SelectItem>
                      <SelectItem value="1.725">1.725 - かなり活発（週6-7日）</SelectItem>
                      <SelectItem value="1.9">1.9 - 非常に活発（毎日トレーニング）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* BMR表示 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">基礎代謝（BMR）</p>
                    <p className="text-3xl font-bold text-orange-600">{Math.round(bmr)}</p>
                    <p className="text-xs text-gray-600 mt-1">kcal/日</p>
                  </div>

                  {/* TDEE表示 */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">総消費カロリー（TDEE）</p>
                    <p className="text-3xl font-bold text-green-600">{tdee}</p>
                    <p className="text-xs text-gray-600 mt-1">kcal/日</p>
                  </div>
                </div>

                {/* 説明 */}
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p className="font-semibold mb-2">計算式について</p>
                  <p>基礎代謝（BMR）はHarris-Benedict式で計算しています。</p>
                  <p className="mt-1">総消費カロリー（TDEE）= BMR × 運動活動強度</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 目標設定タブ */}
          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  マクロ栄養素目標
                </CardTitle>
                <CardDescription>ダイエットモードを選択して目標を設定</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ダイエットモード選択 */}
                <div className="space-y-2">
                  <Label htmlFor="dietMode">ダイエットモード</Label>
                  <Select value={dietMode} onValueChange={(value: any) => setDietMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">通常（バランス型）</SelectItem>
                      <SelectItem value="bulking">バルクアップ（高炭水化物）</SelectItem>
                      <SelectItem value="keto">ケトジェニック（高脂質）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* マクロ栄養素目標表示 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* タンパク質 */}
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">タンパク質</p>
                    <p className="text-3xl font-bold text-red-600">{macroTargets.protein}</p>
                    <p className="text-xs text-gray-600 mt-1">g/日</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {((macroTargets.protein * 4) / tdee * 100).toFixed(0)}% of TDEE
                    </p>
                  </div>

                  {/* 脂質 */}
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">脂質</p>
                    <p className="text-3xl font-bold text-yellow-600">{macroTargets.fat}</p>
                    <p className="text-xs text-gray-600 mt-1">g/日</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {((macroTargets.fat * 9) / tdee * 100).toFixed(0)}% of TDEE
                    </p>
                  </div>

                  {/* 炭水化物 */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">炭水化物</p>
                    <p className="text-3xl font-bold text-blue-600">{macroTargets.carbs}</p>
                    <p className="text-xs text-gray-600 mt-1">g/日</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {((macroTargets.carbs * 4) / tdee * 100).toFixed(0)}% of TDEE
                    </p>
                  </div>
                </div>

                {/* トレーニング日/オフ日カロリー */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">トレーニング日</p>
                    <p className="text-2xl font-bold text-purple-600">{dailyCalories.trainingDay}</p>
                    <p className="text-xs text-gray-600 mt-1">kcal/日</p>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-gray-600">オフ日</p>
                    <p className="text-2xl font-bold text-indigo-600">{dailyCalories.offDay}</p>
                    <p className="text-xs text-gray-600 mt-1">kcal/日</p>
                  </div>
                </div>

                {/* 説明 */}
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
                  <p className="font-semibold">ダイエットモード別の栄養配分</p>
                  <div>
                    <p className="font-medium text-gray-700">通常：タンパク質 25% / 脂質 25% / 炭水化物 50%</p>
                    <p className="text-xs">バランスの取れた食事。初心者向け。</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">バルクアップ：タンパク質 30% / 脂質 20% / 炭水化物 50%</p>
                    <p className="text-xs">筋肉成長に必要な高炭水化物。</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">ケトジェニック：タンパク質 25% / 脂質 70% / 炭水化物 5%</p>
                    <p className="text-xs">脂肪燃焼重視。上級者向け。</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 保存ボタン */}
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full h-12 text-lg"
        >
          {isSaving ? "保存中..." : "設定を保存"}
        </Button>
      </div>
    </div>
  );
}
