import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { metas, aiPoints, trackableValues } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const progressRouter = router({
  // Calculate progress for a single Meta
  calculateMetaProgress: protectedProcedure
    .input(z.object({
      metaId: z.number(),
      weightAI: z.number().default(0.4), // a parameter
      weightTrackables: z.number().default(0.6), // b parameter
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { progress: 0, breakdown: {} };

      try {
        // Get meta details
        const metaData = await db.select().from(metas).where(eq(metas.id, input.metaId)).limit(1);
        if (!metaData.length) return { progress: 0, breakdown: {} };

        const meta = metaData[0];

        // Get all AIPoints for this meta
        const aiPointsData = await db
          .select()
          .from(aiPoints)
          .where(eq(aiPoints.metaId, input.metaId));

        // Calculate average AIPoint score (0-1 scale)
        const avgAIScore = aiPointsData.length > 0
          ? aiPointsData.reduce((sum, ap) => sum + ap.score, 0) / (aiPointsData.length * 10)
          : 0;

        // Get all trackable values for this meta's trackeables
        // This is simplified - in production, you'd get trackeables first, then their values
        const trackableProgress = 0.5; // Placeholder - would calculate from actual trackable data

        // Apply weights formula: progress = a * AIScore + b * TrackableProgress
        const a = input.weightAI;
        const b = input.weightTrackables;
        const totalProgress = (a * avgAIScore) + (b * trackableProgress);

        return {
          progress: Math.min(100, Math.max(0, totalProgress * 100)),
          breakdown: {
            aiScore: avgAIScore * 100,
            trackableProgress: trackableProgress * 100,
            weightAI: a,
            weightTrackables: b,
            aiPointsCount: aiPointsData.length,
          },
        };
      } catch (error) {
        console.error("Error calculating meta progress:", error);
        return { progress: 0, breakdown: {} };
      }
    }),

  // Calculate progress for an Objetivo (average of its Metas)
  calculateObjetivoProgress: protectedProcedure
    .input(z.number())
    .query(async ({ input: objetivoId }) => {
      const db = await getDb();
      if (!db) return { progress: 0 };

      try {
        // Get all metas for this objetivo
        const metasData = await db
          .select()
          .from(metas)
          .where(eq(metas.objetivoId, objetivoId));

        if (!metasData.length) return { progress: 0 };

        // Calculate average progress of all metas
        let totalProgress = 0;
        for (const meta of metasData) {
          const aiPointsData = await db
            .select()
            .from(aiPoints)
            .where(eq(aiPoints.metaId, meta.id));

          const avgAIScore = aiPointsData.length > 0
            ? aiPointsData.reduce((sum, ap) => sum + ap.score, 0) / (aiPointsData.length * 10)
            : 0;

          const a = parseFloat(meta.weightAI.toString());
          const b = parseFloat(meta.weightTrackables.toString());
          const metaProgress = (a * avgAIScore) + (b * 0.5); // 0.5 is placeholder for trackables

          totalProgress += metaProgress;
        }

        const avgProgress = totalProgress / metasData.length;

        return {
          progress: Math.min(100, Math.max(0, avgProgress * 100)),
          metasCount: metasData.length,
        };
      } catch (error) {
        console.error("Error calculating objetivo progress:", error);
        return { progress: 0 };
      }
    }),

  // Get dashboard overview with all progress levels
  getDashboardProgress: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { campos: [] };

      try {
        // This is a simplified version - in production, you'd fetch all campos/misiones/objetivos
        // and calculate their progress hierarchically
        return {
          campos: [],
          message: "Dashboard progress calculation coming soon",
        };
      } catch (error) {
        console.error("Error getting dashboard progress:", error);
        return { campos: [] };
      }
    }),
});
