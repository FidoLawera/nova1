import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  HiX, 
  HiCheck, 
  HiReply, 
  HiArrowUp, 
  HiPlus, 
  HiMinus 
} from "react-icons/hi";
import type { PlayerAction } from "@shared/types";

interface GameActionsProps {
  onAction: (action: PlayerAction, amount?: number) => void;
  currentBet: number;
  playerBet: number;
  playerChips: number;
  canCheck: boolean;
}

const GameActions = ({ 
  onAction,
  currentBet,
  playerBet,
  playerChips,
  canCheck,
}: GameActionsProps) => {
  const [betAmount, setBetAmount] = useState(Math.min(currentBet * 2, playerChips));
  const [isRaiseMenuOpen, setIsRaiseMenuOpen] = useState(false);
  
  const handleRaiseClick = () => {
    setIsRaiseMenuOpen(!isRaiseMenuOpen);
  };
  
  const handleRaise = () => {
    onAction('raise', betAmount);
    setIsRaiseMenuOpen(false);
  };
  
  const callAmount = currentBet - playerBet;
  const canCall = callAmount > 0 && callAmount <= playerChips;
  const canRaise = playerChips > currentBet;
  
  const increaseBet = () => {
    const maxBet = playerChips;
    setBetAmount(prev => Math.min(prev + 25, maxBet));
  };
  
  const decreaseBet = () => {
    const minBet = currentBet * 2;
    setBetAmount(prev => Math.max(prev - 25, minBet));
  };
  
  return (
    <div className="game-actions w-full max-w-4xl">
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        <Button
          variant="outline"
          className="action-btn bg-dark hover:bg-gray-700 text-light font-medium py-2 px-6 rounded-lg"
          onClick={() => onAction('fold')}
        >
          <HiX className="mr-1" /> Fold
        </Button>
        
        <Button
          variant="default"
          className="action-btn bg-ui-blue hover:bg-blue-800 text-light font-medium py-2 px-6 rounded-lg"
          onClick={() => onAction('check')}
          disabled={!canCheck}
        >
          <HiCheck className="mr-1" /> Check
        </Button>
        
        <Button
          variant="default"
          className="action-btn bg-ui-blue hover:bg-blue-800 text-light font-medium py-2 px-6 rounded-lg"
          onClick={() => onAction('call')}
          disabled={!canCall}
        >
          <HiReply className="mr-1" /> Call {callAmount}
        </Button>
        
        <div className="relative group">
          <Button
            variant="default"
            className="action-btn bg-accent-gold hover:bg-amber-500 text-dark font-medium py-2 px-6 rounded-lg"
            onClick={handleRaiseClick}
            disabled={!canRaise}
          >
            <HiArrowUp className="mr-1" /> Raise
          </Button>
          
          {/* Raise Amount Selector */}
          {isRaiseMenuOpen && (
            <div className="absolute bottom-full mb-2 left-0 bg-dark rounded-lg shadow-lg p-2">
              <div className="flex flex-col space-y-1">
                <div className="text-xs text-medium mb-1">Bet Amount</div>
                <div className="flex items-center">
                  <Button
                    variant="default"
                    size="icon"
                    className="w-6 h-6 rounded bg-ui-blue text-light flex items-center justify-center"
                    onClick={decreaseBet}
                    disabled={betAmount <= currentBet * 2}
                  >
                    <HiMinus className="h-3 w-3" />
                  </Button>
                  <div className="mx-2 px-3 py-1 bg-ui-blue rounded">
                    <span>{betAmount}</span>
                  </div>
                  <Button
                    variant="default"
                    size="icon"
                    className="w-6 h-6 rounded bg-ui-blue text-light flex items-center justify-center"
                    onClick={increaseBet}
                    disabled={betAmount >= playerChips}
                  >
                    <HiPlus className="h-3 w-3" />
                  </Button>
                </div>
                <Button 
                  variant="default"
                  className="mt-2 bg-accent-gold hover:bg-amber-500 text-dark"
                  onClick={handleRaise}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameActions;
