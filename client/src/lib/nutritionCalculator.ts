/**
 * BMR（基礎代謝）とTDEE（総消費カロリー）の計算ロジック
 */

/**
 * Harris-Benedict式でBMRを計算
 * @param gender 性別 ('male' | 'female')
 * @param weight 体重（kg）
 * @param height 身長（cm）
 * @param age 年齢
 * @returns BMR（kcal/日）
 */
export function calculateBMR(
  gender: 'male' | 'female',
  weight: number,
  height: number,
  age: number
): number {
  if (gender === 'male') {
    // 男性: 88.362 + (13.397 × 体重kg) + (4.799 × 身長cm) - (5.677 × 年齢)
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    // 女性: 447.593 + (9.247 × 体重kg) + (3.098 × 身長cm) - (4.330 × 年齢)
    return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
  }
}

/**
 * TDEEを計算
 * @param bmr BMR（kcal/日）
 * @param activityLevel 運動活動強度（1.2～1.9）
 * @returns TDEE（kcal/日）
 */
export function calculateTDEE(bmr: number, activityLevel: number): number {
  return Math.round(bmr * activityLevel);
}

/**
 * ダイエットモード別のマクロ栄養素目標を計算
 * @param tdee TDEE（kcal/日）
 * @param dietMode ダイエットモード
 * @returns マクロ栄養素目標 { protein, fat, carbs }
 */
export function calculateMacroTargets(
  tdee: number,
  dietMode: 'normal' | 'bulking' | 'keto'
): { protein: number; fat: number; carbs: number } {
  switch (dietMode) {
    case 'bulking':
      // バルクアップ: タンパク質 30%, 脂質 20%, 炭水化物 50%
      return {
        protein: Math.round((tdee * 0.3) / 4), // 1g = 4kcal
        fat: Math.round((tdee * 0.2) / 9), // 1g = 9kcal
        carbs: Math.round((tdee * 0.5) / 4), // 1g = 4kcal
      };
    case 'keto':
      // ケトジェニック: タンパク質 25%, 脂質 70%, 炭水化物 5%
      return {
        protein: Math.round((tdee * 0.25) / 4),
        fat: Math.round((tdee * 0.7) / 9),
        carbs: Math.round((tdee * 0.05) / 4),
      };
    case 'normal':
    default:
      // 通常: タンパク質 25%, 脂質 25%, 炭水化物 50%
      return {
        protein: Math.round((tdee * 0.25) / 4),
        fat: Math.round((tdee * 0.25) / 9),
        carbs: Math.round((tdee * 0.5) / 4),
      };
  }
}

/**
 * トレーニング日/オフ日別のカロリー目標を計算
 * @param tdee TDEE（kcal/日）
 * @param isTrainingDay トレーニング日かどうか
 * @returns カロリー目標 { trainingDay, offDay }
 */
export function calculateDailyCalorieTargets(tdee: number): {
  trainingDay: number;
  offDay: number;
} {
  return {
    trainingDay: Math.round(tdee * 1.05), // トレーニング日は+5%
    offDay: Math.round(tdee * 0.95), // オフ日は-5%
  };
}

/**
 * 体脂肪率から除脂肪体重を計算
 * @param weight 体重（kg）
 * @param bodyFatPercentage 体脂肪率（%）
 * @returns 除脂肪体重（kg）
 */
export function calculateLeanBodyMass(
  weight: number,
  bodyFatPercentage: number
): number {
  return weight * (1 - bodyFatPercentage / 100);
}

/**
 * Mifflin-St Jeor式でBMRを計算（より正確）
 * @param gender 性別 ('male' | 'female')
 * @param weight 体重（kg）
 * @param height 身長（cm）
 * @param age 年齢
 * @returns BMR（kcal/日）
 */
export function calculateBMRMifflin(
  gender: 'male' | 'female',
  weight: number,
  height: number,
  age: number
): number {
  if (gender === 'male') {
    // 男性: (10 × 体重kg) + (6.25 × 身長cm) - (5 × 年齢) + 5
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    // 女性: (10 × 体重kg) + (6.25 × 身長cm) - (5 × 年齢) - 161
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}
