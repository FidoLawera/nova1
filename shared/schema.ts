import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  username: text("username"),
  chips: integer("chips").notNull().default(1000),
  isActive: boolean("is_active").notNull().default(true),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  status: text("status").notNull(), // 'waiting', 'active', 'completed'
  pot: integer("pot").notNull().default(0),
  currentRound: text("current_round").notNull(), // 'pre-flop', 'flop', 'turn', 'river', 'showdown'
  communityCards: jsonb("community_cards").$type<string[]>().notNull().default([]),
  player1Id: integer("player1_id").references(() => users.id),
  player2Id: integer("player2_id").references(() => users.id),
  currentPlayerId: integer("current_player_id").references(() => users.id),
  winnerId: integer("winner_id").references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const playerGames = pgTable("player_games", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  playerId: integer("player_id").references(() => users.id).notNull(),
  hand: jsonb("hand").$type<string[]>().notNull().default([]),
  bet: integer("bet").notNull().default(0),
  hasFolded: boolean("has_folded").notNull().default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  address: true,
  username: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  status: true,
  player1Id: true,
  player2Id: true,
  currentPlayerId: true,
  createdAt: true,
});

export const insertPlayerGameSchema = createInsertSchema(playerGames).pick({
  gameId: true,
  playerId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertPlayerGame = z.infer<typeof insertPlayerGameSchema>;
export type PlayerGame = typeof playerGames.$inferSelect;
