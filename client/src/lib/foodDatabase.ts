/**
 * 食品マスターデータベース
 * 一般的な食品の栄養情報を含む
 */

export interface FoodData {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
}

export const FOOD_DATABASE: Record<string, FoodData> = {
  // 穀類
  '白米': { name: '白米', caloriesPer100g: 156, proteinPer100g: 2.7, fatPer100g: 0.3, carbsPer100g: 35.6 },
  '玄米': { name: '玄米', caloriesPer100g: 150, proteinPer100g: 2.8, fatPer100g: 1.0, carbsPer100g: 32.6 },
  'うどん': { name: 'うどん', caloriesPer100g: 95, proteinPer100g: 2.6, fatPer100g: 0.3, carbsPer100g: 21.0 },
  'そば': { name: 'そば', caloriesPer100g: 99, proteinPer100g: 3.6, fatPer100g: 0.4, carbsPer100g: 20.1 },
  'パン': { name: 'パン', caloriesPer100g: 264, proteinPer100g: 9.3, fatPer100g: 3.3, carbsPer100g: 46.7 },

  // タンパク質食材
  '鶏むね肉': { name: '鶏むね肉', caloriesPer100g: 121, proteinPer100g: 21.3, fatPer100g: 1.9, carbsPer100g: 0 },
  '鶏もも肉': { name: '鶏もも肉', caloriesPer100g: 204, proteinPer100g: 16.6, fatPer100g: 14.2, carbsPer100g: 0 },
  '牛肉': { name: '牛肉', caloriesPer100g: 250, proteinPer100g: 19.3, fatPer100g: 19.3, carbsPer100g: 0 },
  '豚肉': { name: '豚肉', caloriesPer100g: 263, proteinPer100g: 27.3, fatPer100g: 17.7, carbsPer100g: 0 },
  'サーモン': { name: 'サーモン', caloriesPer100g: 208, proteinPer100g: 20.1, fatPer100g: 13.6, carbsPer100g: 0 },
  'マグロ': { name: 'マグロ', caloriesPer100g: 125, proteinPer100g: 26.4, fatPer100g: 0.7, carbsPer100g: 0 },
  '卵': { name: '卵', caloriesPer100g: 155, proteinPer100g: 12.3, fatPer100g: 11.0, carbsPer100g: 1.1 },
  '豆腐': { name: '豆腐', caloriesPer100g: 55, proteinPer100g: 4.9, fatPer100g: 3.0, carbsPer100g: 1.5 },
  '納豆': { name: '納豆', caloriesPer100g: 200, proteinPer100g: 16.5, fatPer100g: 10.0, carbsPer100g: 10.8 },

  // 野菜
  'ブロッコリー': { name: 'ブロッコリー', caloriesPer100g: 34, proteinPer100g: 2.8, fatPer100g: 0.4, carbsPer100g: 5.2 },
  'ニンジン': { name: 'ニンジン', caloriesPer100g: 37, proteinPer100g: 0.6, fatPer100g: 0.2, carbsPer100g: 8.8 },
  'ほうれん草': { name: 'ほうれん草', caloriesPer100g: 23, proteinPer100g: 2.2, fatPer100g: 0.4, carbsPer100g: 3.1 },
  'トマト': { name: 'トマト', caloriesPer100g: 18, proteinPer100g: 0.7, fatPer100g: 0.2, carbsPer100g: 3.7 },
  'キャベツ': { name: 'キャベツ', caloriesPer100g: 23, proteinPer100g: 1.3, fatPer100g: 0.1, carbsPer100g: 5.2 },

  // 果物
  'バナナ': { name: 'バナナ', caloriesPer100g: 89, proteinPer100g: 1.1, fatPer100g: 0.3, carbsPer100g: 22.0 },
  'リンゴ': { name: 'リンゴ', caloriesPer100g: 52, proteinPer100g: 0.3, fatPer100g: 0.2, carbsPer100g: 13.8 },
  'オレンジ': { name: 'オレンジ', caloriesPer100g: 47, proteinPer100g: 0.7, fatPer100g: 0.3, carbsPer100g: 11.8 },

  // 乳製品
  'ヨーグルト': { name: 'ヨーグルト', caloriesPer100g: 62, proteinPer100g: 3.6, fatPer100g: 3.0, carbsPer100g: 3.6 },
  'チーズ': { name: 'チーズ', caloriesPer100g: 402, proteinPer100g: 25.7, fatPer100g: 33.7, carbsPer100g: 1.3 },
  '牛乳': { name: '牛乳', caloriesPer100g: 61, proteinPer100g: 3.2, fatPer100g: 3.6, carbsPer100g: 4.8 },
};

/**
 * 食品名から栄養情報を検索
 * @param foodName 食品名
 * @returns 栄養情報、見つからない場合はnull
 */
export function searchFood(foodName: string): FoodData | null {
  const normalizedName = foodName.toLowerCase().trim();
  
  // 完全一致を検索
  for (const [key, value] of Object.entries(FOOD_DATABASE)) {
    if (key.toLowerCase() === normalizedName) {
      return value;
    }
  }
  
  // 部分一致を検索
  for (const [key, value] of Object.entries(FOOD_DATABASE)) {
    if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return null;
}

/**
 * 食品名と量からPFCを計算
 * @param foodName 食品名
 * @param quantity グラム単位の量
 * @returns 計算されたPFC情報
 */
export function calculateNutrition(foodName: string, quantity: number) {
  const food = searchFood(foodName);
  
  if (!food) {
    return null;
  }
  
  return {
    name: food.name,
    calories: Math.round((food.caloriesPer100g * quantity) / 100),
    protein: Math.round((food.proteinPer100g * quantity) / 100 * 10) / 10,
    fat: Math.round((food.fatPer100g * quantity) / 100 * 10) / 10,
    carbs: Math.round((food.carbsPer100g * quantity) / 100 * 10) / 10,
  };
}
