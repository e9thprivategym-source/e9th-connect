import { describe, it, expect } from 'vitest';
import {
  calculateBMR,
  calculateTDEE,
  calculateMacroTargets,
  calculateDailyCalorieTargets,
  calculateLeanBodyMass,
  calculateBMRMifflin,
} from './nutritionCalculator';

describe('nutritionCalculator', () => {
  describe('calculateBMR', () => {
    it('should calculate BMR for male using Harris-Benedict formula', () => {
      // 男性: 170cm, 70kg, 25歳
      const bmr = calculateBMR('male', 70, 170, 25);
      // 88.362 + (13.397 × 70) + (4.799 × 170) - (5.677 × 25)
      // = 88.362 + 937.79 + 815.83 - 141.925 = 1700.057
      expect(bmr).toBeCloseTo(1700, 0);
    });

    it('should calculate BMR for female using Harris-Benedict formula', () => {
      // 女性: 160cm, 55kg, 25歳
      const bmr = calculateBMR('female', 55, 160, 25);
      // 447.593 + (9.247 × 55) + (3.098 × 160) - (4.330 × 25)
      // = 447.593 + 508.585 + 495.68 - 108.25 = 1343.608
      expect(bmr).toBeCloseTo(1344, 0);
    });
  });

  describe('calculateTDEE', () => {
    it('should calculate TDEE correctly', () => {
      const bmr = 1700;
      const tdee = calculateTDEE(bmr, 1.55);
      expect(tdee).toBe(Math.round(1700 * 1.55)); // 2635
    });

    it('should handle different activity levels', () => {
      const bmr = 1700;
      expect(calculateTDEE(bmr, 1.2)).toBe(2040);
      expect(calculateTDEE(bmr, 1.9)).toBe(3230);
    });
  });

  describe('calculateMacroTargets', () => {
    it('should calculate macro targets for normal diet mode', () => {
      const tdee = 2000;
      const macros = calculateMacroTargets(tdee, 'normal');
      // タンパク質 25% (500kcal / 4 = 125g)
      // 脂質 25% (500kcal / 9 = 55.5g)
      // 炭水化物 50% (1000kcal / 4 = 250g)
      expect(macros.protein).toBe(125);
      expect(macros.fat).toBe(56);
      expect(macros.carbs).toBe(250);
    });

    it('should calculate macro targets for bulking diet mode', () => {
      const tdee = 2000;
      const macros = calculateMacroTargets(tdee, 'bulking');
      // タンパク質 30% (600kcal / 4 = 150g)
      // 脂質 20% (400kcal / 9 = 44.4g)
      // 炭水化物 50% (1000kcal / 4 = 250g)
      expect(macros.protein).toBe(150);
      expect(macros.fat).toBe(44);
      expect(macros.carbs).toBe(250);
    });

    it('should calculate macro targets for keto diet mode', () => {
      const tdee = 2000;
      const macros = calculateMacroTargets(tdee, 'keto');
      // タンパク質 25% (500kcal / 4 = 125g)
      // 脂質 70% (1400kcal / 9 = 155.5g)
      // 炭水化物 5% (100kcal / 4 = 25g)
      expect(macros.protein).toBe(125);
      expect(macros.fat).toBe(156);
      expect(macros.carbs).toBe(25);
    });
  });

  describe('calculateDailyCalorieTargets', () => {
    it('should calculate training day and off day calories', () => {
      const tdee = 2000;
      const targets = calculateDailyCalorieTargets(tdee);
      expect(targets.trainingDay).toBe(2100); // +5%
      expect(targets.offDay).toBe(1900); // -5%
    });
  });

  describe('calculateLeanBodyMass', () => {
    it('should calculate lean body mass correctly', () => {
      const weight = 70;
      const bodyFatPercentage = 15;
      const lbm = calculateLeanBodyMass(weight, bodyFatPercentage);
      // 70 × (1 - 0.15) = 70 × 0.85 = 59.5
      expect(lbm).toBe(59.5);
    });

    it('should handle different body fat percentages', () => {
      const weight = 80;
      expect(calculateLeanBodyMass(weight, 10)).toBe(72);
      expect(calculateLeanBodyMass(weight, 20)).toBe(64);
      expect(calculateLeanBodyMass(weight, 30)).toBe(56);
    });
  });

  describe('calculateBMRMifflin', () => {
    it('should calculate BMR for male using Mifflin-St Jeor formula', () => {
      // 男性: 170cm, 70kg, 25歳
      const bmr = calculateBMRMifflin('male', 70, 170, 25);
      // (10 × 70) + (6.25 × 170) - (5 × 25) + 5
      // = 700 + 1062.5 - 125 + 5 = 1642.5
      expect(bmr).toBeCloseTo(1642.5, 0);
    });

    it('should calculate BMR for female using Mifflin-St Jeor formula', () => {
      // 女性: 160cm, 55kg, 25歳
      const bmr = calculateBMRMifflin('female', 55, 160, 25);
      // (10 × 55) + (6.25 × 160) - (5 × 25) - 161
      // = 550 + 1000 - 125 - 161 = 1264
      expect(bmr).toBeCloseTo(1264, 0);
    });
  });
});
