import { useState } from "react";
import { useAddress } from "@thirdweb-dev/react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import WaitingModal from "@/components/WaitingModal";
import type { Game } from "@shared/schema";

const Lobby = () => {
  const address = useAddress();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  const handleCreateGame = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a game",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const response = await apiRequest("POST", "/api/games", {
        address
      });
      
      const game = await response.json() as Game;
      setLocation(`/game/${game.id}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      toast({
        title: "Failed to create game",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleJoinGame = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to join a game",
        variant: "destructive"
      });
      return;
    }
    
    setIsJoining(true);
    
    try {
      const response = await apiRequest("POST", "/api/games/join", {
        address
      });
      
      const game = await response.json() as Game;
      setLocation(`/game/${game.id}`);
    } catch (error) {
      console.error("Failed to join game:", error);
      toast({
        title: "No games available",
        description: "No waiting games found. Try creating a new game!",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border border-amber-500">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-500 text-center">
              Welcome to Poker 1v1
            </CardTitle>
            <CardDescription className="text-center text-white">
              Connect your wallet to start playing
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col space-y-4">
              {address ? (
                <>
                  <Button
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium p-6 text-lg"
                    onClick={handleCreateGame}
                    disabled={isCreating}
                  >
                    Create New Game
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-amber-500 text-amber-500 hover:bg-slate-700 font-medium p-6 text-lg"
                    onClick={handleJoinGame}
                    disabled={isJoining}
                  >
                    Join Available Game
                  </Button>
                </>
              ) : (
                <div className="text-center text-white p-4">
                  Please connect your wallet using the button in the top right corner
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      
      <WaitingModal 
        isOpen={isCreating} 
        message="Creating new game..."
      />
      
      <WaitingModal
        isOpen={isJoining}
        message="Finding available game..."
      />
    </div>
  );
};

export default Lobby;
