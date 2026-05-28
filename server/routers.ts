import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { hierarchyRouter } from "./routers/hierarchy";
import { trackingRouter } from "./routers/tracking";
import { conclusionsRouter } from "./routers/conclusions";
import { progressRouter } from "./routers/progress";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  hierarchy: hierarchyRouter,
  tracking: trackingRouter,
  conclusions: conclusionsRouter,
  progress: progressRouter,
});

export type AppRouter = typeof appRouter;
