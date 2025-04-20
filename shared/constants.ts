export const ACTIONS = {
  FOLD: 'fold',
  CHECK: 'check',
  CALL: 'call',
  RAISE: 'raise'
} as const;

export const ROUNDS = {
  PRE_FLOP: 'pre-flop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown'
} as const;

export const GAME_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed'
} as const;

export const STARTING_CHIPS = 1000;
export const SMALL_BLIND = 5;
export const BIG_BLIND = 10;

export const CHIP_VALUES = [1, 5, 10, 25, 100];

export const HAND_RANKINGS = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush'
];

export const SUITS = {
  HEARTS: 'hearts',
  DIAMONDS: 'diamonds',
  CLUBS: 'clubs',
  SPADES: 'spades'
} as const;

export const VALUES = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'
] as const;

export const SUIT_SYMBOLS = {
  [SUITS.HEARTS]: '♥',
  [SUITS.DIAMONDS]: '♦',
  [SUITS.CLUBS]: '♣',
  [SUITS.SPADES]: '♠'
} as const;

export const SUIT_COLORS = {
  [SUITS.HEARTS]: 'text-accent-red',
  [SUITS.DIAMONDS]: 'text-accent-red',
  [SUITS.CLUBS]: 'text-dark',
  [SUITS.SPADES]: 'text-dark'
} as const;
