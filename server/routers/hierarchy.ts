import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { campos, misiones, objetivos, metas, trackeables, trackableValues, notes, aiPoints, weeklyConclusions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const hierarchyRouter = router({
  // ============ CAMPOS ============
  campos: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(campos).where(eq(campos.userId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Campo name is required"),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const result = await db.insert(campos).values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || null,
        });
        
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        
        return db.update(campos).set(updateData).where(eq(campos.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(campos).where(eq(campos.id, input));
      }),
  }),

  // ============ MISIONES ============
  misiones: router({
    list: protectedProcedure
      .input(z.number())
      .query(async ({ input: campoId }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(misiones).where(eq(misiones.campoId, campoId));
      }),

    create: protectedProcedure
      .input(z.object({
        campoId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db.insert(misiones).values({
          campoId: input.campoId,
          name: input.name,
          description: input.description || null,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        
        return db.update(misiones).set(updateData).where(eq(misiones.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(misiones).where(eq(misiones.id, input));
      }),
  }),

  // ============ OBJETIVOS ============
  objetivos: router({
    list: protectedProcedure
      .input(z.number())
      .query(async ({ input: misionId }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(objetivos).where(eq(objetivos.misionId, misionId));
      }),

    create: protectedProcedure
      .input(z.object({
        misionId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db.insert(objetivos).values({
          misionId: input.misionId,
          name: input.name,
          description: input.description || null,
          startDate: input.startDate as any,
          endDate: input.endDate as any,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.startDate) updateData.startDate = input.startDate;
        if (input.endDate) updateData.endDate = input.endDate;
        
        return db.update(objetivos).set(updateData).where(eq(objetivos.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(objetivos).where(eq(objetivos.id, input));
      }),
  }),

  // ============ METAS ============
  metas: router({
    list: protectedProcedure
      .input(z.number())
      .query(async ({ input: objetivoId }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(metas).where(eq(metas.objetivoId, objetivoId));
      }),

    create: protectedProcedure
      .input(z.object({
        objetivoId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        weightAI: z.number().optional(),
        weightTrackables: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db.insert(metas).values({
          objetivoId: input.objetivoId,
          name: input.name,
          description: input.description || null,
          startDate: input.startDate as any,
          endDate: input.endDate as any,
          weightAI: input.weightAI?.toString() as any || "0.40",
          weightTrackables: input.weightTrackables?.toString() as any || "0.60",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        weightAI: z.number().optional(),
        weightTrackables: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.startDate) updateData.startDate = input.startDate;
        if (input.endDate) updateData.endDate = input.endDate;
        if (input.weightAI !== undefined) updateData.weightAI = input.weightAI.toString();
        if (input.weightTrackables !== undefined) updateData.weightTrackables = input.weightTrackables.toString();
        
        return db.update(metas).set(updateData).where(eq(metas.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(metas).where(eq(metas.id, input));
      }),
  }),

  // ============ TRACKEABLES ============
  trackeables: router({
    list: protectedProcedure
      .input(z.number())
      .query(async ({ input: metaId }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(trackeables).where(eq(trackeables.metaId, metaId));
      }),

    create: protectedProcedure
      .input(z.object({
        metaId: z.number(),
        name: z.string().min(1),
        type: z.enum(["binary", "numeric"]),
        targetValue: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db.insert(trackeables).values({
          metaId: input.metaId,
          name: input.name,
          type: input.type,
          targetValue: input.targetValue.toString() as any,
          description: input.description || null,
        });
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(trackeables).where(eq(trackeables.id, input));
      }),
  }),
});
