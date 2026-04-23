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
import { Camera, Plus, Trash2, Loader2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { calculateNutrition } from "@/lib/foodDatabase";

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  quantity: number;
}

/**
 * 食事記録画面
 * 写真アップロード、AI解析、手動入力に対応
 */
export default function MealRecording() {
  const [, setLocation] = useLocation();
  const [mealCategory, setMealCategory] = useState<"朝食" | "昼食" | "夕食" | "間食">("朝食");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodFat, setFoodFat] = useState("");
  const [foodCarbs, setFoodCarbs] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  // tRPC Mutation
  const recordMealMutation = trpc.customer.recordMeal.useMutation();
  const analyzeFoodImageMutation = trpc.ai.analyzeFoodImage.useMutation();

  const mealCategories = ["朝食", "昼食", "夕食", "間食"];

  const totalStats = foodItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories * item.quantity,
      protein: acc.protein + item.protein * item.quantity,
      fat: acc.fat + item.fat * item.quantity,
      carbs: acc.carbs + item.carbs * item.quantity,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const handleAddFood = () => {
    if (!foodName) {
      toast.error("食品名は必須です");
      return;
    }

    const qty = parseFloat(quantity) || 100;
    
    // 食品マスターから自動計算を試みる
    let nutrition = calculateNutrition(foodName, qty);
    
    // マスターに見つからない場合は手動入力値を使用
    if (!nutrition && foodCalories) {
      nutrition = {
        name: foodName,
        calories: parseFloat(foodCalories),
        protein: parseFloat(foodProtein) || 0,
        fat: parseFloat(foodFat) || 0,
        carbs: parseFloat(foodCarbs) || 0,
      };
    }
    
    if (!nutrition) {
      toast.error("食品が見つかりません。カロリーを手動入力してください");
      return;
    }

    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: nutrition.name,
      calories: nutrition.calories,
      protein: nutrition.protein,
      fat: nutrition.fat,
      carbs: nutrition.carbs,
      quantity: 1,
    };

    setFoodItems([...foodItems, newItem]);
    setFoodName("");
    setFoodCalories("");
    setFoodProtein("");
    setFoodFat("");
    setFoodCarbs("");
    setQuantity("100");
    toast.success(`${nutrition.name}を追加しました`);
  };

  const handleRemoveFood = (id: string) => {
    setFoodItems(foodItems.filter((item) => item.id !== id));
    toast.success("食品を削除しました");
  };

  const handleEditFood = (id: string, currentQuantity: number) => {
    setEditingId(id);
    setEditQuantity(currentQuantity.toString());
  };

  const handleSaveEdit = (id: string) => {
    const newQuantity = parseFloat(editQuantity) || 1;
    setFoodItems(foodItems.map((item) => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
    setEditingId(null);
    setEditQuantity("");
    toast.success("食品を更新しました");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuantity("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setIsAnalyzing(true);

    try {
      // 一時的に画像 URL を作成（実装時は S3 URL を使用）
      const imageUrl = URL.createObjectURL(file);
      
      // AI 画像解析を実行
      const result = await analyzeFoodImageMutation.mutateAsync({
        imageUrl,
        mealTimeCategory: mealCategory,
      });

      if (result.success && result.analysis) {
        // 解析結果を食事アイテムに追加
        const analysisResult = result.analysis as any;
        const newItems = (analysisResult.foods || []).map((food: any) => ({
          id: Date.now().toString() + Math.random(),
          name: food.name,
          calories: food.calories || 0,
          protein: food.protein || 0,
          fat: food.fat || 0,
          carbs: food.carbs || 0,
          quantity: 1,
        }));
        
        setFoodItems([...foodItems, ...newItems]);
        toast.success(`画像解析完了。${newItems.length}件の食品を追加しました`);
      } else {
        toast.error('画像解析に失敗しました');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('画像解析中にエラーが発生しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = async () => {
    if (foodItems.length === 0) {
      toast.error("最低1つの食品を追加してください");
      return;
    }

    setIsSaving(true);

    try {
      let imageUrl: string | undefined;
      
      // 写真がある場合はS3にアップロード
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append('file', imageFile);
          formData.append('mealCategory', mealCategory);
          
          const uploadResponse = await fetch('/api/upload-meal-image', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('画像アップロードに失敗しました');
          }
          
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('画像アップロードに失敗しました');
          setIsSaving(false);
          return;
        }
      }
      
      // API に POST
      await recordMealMutation.mutateAsync({
        food_items: foodItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: "g",
        })),
        meal_time_category: mealCategory,
        total_calories: totalStats.calories,
        protein: totalStats.protein,
        fat: totalStats.fat,
        carbs: totalStats.carbs,
        image_url: imageUrl,
      });

      toast.success(`${mealCategory}を記録しました`);
      setFoodItems([]);
      setImageFile(null);

      // ホーム画面に戻る
      setTimeout(() => {
        setLocation("/customer/home");
      }, 1000);
    } catch (error) {
      console.error("Error saving meal:", error);
      toast.error("食事記録の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">食事を記録</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString("ja-JP", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* 食事カテゴリ選択 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">食事のカテゴリを選択</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={mealCategory} onValueChange={(value: any) => setMealCategory(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mealCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* 食事記録タブ */}
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">手動入力</TabsTrigger>
            <TabsTrigger value="photo">写真で登録</TabsTrigger>
          </TabsList>

          {/* 手動入力タブ */}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">食品情報を入力</CardTitle>
                <CardDescription>
                  食品名と量を入力すると、自動でカロリー・PFCが計算されます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="food-name">食品名 *</Label>
                    <Input
                      id="food-name"
                      placeholder="例：鶏むね肉、白米"
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">量（グラム）</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="100"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">カロリー (kcal)</Label>
                    <Input
                      id="calories"
                      type="number"
                      placeholder="自動計算"
                      value={foodCalories}
                      onChange={(e) => setFoodCalories(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">タンパク質 (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      placeholder="自動計算"
                      value={foodProtein}
                      onChange={(e) => setFoodProtein(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat">脂質 (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      placeholder="自動計算"
                      value={foodFat}
                      onChange={(e) => setFoodFat(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs">炭水化物 (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      placeholder="自動計算"
                      value={foodCarbs}
                      onChange={(e) => setFoodCarbs(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={handleAddFood} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  食品を追加
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 写真登録タブ */}
          <TabsContent value="photo">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">写真で AI 自動解析</CardTitle>
                <CardDescription>
                  食事の写真をアップロードすると、AI が PFC を自動算出します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isAnalyzing}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-600">
                        {isAnalyzing ? "解析中..." : "クリックして写真を選択"}
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 追加した食品一覧 */}
        {foodItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">追加した食品</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {foodItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.calories} kcal | P: {item.protein}g | F: {item.fat}g | C: {item.carbs}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === item.id ? (
                        <>
                          <Input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-16"
                            min="1"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(item.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-600">×{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditFood(item.id, item.quantity)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveFood(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 合計栄養情報 */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">合計</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">カロリー</p>
                    <p className="text-lg font-bold text-gray-900">{totalStats.calories} kcal</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">タンパク質</p>
                    <p className="text-lg font-bold text-gray-900">{totalStats.protein.toFixed(1)}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">脂質</p>
                    <p className="text-lg font-bold text-gray-900">{totalStats.fat.toFixed(1)}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">炭水化物</p>
                    <p className="text-lg font-bold text-gray-900">{totalStats.carbs.toFixed(1)}g</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 保存ボタン */}
        <div className="flex gap-2">
          <Button
            onClick={() => setLocation("/customer/home")}
            variant="outline"
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSaveMeal}
            disabled={isSaving || foodItems.length === 0}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "食事を記録"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
