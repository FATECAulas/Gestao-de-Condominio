import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, datetime } from "drizzle-orm/mysql-core";

/**
 * Tabela de usuários (condôminos) com informações de perfil e acesso
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "sindico", "subsindico", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de unidades do condomínio (apartamentos)
 */
export const units = mysqlTable("units", {
  id: int("id").autoincrement().primaryKey(),
  unitNumber: varchar("unitNumber", { length: 50 }).notNull(), // Ex: "101", "201A"
  block: varchar("block", { length: 50 }).notNull(), // Ex: "A", "B", "Bloco 1"
  floor: int("floor").notNull(), // Andar
  userId: int("userId").references(() => users.id), // Condômino responsável
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

/**
 * Tabela de garagens com tipos: fixa, pré-determinada e sorteável
 */
export const garages = mysqlTable("garages", {
  id: int("id").autoincrement().primaryKey(),
  garageNumber: varchar("garageNumber", { length: 50 }).notNull().unique(), // Ex: "G1", "G2"
  type: mysqlEnum("type", ["fixed", "predetermined", "sortable"]).notNull(), // fixed (síndico/subsíndico), predetermined (1 veículo), sortable
  assignedUserId: int("assignedUserId").references(() => users.id), // Quem está usando a garagem
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Garage = typeof garages.$inferSelect;
export type InsertGarage = typeof garages.$inferInsert;

/**
 * Tabela de histórico de sorteios de garagens
 */
export const garageDraws = mysqlTable("garageDraws", {
  id: int("id").autoincrement().primaryKey(),
  drawDate: datetime("drawDate").notNull(), // Data e hora do sorteio
  garageId: int("garageId").notNull().references(() => garages.id),
  userId: int("userId").notNull().references(() => users.id), // Condômino sorteado
  result: mysqlEnum("result", ["won", "lost", "skipped"]).notNull(), // Resultado do sorteio
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GarageDraw = typeof garageDraws.$inferSelect;
export type InsertGarageDraw = typeof garageDraws.$inferInsert;

/**
 * Tabela de utensílios da cozinha do salão de festas
 */
export const kitchenUtensils = mysqlTable("kitchenUtensils", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Panela", "Prato"
  quantity: int("quantity").notNull().default(1),
  condition: mysqlEnum("condition", ["excellent", "good", "fair", "poor"]).notNull().default("good"), // Estado de conservação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KitchenUtensil = typeof kitchenUtensils.$inferSelect;
export type InsertKitchenUtensil = typeof kitchenUtensils.$inferInsert;

/**
 * Tabela de reservas do salão de festas
 */
export const ballroomReservations = mysqlTable("ballroomReservations", {
  id: int("id").autoincrement().primaryKey(),
  reservationDate: datetime("reservationDate").notNull(), // Data e hora da reserva
  startTime: varchar("startTime", { length: 10 }).notNull(), // HH:MM
  endTime: varchar("endTime", { length: 10 }).notNull(), // HH:MM
  userId: int("userId").notNull().references(() => users.id), // Condômino responsável
  description: text("description"), // Motivo/descrição do evento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BallroomReservation = typeof ballroomReservations.$inferSelect;
export type InsertBallroomReservation = typeof ballroomReservations.$inferInsert;

/**
 * Tabela de grupos/canais de chat
 */
export const chatGroups = mysqlTable("chatGroups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Geral", "Manutenção"
  description: text("description"),
  isPublic: boolean("isPublic").default(true).notNull(), // Público para todos ou privado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatGroup = typeof chatGroups.$inferSelect;
export type InsertChatGroup = typeof chatGroups.$inferInsert;

/**
 * Tabela de mensagens de chat
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull().references(() => chatGroups.id),
  userId: int("userId").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Tabela de membros de grupos de chat
 */
export const chatGroupMembers = mysqlTable("chatGroupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull().references(() => chatGroups.id),
  userId: int("userId").notNull().references(() => users.id),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;
export type InsertChatGroupMember = typeof chatGroupMembers.$inferInsert;
