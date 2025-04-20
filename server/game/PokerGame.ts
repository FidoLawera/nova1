import type { User } from '@shared/schema';
import { Deck } from './Deck';
import { HandEvaluator } from './HandEvaluator';
import { PokerTable } from './PokerTable';
import type { GameState, PlayerState, PlayerAction, GameRound, CardType } from '@shared/types';
import { SMALL_BLIND, BIG_BLIND } from '@shared/constants';

export class PokerGame {
  private id: number;
  private table: PokerTable;
  private deck: Deck;
  private handEvaluator: HandEvaluator;
  private players: Map<number, PlayerState>;
  private communityCards: CardType[];
  private pot: number;
  private currentRound: GameRound;
  private currentPlayerIdx: number;
  private dealerIdx: number;
  private lastRaiseAmount: number;
  private winnerId?: number;
  private winningHand?: string;
  private status: 'waiting' | 'active' | 'completed';

  constructor(id: number) {
    this.id = id;
    this.table = new PokerTable();
    this.deck = new Deck();
    this.handEvaluator = new HandEvaluator();
    this.players = new Map();
    this.communityCards = [];
    this.pot = 0;
    this.currentRound = 'pre-flop';
    this.currentPlayerIdx = 0;
    this.dealerIdx = 0;
    this.lastRaiseAmount = 0;
    this.status = 'waiting';
  }

  async initializeGame(player1: User, player2: User): Promise<void> {
    // Reset game state
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.currentRound = 'pre-flop';
    this.lastRaiseAmount = 0;
    this.winnerId = undefined;
    this.winningHand = undefined;
    this.status = 'active';

    // Setup players
    this.players.clear();
    this.players.set(player1.id, {
      id: player1.id,
      address: player1.address,
      username: player1.username,
      chips: player1.chips,
      hand: [],
      bet: 0,
      hasFolded: false,
      isConnected: true
    });

    this.players.set(player2.id, {
      id: player2.id,
      address: player2.address,
      username: player2.username,
      chips: player2.chips,
      hand: [],
      bet: 0,
      hasFolded: false,
      isConnected: true
    });

    // Set dealer and current player
    this.dealerIdx = 0; // First player is dealer
    
    // Deal cards
    this.dealCards();
    
    // Post blinds
    this.postBlinds();
    
    // Set current player (after blinds)
    this.currentPlayerIdx = this.dealerIdx; // Dealer acts first in heads-up
  }

  private dealCards(): void {
    // Shuffle the deck
    this.deck.shuffle();
    
    // Deal two cards to each player
    const playerIds = Array.from(this.players.keys());
    playerIds.forEach(playerId => {
      const player = this.players.get(playerId);
      if (player) {
        player.hand = [this.deck.dealCard(true), this.deck.dealCard(true)];
      }
    });
    
    // Initialize community cards (not revealed yet)
    for (let i = 0; i < 5; i++) {
      this.communityCards.push(this.deck.dealCard(false));
    }
  }

  private postBlinds(): void {
    const playerIds = Array.from(this.players.keys());
    
    // In heads-up, dealer posts small blind
    const smallBlindPlayerId = playerIds[this.dealerIdx];
    const bigBlindPlayerId = playerIds[(this.dealerIdx + 1) % playerIds.length];
    
    const smallBlindPlayer = this.players.get(smallBlindPlayerId);
    const bigBlindPlayer = this.players.get(bigBlindPlayerId);
    
    if (smallBlindPlayer && bigBlindPlayer) {
      // Post small blind
      const smallBlindAmount = Math.min(SMALL_BLIND, smallBlindPlayer.chips);
      smallBlindPlayer.chips -= smallBlindAmount;
      smallBlindPlayer.bet = smallBlindAmount;
      
      // Post big blind
      const bigBlindAmount = Math.min(BIG_BLIND, bigBlindPlayer.chips);
      bigBlindPlayer.chips -= bigBlindAmount;
      bigBlindPlayer.bet = bigBlindAmount;
      
      // Update pot
      this.pot += smallBlindAmount + bigBlindAmount;
    }
  }

  private nextPlayer(): void {
    const playerIds = Array.from(this.players.keys());
    let nextPlayerIdx = (this.currentPlayerIdx + 1) % playerIds.length;
    
    // Skip folded players
    while (
      this.players.get(playerIds[nextPlayerIdx])?.hasFolded &&
      nextPlayerIdx !== this.currentPlayerIdx
    ) {
      nextPlayerIdx = (nextPlayerIdx + 1) % playerIds.length;
    }
    
    this.currentPlayerIdx = nextPlayerIdx;
  }

  private nextRound(): void {
    // Collect bets into pot
    this.players.forEach(player => {
      this.pot += player.bet;
      player.bet = 0;
    });
    
    // Determine next round
    switch (this.currentRound) {
      case 'pre-flop':
        this.currentRound = 'flop';
        // Reveal first three cards
        for (let i = 0; i < 3; i++) {
          this.communityCards[i].isRevealed = true;
        }
        break;
      case 'flop':
        this.currentRound = 'turn';
        // Reveal fourth card
        this.communityCards[3].isRevealed = true;
        break;
      case 'turn':
        this.currentRound = 'river';
        // Reveal fifth card
        this.communityCards[4].isRevealed = true;
        break;
      case 'river':
        this.currentRound = 'showdown';
        this.determineWinner();
        break;
      case 'showdown':
        // Game is over
        this.status = 'completed';
        break;
    }
    
    // Reset for new round
    this.lastRaiseAmount = 0;
    
    // In heads-up, dealer acts first except on pre-flop
    if (this.currentRound !== 'pre-flop') {
      this.currentPlayerIdx = this.dealerIdx;
    } else {
      // On pre-flop, player after big blind acts first
      const playerIds = Array.from(this.players.keys());
      this.currentPlayerIdx = (this.dealerIdx + 1) % playerIds.length;
    }
  }

  private determineWinner(): void {
    // Get active players (not folded)
    const activePlayers = Array.from(this.players.values()).filter(
      player => !player.hasFolded
    );
    
    // If only one player left, they win
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      this.winnerId = winner.id;
      winner.chips += this.pot;
      this.status = 'completed';
      return;
    }
    
    // Otherwise, evaluate hands
    const playerHands = activePlayers.map(player => ({
      playerId: player.id,
      cards: [...player.hand, ...this.communityCards.filter(c => c.isRevealed)]
    }));
    
    const result = this.handEvaluator.evaluateWinner(playerHands);
    
    if (result) {
      this.winnerId = result.playerId;
      this.winningHand = result.handDescription;
      
      // Award pot to winner
      const winner = this.players.get(result.playerId);
      if (winner) {
        winner.chips += this.pot;
      }
      
      this.status = 'completed';
    }
  }

  private isRoundComplete(): boolean {
    // If only one player is active, round is complete
    const activePlayers = Array.from(this.players.values()).filter(
      player => !player.hasFolded
    );
    
    if (activePlayers.length === 1) {
      return true;
    }
    
    // Check if all players have acted and bets are equal
    const firstBet = activePlayers[0].bet;
    const allEqual = activePlayers.every(player => player.bet === firstBet);
    const allActed = activePlayers.every(player => player.lastAction !== undefined);
    
    return allEqual && allActed;
  }

  private getCurrentPlayerId(): number {
    const playerIds = Array.from(this.players.keys());
    return playerIds[this.currentPlayerIdx];
  }

  public async handleAction(playerId: number, action: PlayerAction, amount?: number): Promise<void> {
    // Validate it's the player's turn
    if (this.status !== 'active') {
      throw new Error('Game is not active');
    }
    
    if (playerId !== this.getCurrentPlayerId()) {
      throw new Error('Not your turn');
    }
    
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    // Handle action
    switch (action) {
      case 'fold':
        player.hasFolded = true;
        player.lastAction = 'fold';
        break;
        
      case 'check':
        // Can only check if no one has bet or player has matched the bet
        const currentBet = Math.max(...Array.from(this.players.values()).map(p => p.bet));
        if (currentBet > player.bet) {
          throw new Error('Cannot check, you must call or raise');
        }
        player.lastAction = 'check';
        break;
        
      case 'call':
        // Match the highest bet
        const highestBet = Math.max(...Array.from(this.players.values()).map(p => p.bet));
        const callAmount = highestBet - player.bet;
        
        if (callAmount <= 0) {
          throw new Error('No bet to call, you can check');
        }
        
        // If player doesn't have enough chips, they go all-in
        const actualCallAmount = Math.min(callAmount, player.chips);
        player.chips -= actualCallAmount;
        player.bet += actualCallAmount;
        player.lastAction = 'call';
        break;
        
      case 'raise':
        if (!amount) {
          throw new Error('Raise amount is required');
        }
        
        // Validate raise amount
        const minRaise = Math.max(...Array.from(this.players.values()).map(p => p.bet)) * 2;
        if (amount < minRaise) {
          throw new Error(`Raise must be at least ${minRaise}`);
        }
        
        if (amount > player.chips) {
          throw new Error('Not enough chips');
        }
        
        player.chips -= amount;
        player.bet = amount;
        player.lastAction = 'raise';
        this.lastRaiseAmount = amount;
        break;
        
      default:
        throw new Error('Invalid action');
    }
    
    // Move to next player
    this.nextPlayer();
    
    // Check if round is complete
    if (this.isRoundComplete()) {
      this.nextRound();
    }
  }

  public getGameState(): GameState {
    return {
      id: this.id,
      status: this.status,
      pot: this.pot,
      currentRound: this.currentRound,
      communityCards: this.communityCards,
      players: Object.fromEntries(this.players),
      currentPlayerId: this.getCurrentPlayerId(),
      winnerId: this.winnerId,
      winningHand: this.winningHand
    };
  }
}
