import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Chip from "./Chip";
import { CHIP_VALUES } from "@shared/constants";

interface GameOutcomeModalProps {
  isOpen: boolean;
  isWinner: boolean;
  winningHand?: string;
  pot: number;
  onPlayAgain: () => void;
}

const GameOutcomeModal = ({
  isOpen,
  isWinner,
  winningHand,
  pot,
  onPlayAgain
}: GameOutcomeModalProps) => {
  // Calculate chips for display
  const potChips = () => {
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
  
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-ui-blue rounded-lg shadow-lg max-w-md w-full p-6 mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            {isWinner ? (
              <div className="text-3xl font-poppins font-bold text-accent-gold mb-3">You Win!</div>
            ) : (
              <div className="text-3xl font-poppins font-bold text-accent-red mb-3">You Lost</div>
            )}
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="text-center">
          {isWinner && (
            <div className="flex justify-center my-4">
              {potChips().map((chip, index) => (
                <Chip 
                  key={`outcome-chip-${index}`}
                  value={chip.value}
                  count={chip.count}
                />
              ))}
            </div>
          )}
          
          <div className="text-light mb-4">
            {isWinner 
              ? `You won with ${winningHand}`
              : `Opponent won with ${winningHand}`
            }
          </div>
        </div>
        
        <AlertDialogFooter className="flex justify-center">
          <AlertDialogAction
            className="bg-accent-gold hover:bg-amber-500 text-dark font-medium py-2 px-6 rounded-lg"
            onClick={onPlayAgain}
          >
            Play Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GameOutcomeModal;
