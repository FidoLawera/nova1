import { useEffect, useState } from "react";
import { useAddress } from "@thirdweb-dev/react";
import Card from "./Card";
import Chip from "./Chip";
import type { GameState, PlayerState, CardType } from "@shared/types";
import { CHIP_VALUES } from "@shared/constants";

interface PokerTableProps {
  gameState: GameState;
  isCurrentPlayer: boolean;
  playerHandStrength?: string;
}

const PokerTable = ({ gameState, isCurrentPlayer, playerHandStrength }: PokerTableProps) => {
  const address = useAddress();
  
  // Extract players from gameState
  const [player, opponent] = Object.values(gameState.players).reduce(
    (acc, player) => {
      if (player.address.toLowerCase() === address?.toLowerCase()) {
        acc[0] = player;
      } else {
        acc[1] = player;
      }
      return acc;
    },
    [null, null] as (PlayerState | null)[]
  );
  
  // Calculate chips for the pot
  const potChips = () => {
    const { pot } = gameState;
    if (pot === 0) return [];
    
    let remaining = pot;
    const chips: { value: number, count: number }[] = [];
    
    // Start from highest chip value
    [...CHIP_VALUES].reverse().forEach(value => {
      const count = Math.floor(remaining / value);
      if (count > 0) {
        chips.push({ value, count });
        remaining -= count * value;
      }
    });
    
    return chips;
  };
  
  // Function to get betting round name
  const getRoundName = (round: string) => {
    switch(round) {
      case 'pre-flop': return 'Pre-flop';
      case 'flop': return 'Flop';
      case 'turn': return 'Turn';
      case 'river': return 'River';
      case 'showdown': return 'Showdown';
      default: return round;
    }
  };
  
  // Get opponent action text
  const getActionText = (player: PlayerState | null) => {
    if (!player || !player.lastAction) return null;
    
    switch(player.lastAction) {
      case 'fold': return 'Folded';
      case 'check': return 'Checked';
      case 'call': return `Called ${player.bet}`;
      case 'raise': return `Raised to ${player.bet}`;
      default: return null;
    }
  };
  
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Game Status Display */}
      <div className="game-status mb-4 text-center">
        <div className="font-poppins text-xl text-accent-gold mb-2">
          {isCurrentPlayer ? "Your Turn" : "Opponent's Turn"}
        </div>
        <div className="text-sm text-medium">
          Round: {getRoundName(gameState.currentRound)} | Pot: {gameState.pot} chips
        </div>
      </div>
      
      {/* Poker Table */}
      <div className="poker-table w-full max-w-4xl aspect-[2/1] flex flex-col relative mb-6 bg-table-green border-[15px] border-[#7C2D12] rounded-[200px] shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_0_20px_rgba(0,0,0,0.3)]">
        {/* Opponent Section */}
        <div className="opponent-section w-full flex flex-col items-center justify-start p-4">
          {/* Opponent Info */}
          {opponent && (
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center border-2 border-accent-gold mr-2">
                <img 
                  src={`https://source.boringavatars.com/marble/36/${opponent.address}?colors=0F5132,0D253F,DC2626,F59E0B,1E293B`}
                  alt="Opponent avatar" 
                  className="w-full h-full rounded-full"
                />
              </div>
              <div>
                <div className="font-medium text-light">
                  {opponent.username || 'Opponent'}
                </div>
                <div className="text-sm text-medium flex items-center">
                  <i className="fas fa-coins text-accent-gold mr-1"></i>
                  <span>{opponent.chips} chips</span>
                </div>
              </div>
              
              {/* Opponent Action Indicator */}
              {getActionText(opponent) && (
                <div className="ml-4 bg-ui-blue bg-opacity-80 rounded px-3 py-1 text-sm">
                  {getActionText(opponent)}
                </div>
              )}
            </div>
          )}
          
          {/* Opponent Cards */}
          <div className="flex justify-center space-x-1">
            {opponent?.hand.map((card, index) => (
              <Card 
                key={`opponent-card-${index}`}
                card={card}
                isHidden={!gameState.winnerId || opponent.hasFolded}
                isDealt={true}
                delay={index * 200}
              />
            ))}
          </div>
        </div>
        
        {/* Community Cards & Pot */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Community Cards */}
          <div className="community-cards flex justify-center mb-4">
            {gameState.communityCards.map((card, index) => (
              <Card 
                key={`community-card-${index}`}
                card={card}
                isHidden={!card.isRevealed}
                isDealt={true}
                isRevealed={card.isRevealed}
                delay={index * 300}
              />
            ))}
          </div>
          
          {/* Pot Area */}
          <div className="pot-area flex flex-col items-center">
            <div className="text-center text-sm text-light mb-1">Pot</div>
            <div className="flex justify-center">
              {potChips().map((chip, index) => (
                <Chip 
                  key={`pot-chip-${index}`}
                  value={chip.value}
                  count={chip.count}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Player Section */}
        <div className="player-section w-full flex flex-col items-center justify-end p-4">
          {/* Player Cards */}
          <div className="flex justify-center space-x-1 mb-4">
            {player?.hand.map((card, index) => (
              <Card 
                key={`player-card-${index}`}
                card={card}
                isDealt={true}
                delay={index * 200 + 500}
              />
            ))}
          </div>
          
          {/* Player Info */}
          {player && (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center border-2 border-accent-gold mr-2">
                <img 
                  src={`https://source.boringavatars.com/marble/36/${player.address}?colors=0F5132,0D253F,DC2626,F59E0B,1E293B`}
                  alt="Player avatar" 
                  className="w-full h-full rounded-full"
                />
              </div>
              <div>
                <div className="font-medium text-light">You</div>
                <div className="text-sm text-medium flex items-center">
                  <i className="fas fa-coins text-accent-gold mr-1"></i>
                  <span>{player.chips} chips</span>
                </div>
              </div>
              
              {/* Hand Strength Indicator */}
              {playerHandStrength && (
                <div className="ml-4 bg-dark bg-opacity-80 rounded px-3 py-1 text-sm border border-accent-gold">
                  <span className="text-accent-gold font-medium">{playerHandStrength}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Current Player Indicator */}
        {isCurrentPlayer && (
          <div className="absolute top-1/2 right-0 -translate-y-1/2 transform translate-x-1/2">
            <div className="bg-accent-gold text-dark font-medium py-1 px-3 rounded-l-full flex items-center">
              <span>Your Turn</span>
              <i className="fas fa-chevron-left ml-1"></i>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default PokerTable;
