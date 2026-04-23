import { describe, it, expect } from 'vitest';
import { searchFood, calculateNutrition, FOOD_DATABASE } from './foodDatabase';

describe('foodDatabase', () => {
  describe('searchFood', () => {
    it('should find food by exact name', () => {
      const result = searchFood('白米');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('白米');
      expect(result?.caloriesPer100g).toBe(156);
    });

    it('should find food by lowercase name', () => {
      const result = searchFood('鶏むね肉');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('鶏むね肉');
      expect(result?.proteinPer100g).toBe(21.3);
    });

    it('should find food by partial match', () => {
      const result = searchFood('鶏');
      expect(result).not.toBeNull();
      expect(result?.name).toMatch(/^鶏/);
    });

    it('should return null for unknown food', () => {
      const result = searchFood('未知の食品');
      expect(result).toBeNull();
    });

    it('should handle whitespace', () => {
      const result = searchFood('  白米  ');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('白米');
    });
  });

  describe('calculateNutrition', () => {
    it('should calculate nutrition for 100g of white rice', () => {
      const result = calculateNutrition('白米', 100);
      expect(result).not.toBeNull();
      expect(result?.calories).toBe(156);
      expect(result?.protein).toBe(2.7);
      expect(result?.fat).toBe(0.3);
      expect(result?.carbs).toBe(35.6);
    });

    it('should calculate nutrition for 150g of chicken breast', () => {
      const result = calculateNutrition('鶏むね肉', 150);
      expect(result).not.toBeNull();
      expect(result?.calories).toBe(Math.round((121 * 150) / 100)); // 181
      expect(result?.protein).toBe(Math.round((21.3 * 150) / 100 * 10) / 10); // 31.95
    });

    it('should return null for unknown food', () => {
      const result = calculateNutrition('未知の食品', 100);
      expect(result).toBeNull();
    });

    it('should handle zero quantity', () => {
      const result = calculateNutrition('白米', 0);
      expect(result).not.toBeNull();
      expect(result?.calories).toBe(0);
    });

    it('should round values appropriately', () => {
      const result = calculateNutrition('白米', 150);
      expect(result).not.toBeNull();
      // Check that values are rounded to 1 decimal place for protein, fat, carbs
      expect(result?.protein).toBe(Math.round((2.7 * 150) / 100 * 10) / 10);
    });
  });

  describe('FOOD_DATABASE', () => {
    it('should contain common foods', () => {
      expect(FOOD_DATABASE['白米']).toBeDefined();
      expect(FOOD_DATABASE['鶏むね肉']).toBeDefined();
      expect(FOOD_DATABASE['卵']).toBeDefined();
      expect(FOOD_DATABASE['ブロッコリー']).toBeDefined();
    });

    it('should have valid nutrition data', () => {
      Object.values(FOOD_DATABASE).forEach((food) => {
        expect(food.caloriesPer100g).toBeGreaterThanOrEqual(0);
        expect(food.proteinPer100g).toBeGreaterThanOrEqual(0);
        expect(food.fatPer100g).toBeGreaterThanOrEqual(0);
        expect(food.carbsPer100g).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
