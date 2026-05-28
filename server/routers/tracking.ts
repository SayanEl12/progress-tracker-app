import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { trackableValues, notes, aiPoints } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export const trackingRouter = router({
  // ============ TRACKABLE VALUES ============
  trackableValues: router({
    getByDate: protectedProcedure
      .input(z.object({
        trackableId: z.number(),
        date: z.string(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        return db.select().from(trackableValues).where(
          and(
            eq(trackableValues.trackableId, input.trackableId),
            eq(trackableValues.date, input.date as any)
          )
        );
      }),

    create: protectedProcedure
      .input(z.object({
        trackableId: z.number(),
        date: z.string(),
        value: z.number(),
        durationMinutes: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db.insert(trackableValues).values({
          trackableId: input.trackableId,
          date: input.date as any,
          value: input.value.toString() as any,
          durationMinutes: input.durationMinutes || null,
        });
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(trackableValues).where(eq(trackableValues.id, input));
      }),
  }),

  // ============ NOTES ============
  notes: router({
    getByMetaAndDate: protectedProcedure
      .input(z.object({
        metaId: z.number(),
        date: z.string(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        return db.select().from(notes).where(
          and(
            eq(notes.metaId, input.metaId),
            eq(notes.date, input.date as any)
          )
        );
      }),

    create: protectedProcedure
      .input(z.object({
        metaId: z.number(),
        date: z.string(),
        content: z.string().min(1, "Note content is required"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db.insert(notes).values({
          metaId: input.metaId,
          date: input.date as any,
          content: input.content,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        return db.update(notes).set({ content: input.content }).where(eq(notes.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return db.delete(notes).where(eq(notes.id, input));
      }),
  }),

  // ============ AI POINTS ============
  aiPoints: router({
    getByMetaAndDate: protectedProcedure
      .input(z.object({
        metaId: z.number(),
        date: z.string(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        return db.select().from(aiPoints).where(
          and(
            eq(aiPoints.metaId, input.metaId),
            eq(aiPoints.date, input.date as any)
          )
        );
      }),

    generateDaily: protectedProcedure
      .input(z.object({
        metaId: z.number(),
        date: z.string(),
        metaName: z.string(),
        metaDescription: z.string().optional(),
        trackablesData: z.array(z.object({
          name: z.string(),
          type: z.enum(["binary", "numeric"]),
          targetValue: z.number(),
          actualValue: z.number(),
          progress: z.number(),
        })),
        noteContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        try {
          // Prepare context for LLM
          const trackablesText = input.trackablesData
            .map(t => `- ${t.name} (${t.type}): ${t.actualValue}/${t.targetValue} (${(t.progress * 100).toFixed(0)}%)`)
            .join("\n");

          const prompt = `Evalúa la calidad del progreso de la siguiente Meta en una escala de 1 a 10.

Meta: ${input.metaName}
${input.metaDescription ? `Descripción: ${input.metaDescription}\n` : ""}
Fecha: ${input.date}

Trackeables del día:
${trackablesText}

${input.noteContent ? `Nota personal del usuario:\n"${input.noteContent}"\n` : ""}

Proporciona:
1. Una puntuación de 1 a 10
2. Una breve explicación (máximo 2 líneas)
3. Una recomendación accionable

Responde en formato JSON: {"score": number, "rationale": string, "recommendation": string}`;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "Eres un evaluador experto en productividad personal. Evalúa el progreso diario de objetivos de forma constructiva y motivadora.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "daily_evaluation",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    score: { type: "integer", minimum: 1, maximum: 10 },
                    rationale: { type: "string" },
                    recommendation: { type: "string" },
                  },
                  required: ["score", "rationale", "recommendation"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message.content;
          if (!content || typeof content !== 'string') throw new Error("No response from LLM");

          const parsed = JSON.parse(content);

          // Store AIPoint
          const result = await db.insert(aiPoints).values({
            metaId: input.metaId,
            date: input.date as any,
            score: parsed.score,
            rationale: parsed.rationale,
            recommendations: parsed.recommendation,
            inputSnapshot: JSON.stringify({
              trackables: input.trackablesData,
              note: input.noteContent,
            }),
          });

          return {
            score: parsed.score,
            rationale: parsed.rationale,
            recommendation: parsed.recommendation,
          };
        } catch (error) {
          console.error("Error generating AIPoint:", error);
          throw new Error("Failed to generate AIPoint evaluation");
        }
      }),
  }),
});
