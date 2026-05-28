import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("progress router", () => {
  describe("calculateMetaProgress", () => {
    it("should calculate meta progress with default weights", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.progress.calculateMetaProgress({
        metaId: 1,
      });

      expect(result).toBeDefined();
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
    });

    it("should calculate meta progress with custom weights", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.progress.calculateMetaProgress({
        metaId: 1,
        weightAI: 0.3,
        weightTrackables: 0.7,
      });

      expect(result).toBeDefined();
      expect(result.breakdown.weightAI).toBe(0.3);
      expect(result.breakdown.weightTrackables).toBe(0.7);
    });
  });

  describe("calculateObjetivoProgress", () => {
    it("should calculate objetivo progress", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.progress.calculateObjetivoProgress(1);

      expect(result).toBeDefined();
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
    });
  });

  describe("getDashboardProgress", () => {
    it("should retrieve dashboard progress overview", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.progress.getDashboardProgress();

      expect(result).toBeDefined();
      expect(Array.isArray(result.campos)).toBe(true);
    });
  });
});
