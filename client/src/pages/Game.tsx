import { useEffect } from "react";
import { useAddress } from "@thirdweb-dev/react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import GameActions from "@/components/GameActions";
import GameOutcomeModal from "@/components/GameOutcomeModal";
import WaitingModal from "@/components/WaitingModal";
import { useGameState } from "@/hooks/useGameState";

const Game = () => {
  const address = useAddress();
  const [, setLocation] = useLocation();
  
  const {
    gameState,
    isLoading,
    isCurrentPlayer,
    handStrength,
    showOutcome,
    sendAction,
    resetGame,
  } = useGameState();
  
  // Redirect if not connected
  useEffect(() => {
    if (!address && !isLoading) {
      setLocation("/");
    }
  }, [address, isLoading, setLocation]);
  
  // Get current player
  const currentPlayer = gameState && address 
    ? Object.values(gameState.players).find(
        p => p.address.toLowerCase() === address.toLowerCase()
      )
    : null;
  
  // Get current bet in the game
  const getCurrentBet = () => {
    if (!gameState) return 0;
    return Math.max(...Object.values(gameState.players).map(p => p.bet));
  };
  
  // Check if player can check
  const canCheck = () => {
    if (!gameState || !currentPlayer) return false;
    const currentBet = getCurrentBet();
    return currentBet === 0 || currentBet === currentPlayer.bet;
  };
  
  // Check if the current player is the winner
  const isWinner = () => {
    if (!gameState || !address) return false;
    
    const player = Object.values(gameState.players).find(
      p => p.address.toLowerCase() === address.toLowerCase()
    );
    
    return player?.id === gameState.winnerId;
  };
  
  if (isLoading || !gameState) {
    return <WaitingModal isOpen={true} message="Waiting for game to start" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {gameState && (
        <>
          <PokerTable 
            gameState={gameState}
            isCurrentPlayer={isCurrentPlayer}
            playerHandStrength={handStrength}
          />
          
          {isCurrentPlayer && currentPlayer && (
            <GameActions 
              onAction={sendAction}
              currentBet={getCurrentBet()}
              playerBet={currentPlayer.bet}
              playerChips={currentPlayer.chips}
              canCheck={canCheck()}
            />
          )}
          
          <GameOutcomeModal 
            isOpen={showOutcome}
            isWinner={isWinner()}
            winningHand={gameState.winningHand}
            pot={gameState.pot}
            onPlayAgain={resetGame}
          />
        </>
      )}
    </div>
  );
};

export default Game;
