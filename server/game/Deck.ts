import { Card } from './Card';
import { SUITS, VALUES } from '@shared/constants';
import type { CardType, Suit, Value } from '@shared/types';

export class Deck {
  private cards: Card[];
  
  constructor() {
    this.cards = [];
    this.initialize();
  }
  
  // Initialize a standard 52-card deck
  private initialize(): void {
    this.cards = [];
    
    Object.values(SUITS).forEach(suit => {
      VALUES.forEach(value => {
        this.cards.push(new Card(suit as Suit, value as Value));
      });
    });
  }
  
  // Shuffle the deck using Fisher-Yates algorithm
  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  
  // Deal a card from the top of the deck
  public dealCard(isRevealed = false): CardType {
    if (this.cards.length === 0) {
      throw new Error('Deck is empty');
    }
    
    const card = this.cards.pop()!;
    card.isRevealed = isRevealed;
    return card;
  }
  
  // Get the number of remaining cards
  public getRemainingCount(): number {
    return this.cards.length;
  }
  
  // Reset the deck
  public reset(): void {
    this.initialize();
  }
}
