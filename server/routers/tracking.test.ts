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

describe("tracking router", () => {
  describe("trackableValues", () => {
    it("should create a trackable value successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tracking.trackableValues.create({
        trackableId: 1,
        date: "2026-05-28",
        value: 5,
        durationMinutes: 30,
      });

      expect(result).toBeDefined();
    });

    it("should get trackable values by date", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tracking.trackableValues.getByDate({
        trackableId: 1,
        date: "2026-05-28",
      });

      expect(result).toBeDefined();
    });
  });

  describe("notes", () => {
    it("should create a note successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tracking.notes.create({
        metaId: 1,
        date: "2026-05-28",
        content: "Test note content",
      });

      expect(result).toBeDefined();
    });

    it("should get notes by meta and date", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tracking.notes.getByMetaAndDate({
        metaId: 1,
        date: "2026-05-28",
      });

      expect(result).toBeDefined();
    });
  });

  describe("aiPoints", () => {
    it("should have generateDaily procedure", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      expect(caller.tracking.aiPoints.generateDaily).toBeDefined();
    });

    it("should get AIPoints by meta and date", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tracking.aiPoints.getByMetaAndDate({
        metaId: 1,
        date: "2026-05-28",
      });

      expect(result).toBeDefined();
    });
  });


});
