import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, campos, misiones, objetivos, metas, trackeables, trackableValues, notes, aiPoints, weeklyConclusions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CAMPOS QUERIES ============

export async function getCamposByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campos).where(eq(campos.userId, userId));
}

export async function getCampoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campos).where(eq(campos.id, id)).limit(1);
  return result[0];
}

// ============ MISIONES QUERIES ============

export async function getMisionesByCampoId(campoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(misiones).where(eq(misiones.campoId, campoId));
}

export async function getMisionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(misiones).where(eq(misiones.id, id)).limit(1);
  return result[0];
}

// ============ OBJETIVOS QUERIES ============

export async function getObjetivosByMisionId(misionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(objetivos).where(eq(objetivos.misionId, misionId));
}

export async function getObjetivoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(objetivos).where(eq(objetivos.id, id)).limit(1);
  return result[0];
}

// ============ METAS QUERIES ============

export async function getMetasByObjetivoId(objetivoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(metas).where(eq(metas.objetivoId, objetivoId));
}

export async function getMetaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(metas).where(eq(metas.id, id)).limit(1);
  return result[0];
}

export async function getActiveMetasByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  const dateStr = date.toISOString().split('T')[0];
  return db.select().from(metas).where(
    and(
      sql`${metas.startDate} <= ${dateStr}`,
      sql`${metas.endDate} >= ${dateStr}`
    )
  );
}

// ============ TRACKEABLES QUERIES ============

export async function getTrackablesByMetaId(metaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trackeables).where(eq(trackeables.metaId, metaId));
}

export async function getTrackableById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trackeables).where(eq(trackeables.id, id)).limit(1);
  return result[0];
}

// ============ TRACKABLE VALUES QUERIES ============

export async function getTrackableValuesByDate(trackableId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trackableValues).where(
    and(
      eq(trackableValues.trackableId, trackableId),
      sql`DATE(${trackableValues.date}) = ${date}`
    )
  );
}

export async function getTrackableValuesForWeek(trackableId: number, weekStart: string, weekEnd: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trackableValues).where(
    and(
      eq(trackableValues.trackableId, trackableId),
      sql`DATE(${trackableValues.date}) >= ${weekStart}`,
      sql`DATE(${trackableValues.date}) <= ${weekEnd}`
    )
  );
}

// ============ NOTES QUERIES ============

export async function getNotesByMetaAndDate(metaId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notes).where(
    and(
      eq(notes.metaId, metaId),
      sql`DATE(${notes.date}) = ${date}`
    )
  );
}

export async function getNotesByMetaForWeek(metaId: number, weekStart: string, weekEnd: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notes).where(
    and(
      eq(notes.metaId, metaId),
      sql`DATE(${notes.date}) >= ${weekStart}`,
      sql`DATE(${notes.date}) <= ${weekEnd}`
    )
  );
}

// ============ AI POINTS QUERIES ============

export async function getAIPointsByMetaAndDate(metaId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiPoints).where(
    and(
      eq(aiPoints.metaId, metaId),
      sql`DATE(${aiPoints.date}) = ${date}`
    )
  );
}

export async function getAIPointsByMetaForWeek(metaId: number, weekStart: string, weekEnd: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiPoints).where(
    and(
      eq(aiPoints.metaId, metaId),
      sql`${aiPoints.date} >= ${weekStart}`,
      sql`${aiPoints.date} <= ${weekEnd}`
    )
  );
}

// ============ WEEKLY CONCLUSIONS QUERIES ============

export async function getWeeklyConclusion(metaId: number, weekStart: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(weeklyConclusions).where(
    and(
      eq(weeklyConclusions.metaId, metaId),
      eq(weeklyConclusions.weekStart, new Date(weekStart))
    )
  ).limit(1);
  return result[0];
}

export async function getWeeklyConclusions(metaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyConclusions).where(
    eq(weeklyConclusions.metaId, metaId)
  ).orderBy(desc(weeklyConclusions.weekStart));
}
