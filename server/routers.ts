import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { customerRouter } from "./routers/customer";
import { trainerRouter } from "./routers/trainer";
import { adminRouter } from "./routers/admin";
import { aiRouter } from "./routers/ai";
import { healthRouter } from "./routers/health";
import { conditioningRouter } from "./routers/conditioning";
import { authRouter } from "./routers/auth";

// Role-based access control procedures
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

const trainerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'trainer' && ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Trainer access required' });
  }
  return next({ ctx });
});

const customerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'customer' && ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Customer access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  customer: customerRouter,
  trainer: trainerRouter,
  admin: adminRouter,
  ai: aiRouter,
  health: healthRouter,
  conditioning: conditioningRouter,
});

export type AppRouter = typeof appRouter;
