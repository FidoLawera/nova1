import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time game updates
  const wss = new WebSocketServer({ server: httpServer });
  setupWebSocketServer(wss, storage);
  
  // API routes for game management
  app.post("/api/games", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Get or create the user
      let user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        user = await storage.createUser({ address });
      }
      
      // Create a new game
      const game = await storage.createGame({
        status: "waiting",
        player1Id: user.id,
        currentPlayerId: user.id,
        createdAt: new Date().toISOString(),
      });
      
      // Associate player with the game
      await storage.createPlayerGame({
        gameId: game.id,
        playerId: user.id,
      });
      
      return res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      return res.status(500).json({ message: "Failed to create game" });
    }
  });
  
  app.post("/api/games/join", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Get or create the user
      let user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        user = await storage.createUser({ address });
      }
      
      // Find a waiting game
      const waitingGame = await storage.findWaitingGame();
      
      if (!waitingGame) {
        return res.status(404).json({ message: "No waiting games available" });
      }
      
      // Update the game with the second player
      const updatedGame = await storage.updateGame(waitingGame.id, {
        status: "active",
        player2Id: user.id,
      });
      
      // Associate player with the game
      await storage.createPlayerGame({
        gameId: waitingGame.id,
        playerId: user.id,
      });
      
      // Start the game
      await storage.startGame(waitingGame.id);
      
      return res.status(200).json(updatedGame);
    } catch (error) {
      console.error("Error joining game:", error);
      return res.status(500).json({ message: "Failed to join game" });
    }
  });
  
  return httpServer;
}
