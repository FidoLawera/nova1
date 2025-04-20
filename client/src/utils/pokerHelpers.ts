import pokersolver from 'pokersolver';
import type { CardType } from '@shared/types';

const { Hand } = pokersolver;

// Convert our card format to pokersolver format
export const convertToPokerSolverFormat = (cards: CardType[]) => {
  return cards.map(card => {
    const value = card.value === '10' ? 'T' : card.value;
    const suit = card.suit.charAt(0).toLowerCase();
    return `${value}${suit}`;
  });
};

// Evaluate hand strength
export const evaluateHand = (cards: CardType[]): string => {
  if (cards.length < 2) return '';
  
  try {
    const pokerCards = convertToPokerSolverFormat(cards);
    const hand = Hand.solve(pokerCards);
    return hand.name;
  } catch (error) {
    console.error('Error evaluating hand:', error);
    return 'Unknown Hand';
  }
};

// Get chips representation
export const getChipsRepresentation = (amount: number): number[] => {
  const chipValues = [100, 25, 10, 5, 1];
  let remaining = amount;
  const chips: number[] = [];
  
  chipValues.forEach(value => {
    const count = Math.floor(remaining / value);
    for (let i = 0; i < count; i++) {
      chips.push(value);
    }
    remaining %= value;
  });
  
  return chips;
};

// Count occurrences of each chip value
export const countChips = (chips: number[]): { value: number; count: number }[] => {
  const counts: Record<number, number> = {};
  
  chips.forEach(value => {
    counts[value] = (counts[value] || 0) + 1;
  });
  
  return Object.entries(counts).map(([value, count]) => ({
    value: parseInt(value),
    count
  }));
};
