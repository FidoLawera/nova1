export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Value = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface CardType {
  suit: Suit;
  value: Value;
  isRevealed?: boolean;
}

export type GameRound = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

export type GameStatus = 'waiting' | 'active' | 'completed';

export type PlayerAction = 'fold' | 'check' | 'call' | 'raise';

export interface ChipCount {
  value: number;
  count: number;
}

export interface PlayerState {
  id: number;
  address: string;
  username?: string;
  chips: number;
  hand: CardType[];
  bet: number;
  hasFolded: boolean;
  isConnected: boolean;
  lastAction?: PlayerAction;
}

export interface GameState {
  id: number;
  status: GameStatus;
  pot: number;
  currentRound: GameRound;
  communityCards: CardType[];
  players: Record<number, PlayerState>;
  currentPlayerId?: number;
  winnerId?: number;
  winningHand?: string;
}

export interface SocketMessage {
  type: 'join' | 'leave' | 'action' | 'gameState' | 'error';
  payload: any;
}

export interface ClientToServerEvents {
  join: (gameId: number, userAddress: string) => void;
  leave: (gameId: number, userAddress: string) => void;
  action: (gameId: number, action: PlayerAction, amount?: number) => void;
}

export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  error: (message: string) => void;
}
