import type { Suit, Value, CardType } from '@shared/types';

export class Card implements CardType {
  public suit: Suit;
  public value: Value;
  public isRevealed: boolean;
  
  constructor(suit: Suit, value: Value, isRevealed = false) {
    this.suit = suit;
    this.value = value;
    this.isRevealed = isRevealed;
  }
  
  // Get card representation (e.g., "A♥")
  public toString(): string {
    const suitSymbols: Record<Suit, string> = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    
    return `${this.value}${suitSymbols[this.suit]}`;
  }
  
  // Reveal the card
  public reveal(): void {
    this.isRevealed = true;
  }
  
  // Hide the card
  public hide(): void {
    this.isRevealed = false;
  }
  
  // Check if card is red
  public isRed(): boolean {
    return this.suit === 'hearts' || this.suit === 'diamonds';
  }
  
  // Check if card is black
  public isBlack(): boolean {
    return this.suit === 'clubs' || this.suit === 'spades';
  }
}
