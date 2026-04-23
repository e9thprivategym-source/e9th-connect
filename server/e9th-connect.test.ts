import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * E9th connect アプリケーション統合テスト
 * 主要な機能とロール別アクセス制御をテスト
 */

// テスト用コンテキスト生成関数
function createMockContext(role: "customer" | "trainer" | "admin" = "customer"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "テストユーザー",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: () => {},
    } as any,
  };
}

describe("E9th connect - ロール別アクセス制御テスト", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  describe("顧客ロール", () => {
    beforeEach(() => {
      const ctx = createMockContext("customer");
      caller = appRouter.createCaller(ctx);
    });

    it("認証済みユーザーを取得できる", async () => {
      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user?.role).toBe("customer");
    });

    it("ログアウトできる", async () => {
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });

  describe("トレーナーロール", () => {
    beforeEach(() => {
      const ctx = createMockContext("trainer");
      caller = appRouter.createCaller(ctx);
    });

    it("認証済みユーザーを取得できる", async () => {
      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user?.role).toBe("trainer");
    });

    it("ログアウトできる", async () => {
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });

  describe("管理者ロール", () => {
    beforeEach(() => {
      const ctx = createMockContext("admin");
      caller = appRouter.createCaller(ctx);
    });

    it("認証済みユーザーを取得できる", async () => {
      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user?.role).toBe("admin");
    });

    it("ログアウトできる", async () => {
      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });
});

describe("E9th connect - 食事記録機能テスト", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createMockContext("customer");
    caller = appRouter.createCaller(ctx);
  });

  it("食事記録APIが存在する", () => {
    expect(caller.customer).toBeDefined();
    expect(caller.customer.recordMeal).toBeDefined();
  });

  it("AI画像解析APIが存在する", () => {
    expect(caller.ai).toBeDefined();
    expect(caller.ai.analyzeFoodImage).toBeDefined();
  });
});

describe("E9th connect - AIコーチング機能テスト", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createMockContext("customer");
    caller = appRouter.createCaller(ctx);
  });

  it("AIコーチフィードバック生成APIが存在する", () => {
    expect(caller.ai).toBeDefined();
    expect(caller.ai.generateCoachFeedback).toBeDefined();
  });
});

describe("E9th connect - トレーナー機能テスト", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createMockContext("trainer");
    caller = appRouter.createCaller(ctx);
  });

  it("担当顧客取得APIが存在する", () => {
    expect(caller.trainer).toBeDefined();
    expect(caller.trainer.getAssignedCustomers).toBeDefined();
  });

  it("顧客進捗取得APIが存在する", () => {
    expect(caller.trainer).toBeDefined();
    expect(caller.trainer.getCustomerTodayProgress).toBeDefined();
  });

  it("週間進捗取得APIが存在する", () => {
    expect(caller.trainer).toBeDefined();
    expect(caller.trainer.getWeeklyProgress).toBeDefined();
  });
});

describe("E9th connect - 管理者機能テスト", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createMockContext("admin");
    caller = appRouter.createCaller(ctx);
  });

  it("全ユーザー取得APIが存在する", () => {
    expect(caller.admin).toBeDefined();
    expect(caller.admin.getAllUsers).toBeDefined();
  });

  it("トレーナー統計取得APIが存在する", () => {
    expect(caller.admin).toBeDefined();
    expect(caller.admin.getTrainerStats).toBeDefined();
  });
});
