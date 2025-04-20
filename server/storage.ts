import { users, type User, type InsertUser, games, type Game, type InsertGame, playerGames, type PlayerGame, type InsertPlayerGame } from "@shared/schema";
import { PokerGame } from "./game/PokerGame";
import { STARTING_CHIPS } from "@shared/constants";
import type { GameState, PlayerAction } from "@shared/types";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(address: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserChips(userId: number, chips: number): Promise<User>;
  
  // Game methods
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game>;
  findWaitingGame(): Promise<Game | undefined>;
  startGame(gameId: number): Promise<Game>;
  endGame(gameId: number, winnerId: number): Promise<Game>;
  
  // Player game methods
  getPlayerGame(gameId: number, playerId: number): Promise<PlayerGame | undefined>;
  createPlayerGame(playerGame: InsertPlayerGame): Promise<PlayerGame>;
  updatePlayerGame(gameId: number, playerId: number, updates: Partial<PlayerGame>): Promise<PlayerGame>;
  getPlayerGamesForGame(gameId: number): Promise<PlayerGame[]>;
  
  // Game state methods
  getGameState(gameId: number): Promise<GameState | undefined>;
  performGameAction(gameId: number, playerId: number, action: PlayerAction, amount?: number): Promise<GameState>;
  resetGame(gameId: number): Promise<Game>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private playerGames: Map<string, PlayerGame>;
  private activeGames: Map<number, PokerGame>;
  private userIdCounter: number;
  private gameIdCounter: number;
  private playerGameIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.playerGames = new Map();
    this.activeGames = new Map();
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    this.playerGameIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByWalletAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.address.toLowerCase() === address.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      chips: STARTING_CHIPS,
      isActive: true
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserChips(userId: number, chips: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedUser = { ...user, chips };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Game methods
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameIdCounter++;
    const game: Game = {
      ...insertGame,
      id,
      pot: 0,
      currentRound: 'pre-flop',
      communityCards: [],
    };
    this.games.set(id, game);
    return game;
  }
  
  async updateGame(id: number, updates: Partial<Game>): Promise<Game> {
    const game = await this.getGame(id);
    if (!game) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  
  async findWaitingGame(): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(
      (game) => game.status === 'waiting'
    );
  }
  
  async startGame(gameId: number): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    if (!game.player1Id || !game.player2Id) {
      throw new Error(`Game with ID ${gameId} doesn't have two players`);
    }
    
    // Create poker game instance
    const pokerGame = new PokerGame(gameId);
    
    // Get player information
    const player1 = await this.getUser(game.player1Id);
    const player2 = await this.getUser(game.player2Id);
    
    if (!player1 || !player2) {
      throw new Error(`Players not found for game ${gameId}`);
    }
    
    // Initialize the game
    await pokerGame.initializeGame(player1, player2);
    
    // Store active game
    this.activeGames.set(gameId, pokerGame);
    
    // Update game status
    return this.updateGame(gameId, {
      status: 'active'
    });
  }
  
  async endGame(gameId: number, winnerId: number): Promise<Game> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    // Update game status and winner
    return this.updateGame(gameId, {
      status: 'completed',
      winnerId
    });
  }
  
  // Player game methods
  async getPlayerGame(gameId: number, playerId: number): Promise<PlayerGame | undefined> {
    const key = `${gameId}-${playerId}`;
    return this.playerGames.get(key);
  }
  
  async createPlayerGame(insertPlayerGame: InsertPlayerGame): Promise<PlayerGame> {
    const id = this.playerGameIdCounter++;
    const playerGame: PlayerGame = {
      ...insertPlayerGame,
      id,
      hand: [],
      bet: 0,
      hasFolded: false
    };
    
    const key = `${playerGame.gameId}-${playerGame.playerId}`;
    this.playerGames.set(key, playerGame);
    return playerGame;
  }
  
  async updatePlayerGame(gameId: number, playerId: number, updates: Partial<PlayerGame>): Promise<PlayerGame> {
    const key = `${gameId}-${playerId}`;
    const playerGame = this.playerGames.get(key);
    
    if (!playerGame) {
      throw new Error(`Player game not found for game ${gameId} and player ${playerId}`);
    }
    
    const updatedPlayerGame = { ...playerGame, ...updates };
    this.playerGames.set(key, updatedPlayerGame);
    return updatedPlayerGame;
  }
  
  async getPlayerGamesForGame(gameId: number): Promise<PlayerGame[]> {
    return Array.from(this.playerGames.values()).filter(
      (pg) => pg.gameId === gameId
    );
  }
  
  // Game state methods
  async getGameState(gameId: number): Promise<GameState | undefined> {
    const activeGame = this.activeGames.get(gameId);
    if (!activeGame) {
      return undefined;
    }
    
    return activeGame.getGameState();
  }
  
  async performGameAction(gameId: number, playerId: number, action: PlayerAction, amount?: number): Promise<GameState> {
    const activeGame = this.activeGames.get(gameId);
    if (!activeGame) {
      throw new Error(`No active game found with ID ${gameId}`);
    }
    
    // Perform the action
    await activeGame.handleAction(playerId, action, amount);
    
    // Return updated game state
    return activeGame.getGameState();
  }
  
  async resetGame(gameId: number): Promise<Game> {
    // Remove the active game
    this.activeGames.delete(gameId);
    
    // Get the game
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }
    
    // Create a new game with the same players
    const newGame = await this.createGame({
      status: 'active',
      player1Id: game.player2Id, // swap positions
      player2Id: game.player1Id,
      currentPlayerId: game.player2Id, // previous player 2 starts
      createdAt: new Date().toISOString(),
    });
    
    // Create player games
    if (game.player1Id) {
      await this.createPlayerGame({
        gameId: newGame.id,
        playerId: game.player1Id,
      });
    }
    
    if (game.player2Id) {
      await this.createPlayerGame({
        gameId: newGame.id,
        playerId: game.player2Id,
      });
    }
    
    // Start the new game
    await this.startGame(newGame.id);
    
    return newGame;
  }
}

export const storage = new MemStorage();
