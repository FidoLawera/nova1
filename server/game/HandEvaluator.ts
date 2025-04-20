import pokersolver from 'pokersolver';
import type { CardType } from '@shared/types';

const { Hand } = pokersolver;

interface HandEvaluation {
  playerId: number;
  handRank: number;
  handDescription: string;
}

export class HandEvaluator {
  // Convert our card format to pokersolver format
  private convertToPokerSolverFormat(cards: CardType[]): string[] {
    return cards.map(card => {
      const value = card.value === '10' ? 'T' : card.value;
      const suit = card.suit.charAt(0).toLowerCase();
      return `${value}${suit}`;
    });
  }
  
  // Evaluate a single hand
  public evaluateHand(cards: CardType[]): HandEvaluation | null {
    if (cards.length < 5) {
      return null;
    }
    
    try {
      const pokerCards = this.convertToPokerSolverFormat(cards);
      const hand = Hand.solve(pokerCards);
      
      return {
        playerId: 0, // Placeholder, will be set by caller
        handRank: hand.rank,
        handDescription: hand.name
      };
    } catch (error) {
      console.error('Error evaluating hand:', error);
      return null;
    }
  }
  
  // Find the winner among multiple hands
  public evaluateWinner(playerHands: { playerId: number; cards: CardType[] }[]): HandEvaluation | null {
    if (playerHands.length === 0) {
      return null;
    }
    
    // Evaluate each hand
    const evaluations = playerHands
      .map(({ playerId, cards }) => {
        const evaluation = this.evaluateHand(cards);
        
        if (!evaluation) {
          return null;
        }
        
        return {
          ...evaluation,
          playerId
        };
      })
      .filter(Boolean) as HandEvaluation[];
    
    if (evaluations.length === 0) {
      return null;
    }
    
    // Find the winner (highest rank)
    return evaluations.reduce((winner, current) => {
      if (!winner || current.handRank > winner.handRank) {
        return current;
      }
      return winner;
    }, null as HandEvaluation | null);
  }
}
