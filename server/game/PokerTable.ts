import type { PlayerState } from '@shared/types';

export class PokerTable {
  private players: Map<number, PlayerState>;
  private maxPlayers: number;
  
  constructor(maxPlayers = 2) {
    this.players = new Map();
    this.maxPlayers = maxPlayers;
  }
  
  // Add a player to the table
  public addPlayer(player: PlayerState): boolean {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    
    this.players.set(player.id, player);
    return true;
  }
  
  // Remove a player from the table
  public removePlayer(playerId: number): boolean {
    return this.players.delete(playerId);
  }
  
  // Get a player by ID
  public getPlayer(playerId: number): PlayerState | undefined {
    return this.players.get(playerId);
  }
  
  // Get all players
  public getAllPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }
  
  // Check if table is full
  public isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }
  
  // Check if table is empty
  public isEmpty(): boolean {
    return this.players.size === 0;
  }
  
  // Get number of players
  public getPlayerCount(): number {
    return this.players.size;
  }
  
  // Clear the table
  public clear(): void {
    this.players.clear();
  }
}
