import {
  pgTable,
  pgEnum,
  uuid,
  serial,
  integer,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const ticketStatus = pgEnum("ticket_status", [
  "DRAFT",
  "SENT",
  "IN_PROGRESS",
  "RESOLVED",
  "CANCELLED",
]);

export const ticketCategory = pgEnum("ticket_category", [
  "EQUIPOS",
  "IMPRESORAS",
  "CUENTAS",
  "TRASLADOS",
  "OTRO",
]);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  zone: text("zone").notNull().default(""),
  whatsappNumber: text("whatsapp_number").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Folio correlativo legible para humanos (autoincremental), aparte del UUID interno.
  ticketNumber: integer("ticket_number"),
  callerName: text("caller_name").notNull().default(""),
  location: text("location").notNull().default(""),
  problem: text("problem").notNull().default(""),
  rawNote: text("raw_note").notNull().default(""),
  rawTag: text("raw_tag").notNull().default(""),
  category: ticketCategory("category").notNull().default("OTRO"),
  status: ticketStatus("status").notNull().default("DRAFT"),
  assignedContactId: uuid("assigned_contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rawTags = pgTable("raw_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  // Categoría padre: la etiqueta es lo específico, la categoría su agrupación
  // gruesa. Al elegir etiqueta el ticket hereda esta categoría (métricas, colores).
  category: ticketCategory("category").notNull().default("OTRO"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContactRow = typeof contacts.$inferSelect;
export type TicketRow = typeof tickets.$inferSelect;
export type RawTagRow = typeof rawTags.$inferSelect;
