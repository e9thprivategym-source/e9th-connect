import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

// Role-based procedure for customers
const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'customer' && ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
  }
  return next({ ctx });
});

export const aiRouter = router({
  /**
   * 食事画像からPFCを自動解析
   */
  analyzeFoodImage: customerProcedure.input(
    z.object({
      imageUrl: z.string().url(),
      mealTimeCategory: z.enum(["朝食", "昼食", "夕食", "間食"]),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a nutritionist AI assistant. Analyze the food image and provide nutritional information.
            
Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "foods": [{"name": "food name", "quantity": number, "unit": "g or ml or piece"}],
  "totalCalories": number,
  "pfc": {"protein": number, "fat": number, "carbs": number},
  "micronutrients": {"vitaminA": number, "vitaminC": number, "vitaminD": number, "vitaminE": number, "vitaminK": number, "vitaminB1": number, "vitaminB2": number, "vitaminB6": number, "vitaminB12": number, "folate": number, "calcium": number, "iron": number, "magnesium": number, "zinc": number},
  "confidence": "high"
}`,
          } as any,
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: input.imageUrl,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: `食事の写真から栄養情報を抽出してください。食事カテゴリ: ${input.mealTimeCategory}`,
              },
            ],
          } as any,
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Invalid response from LLM');
      }

      // JSON を抽出（マークダウンコードブロックの場合に対応）
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const analysisResult = JSON.parse(jsonStr);

      return {
        success: true,
        analysis: analysisResult,
        mealTimeCategory: input.mealTimeCategory,
      };
    } catch (error) {
      console.error("Error analyzing food image:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to analyze food image',
      });
    }
  }),

  /**
   * E9th AI Coach からのフィードバックを生成
   */
  generateCoachFeedback: customerProcedure.input(
    z.object({
      mealData: z.object({
        foods: z.array(z.string()),
        totalCalories: z.number(),
        protein: z.number(),
        fat: z.number(),
        carbs: z.number(),
      }),
      userGoals: z.object({
        dailyCalories: z.number(),
        dailyProtein: z.number(),
        dietMode: z.enum(["通常", "バルクアップ", "ケトジェニック"]),
      }),
      dayProgress: z.object({
        caloriesConsumed: z.number(),
        proteinConsumed: z.number(),
        fatConsumed: z.number(),
        carbsConsumed: z.number(),
      }),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const systemPrompt = `You are E9th AI Coach, a supportive and knowledgeable nutrition coach for fitness enthusiasts.
Your role is to provide:
1. Logical, science-based feedback on meal choices
2. Positive, motivating encouragement
3. Practical suggestions for improvement
4. Acknowledgment of progress toward goals

Always respond in Japanese.
Keep responses concise (2-3 sentences) and actionable.
Never be judgmental about food choices.`;

      const userPrompt = `
ユーザーが以下の食事を記録しました：
食品: ${input.mealData.foods.join(', ')}
カロリー: ${input.mealData.totalCalories} kcal
PFC: タンパク質 ${input.mealData.protein}g, 脂質 ${input.mealData.fat}g, 炭水化物 ${input.mealData.carbs}g

本日の進捗:
カロリー: ${input.dayProgress.caloriesConsumed} / ${input.userGoals.dailyCalories} kcal
タンパク質: ${input.dayProgress.proteinConsumed} / ${input.userGoals.dailyProtein}g

目標: ${input.userGoals.dietMode}

この食事についてのフィードバックをください。`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const feedback = response.choices[0]?.message?.content;
      if (!feedback || typeof feedback !== 'string') {
        throw new Error('Invalid response from LLM');
      }

      return {
        success: true,
        feedback,
        coachName: "E9th AI Coach",
      };
    } catch (error) {
      console.error("Error generating coach feedback:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate feedback',
      });
    }
  }),

  /**
   * 週間の栄養分析とアドバイスを生成
   */
  generateWeeklyAnalysis: customerProcedure.input(
    z.object({
      weeklyStats: z.object({
        totalCalories: z.number(),
        avgCalories: z.number(),
        totalProtein: z.number(),
        avgProtein: z.number(),
        mealCount: z.number(),
        consistencyRate: z.number(), // 0-100
      }),
      goals: z.object({
        dailyCalories: z.number(),
        dailyProtein: z.number(),
        dietMode: z.enum(["通常", "バルクアップ", "ケトジェニック"]),
      }),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are E9th AI Coach providing weekly nutrition analysis.
Provide:
1. Summary of the week's progress
2. Highlights of what went well
3. Areas for improvement
4. Specific, actionable recommendations for next week

Always respond in Japanese.
Keep response to 3-4 sentences.`,
          },
          {
            role: "user",
            content: `
週間の栄養データ:
総カロリー: ${input.weeklyStats.totalCalories} kcal (平均: ${input.weeklyStats.avgCalories} kcal/日)
総タンパク質: ${input.weeklyStats.totalProtein}g (平均: ${input.weeklyStats.avgProtein}g/日)
食事記録数: ${input.weeklyStats.mealCount}
記録一貫性: ${input.weeklyStats.consistencyRate}%

目標:
1日のカロリー: ${input.goals.dailyCalories} kcal
1日のタンパク質: ${input.goals.dailyProtein}g
ダイエットモード: ${input.goals.dietMode}

週間の分析とアドバイスをください。`,
          },
        ],
      });

      const analysis = response.choices[0]?.message?.content;
      if (!analysis || typeof analysis !== 'string') {
        throw new Error('Invalid response from LLM');
      }

      return {
        success: true,
        analysis,
        coachName: "E9th AI Coach",
      };
    } catch (error) {
      console.error("Error generating weekly analysis:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate weekly analysis',
      });
    }
  }),

  /**
   * チャット形式のAIコーチング
   */
  coachChat: customerProcedure.input(
    z.object({
      message: z.string(),
      context: z.object({
        dietMode: z.enum(["通常", "バルクアップ", "ケトジェニック"]),
        dailyGoals: z.object({
          calories: z.number(),
          protein: z.number(),
        }),
        todayProgress: z.object({
          calories: z.number(),
          protein: z.number(),
        }),
      }),
    })
  ).mutation(async ({ ctx, input }) => {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are E9th AI Coach, a supportive nutrition and fitness coach.
Current user context:
- Diet Mode: ${input.context.dietMode}
- Daily Goals: ${input.context.dailyGoals.calories} kcal, ${input.context.dailyGoals.protein}g protein
- Today's Progress: ${input.context.todayProgress.calories} kcal, ${input.context.todayProgress.protein}g protein

Respond in Japanese with:
1. Empathy and understanding
2. Science-backed advice
3. Practical, actionable suggestions
4. Positive reinforcement

Keep responses concise and conversational.`,
          },
          {
            role: "user",
            content: input.message,
          },
        ],
      });

      const reply = response.choices[0]?.message?.content;
      if (!reply || typeof reply !== 'string') {
        throw new Error('Invalid response from LLM');
      }

      return {
        success: true,
        reply,
        coachName: "E9th AI Coach",
      };
    } catch (error) {
      console.error("Error in coach chat:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process chat message',
      });
    }
  }),
});
