import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'wouter';
import { useAddress } from '@thirdweb-dev/react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from './useWebSocket';
import type { GameState, PlayerAction } from '@shared/types';
import { evaluateHand } from '@/utils/pokerHelpers';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [handStrength, setHandStrength] = useState<string | undefined>();
  const [showOutcome, setShowOutcome] = useState(false);
  
  const { id } = useParams<{ id: string }>();
  const address = useAddress();
  const { toast } = useToast();
  
  const gameId = parseInt(id);
  
  // Connect to WebSocket
  const { connected, sendMessage, lastMessage, error } = useWebSocket(
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  );

  // Join game when connected
  useEffect(() => {
    if (connected && address && gameId) {
      sendMessage({
        type: 'join',
        payload: { gameId, address }
      });
      setIsLoading(false);
    }
  }, [connected, address, gameId, sendMessage]);

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'gameState') {
          setGameState(data.payload);
          
          // If game is completed, show outcome after a delay
          if (data.payload.status === 'completed') {
            setTimeout(() => {
              setShowOutcome(true);
            }, 1500);
          }
        } else if (data.type === 'error') {
          toast({
            title: "Error",
            description: data.payload,
            variant: "destructive"
          });
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    }
  }, [lastMessage, toast]);

  // Show errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to the game server. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Determine if current user is the active player
  const isCurrentPlayer = useCallback(() => {
    if (!gameState || !address) return false;
    
    const player = Object.values(gameState.players).find(
      p => p.address.toLowerCase() === address.toLowerCase()
    );
    
    return player?.id === gameState.currentPlayerId;
  }, [gameState, address]);

  // Evaluate player's hand strength
  useEffect(() => {
    if (gameState && address) {
      const player = Object.values(gameState.players).find(
        p => p.address.toLowerCase() === address.toLowerCase()
      );
      
      if (player && player.hand.length > 0 && gameState.communityCards.length > 0) {
        // Only use revealed community cards
        const revealedCommunityCards = gameState.communityCards.filter(card => card.isRevealed);
        
        if (revealedCommunityCards.length > 0) {
          const strength = evaluateHand([...player.hand, ...revealedCommunityCards]);
          setHandStrength(strength);
        }
      }
    }
  }, [gameState, address]);

  // Send player action
  const sendAction = useCallback((action: PlayerAction, amount?: number) => {
    if (!connected || !gameId || !address) {
      toast({
        title: "Error",
        description: "Not connected to the game server",
        variant: "destructive"
      });
      return;
    }
    
    sendMessage({
      type: 'action',
      payload: { gameId, action, amount, address }
    });
  }, [connected, gameId, address, sendMessage, toast]);

  // Reset the game
  const resetGame = useCallback(() => {
    setShowOutcome(false);
    
    if (connected && address) {
      // Redirect to lobby
      window.location.href = '/';
    }
  }, [connected, address]);

  return {
    gameState,
    isLoading,
    isCurrentPlayer: isCurrentPlayer(),
    handStrength,
    showOutcome,
    sendAction,
    resetGame,
  };
};
