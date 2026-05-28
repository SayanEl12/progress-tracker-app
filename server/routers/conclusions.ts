import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { weeklyConclusions, aiPoints, notes } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { startOfWeek, endOfWeek, format } from "date-fns";

export const conclusionsRouter = router({
  generateWeeklyConclusion: protectedProcedure
    .input(z.object({
      metaId: z.number(),
      weekStart: z.string(), // "yyyy-MM-dd"
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Get all AIPoints for the week
        const weekStart = new Date(input.weekStart);
        const weekEnd = endOfWeek(weekStart);

        const aiPointsData = await db
          .select()
          .from(aiPoints)
          .where(
            and(
              eq(aiPoints.metaId, input.metaId),
              gte(aiPoints.date, input.weekStart as any),
              lte(aiPoints.date, format(weekEnd, "yyyy-MM-dd") as any)
            )
          );

        // Get all notes for the week
        const notesData = await db
          .select()
          .from(notes)
          .where(
            and(
              eq(notes.metaId, input.metaId),
              gte(notes.date, input.weekStart as any),
              lte(notes.date, format(weekEnd, "yyyy-MM-dd") as any)
            )
          );

        if (aiPointsData.length === 0 && notesData.length === 0) {
          throw new Error("No data available for this week");
        }

        // Prepare summary for LLM
        const aiPointsSummary = aiPointsData
          .map(ap => `${ap.date}: ${ap.score}/10 - ${ap.rationale}`)
          .join("\n");

        const notesSummary = notesData
          .map(n => `${n.date}: ${n.content}`)
          .join("\n");

        const prompt = `Genera una conclusión ejecutiva de la semana para una Meta basada en los siguientes datos:

Evaluaciones AIPoint diarias:
${aiPointsSummary || "No hay evaluaciones"}

Notas personales:
${notesSummary || "No hay notas"}

Proporciona:
1. Un resumen de progreso (máximo 3 líneas)
2. Patrones observados
3. Áreas de mejora
4. Recomendaciones para la próxima semana

Responde en formato JSON: {"summary": string, "patterns": string, "improvements": string, "nextWeekRecommendations": string}`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Eres un coach de productividad personal experto. Genera conclusiones semanales constructivas y motivadoras.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "weekly_conclusion",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  patterns: { type: "string" },
                  improvements: { type: "string" },
                  nextWeekRecommendations: { type: "string" },
                },
                required: ["summary", "patterns", "improvements", "nextWeekRecommendations"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message.content;
        if (!content || typeof content !== "string") {
          throw new Error("No response from LLM");
        }

        const parsed = JSON.parse(content);

        // Calculate average score
        const avgScore = aiPointsData.length > 0
          ? aiPointsData.reduce((sum, ap) => sum + ap.score, 0) / aiPointsData.length
          : 0;

        // Store conclusion
        const result = await db.insert(weeklyConclusions).values({
          metaId: input.metaId,
          weekStart: input.weekStart as any,
          weekEnd: format(weekEnd, "yyyy-MM-dd") as any,
          conclusion: parsed.summary,
          summary: parsed.summary,
          patterns: parsed.patterns,
          recommendations: parsed.nextWeekRecommendations,
          evidenceSnapshot: JSON.stringify({
            aiPointsCount: aiPointsData.length,
            notesCount: notesData.length,
            scores: aiPointsData.map(ap => ap.score),
          }),
        });

        return {
          success: true,
          averageScore: avgScore,
          summary: parsed.summary,
          patterns: parsed.patterns,

          recommendations: parsed.nextWeekRecommendations,
        };
      } catch (error) {
        console.error("Error generating weekly conclusion:", error);
        throw new Error("Failed to generate weekly conclusion");
      }
    }),

  getWeeklyConclusion: protectedProcedure
    .input(z.object({
      metaId: z.number(),
      weekStart: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(weeklyConclusions)
        .where(
          and(
            eq(weeklyConclusions.metaId, input.metaId),
            eq(weeklyConclusions.weekStart, input.weekStart as any)
          )
        )
        .limit(1);

      return result[0] || null;
    }),
});
