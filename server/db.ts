import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  units, Unit, InsertUnit,
  garages, Garage, InsertGarage,
  garageDraws, GarageDraw, InsertGarageDraw,
  kitchenUtensils, KitchenUtensil, InsertKitchenUtensil,
  ballroomReservations, BallroomReservation, InsertBallroomReservation,
  chatGroups, ChatGroup, InsertChatGroup,
  chatMessages, ChatMessage, InsertChatMessage,
  chatGroupMembers, ChatGroupMember, InsertChatGroupMember
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ============ USERS ============
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

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
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

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ role: role as any }).where(eq(users.id, userId));
  return getUserById(userId);
}

// ============ UNITS ============
export async function createUnit(unit: InsertUnit) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(units).values(unit);
  return result;
}

export async function getAllUnits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(units);
}

export async function getUnitById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(units).where(eq(units.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUnitsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(units).where(eq(units.userId, userId));
}

export async function updateUnit(id: number, data: Partial<Unit>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(units).set(data).where(eq(units.id, id));
  return getUnitById(id);
}

// ============ GARAGES ============
export async function createGarage(garage: InsertGarage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(garages).values(garage);
  return result;
}

export async function getAllGarages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(garages);
}

export async function getGarageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(garages).where(eq(garages.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGaragesByType(type: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(garages).where(eq(garages.type, type as any));
}

export async function getAvailableSortableGarages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(garages).where(
    and(
      eq(garages.type, 'sortable' as any),
      eq(garages.assignedUserId, null as any)
    )
  );
}

export async function updateGarage(id: number, data: Partial<Garage>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(garages).set(data).where(eq(garages.id, id));
  return getGarageById(id);
}

export async function getGarageByNumber(garageNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(garages).where(eq(garages.garageNumber, garageNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ GARAGE DRAWS ============
export async function createGarageDraw(draw: InsertGarageDraw) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(garageDraws).values(draw);
  return result;
}

export async function getGarageDrawHistory(limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(garageDraws).orderBy(desc(garageDraws.drawDate));
  return limit ? query.limit(limit) : query;
}

export async function getGarageDrawsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(garageDraws).where(eq(garageDraws.userId, userId)).orderBy(desc(garageDraws.drawDate));
}

export async function getGarageDrawsByGarage(garageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(garageDraws).where(eq(garageDraws.garageId, garageId)).orderBy(desc(garageDraws.drawDate));
}

// ============ KITCHEN UTENSILS ============
export async function createKitchenUtensil(utensil: InsertKitchenUtensil) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(kitchenUtensils).values(utensil);
  return result;
}

export async function getAllKitchenUtensils() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kitchenUtensils);
}

export async function getKitchenUtensilById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(kitchenUtensils).where(eq(kitchenUtensils.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateKitchenUtensil(id: number, data: Partial<KitchenUtensil>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(kitchenUtensils).set(data).where(eq(kitchenUtensils.id, id));
  return getKitchenUtensilById(id);
}

export async function deleteKitchenUtensil(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(kitchenUtensils).where(eq(kitchenUtensils.id, id));
  return true;
}

// ============ BALLROOM RESERVATIONS ============
export async function createBallroomReservation(reservation: InsertBallroomReservation) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(ballroomReservations).values(reservation);
  return result;
}

export async function getAllBallroomReservations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ballroomReservations).orderBy(asc(ballroomReservations.reservationDate));
}

export async function getBallroomReservationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ballroomReservations).where(eq(ballroomReservations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBallroomReservationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ballroomReservations).where(eq(ballroomReservations.userId, userId)).orderBy(asc(ballroomReservations.reservationDate));
}

export async function updateBallroomReservation(id: number, data: Partial<BallroomReservation>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(ballroomReservations).set(data).where(eq(ballroomReservations.id, id));
  return getBallroomReservationById(id);
}

export async function deleteBallroomReservation(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(ballroomReservations).where(eq(ballroomReservations.id, id));
  return true;
}

// ============ CHAT GROUPS ============
export async function createChatGroup(group: InsertChatGroup) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatGroups).values(group);
  return result;
}

export async function getAllChatGroups() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatGroups);
}

export async function getChatGroupById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatGroups).where(eq(chatGroups.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateChatGroup(id: number, data: Partial<ChatGroup>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(chatGroups).set(data).where(eq(chatGroups.id, id));
  return getChatGroupById(id);
}

// ============ CHAT MESSAGES ============
export async function createChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatMessages).values(message);
  return result;
}

export async function getChatMessagesByGroup(groupId: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(chatMessages).where(eq(chatMessages.groupId, groupId)).orderBy(asc(chatMessages.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function deleteChatMessage(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(chatMessages).where(eq(chatMessages.id, id));
  return true;
}

// ============ CHAT GROUP MEMBERS ============
export async function addChatGroupMember(member: InsertChatGroupMember) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatGroupMembers).values(member);
  return result;
}

export async function getChatGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatGroupMembers).where(eq(chatGroupMembers.groupId, groupId));
}

export async function removeChatGroupMember(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(chatGroupMembers).where(
    and(
      eq(chatGroupMembers.groupId, groupId),
      eq(chatGroupMembers.userId, userId)
    )
  );
  return true;
}

export async function isMemberOfGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(chatGroupMembers).where(
    and(
      eq(chatGroupMembers.groupId, groupId),
      eq(chatGroupMembers.userId, userId)
    )
  ).limit(1);
  return result.length > 0;
}
