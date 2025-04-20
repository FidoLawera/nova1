# Poker Game Project Code Summary

This document contains the key files and code we've implemented for the 1v1 poker game with ThirdWeb wallet authentication.

## Client-Side Components

### WebSocket Client Implementation
```typescript
// client/src/lib/websocket.ts
import type { SocketMessage, ClientToServerEvents } from '@shared/types';

class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private callbacks: {
    onOpen?: () => void;
    onMessage?: (data: any) => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    onReconnect?: (attempt: number) => void;
    onReconnectFailed?: () => void;
  } = {};
  
  constructor(url: string) {
    // Ensure the URL uses the secure WebSocket protocol if the page is loaded over HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('ws:')) {
      this.url = url.replace('ws:', 'wss:');
    } else {
      this.url = url;
    }
    
    // Handle Replit's domain structure for WebSockets
    if (typeof window !== 'undefined' && window.location.hostname.includes('.replit.dev')) {
      // Adjust the URL to work with Replit's WebSocket routing
      const replitDomain = window.location.hostname;
      this.url = `wss://${replitDomain.replace('https://', '')}/`;
    }
    
    console.log('WebSocket URL:', this.url);
  }
  
  connect() {
    try {
      console.log('Attempting to connect to WebSocket at:', this.url);
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        if (this.callbacks.onOpen) this.callbacks.onOpen();
      };
      
      this.socket.onmessage = (event) => {
        if (this.callbacks.onMessage) {
          try {
            const data = JSON.parse(event.data);
            this.callbacks.onMessage(data);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        }
      };
      
      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (this.callbacks.onClose) this.callbacks.onClose();
        this.attemptReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.callbacks.onError) this.callbacks.onError(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }
  
  private attemptReconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      if (this.callbacks.onReconnect) {
        this.callbacks.onReconnect(this.reconnectAttempts);
      }
      
      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('Maximum reconnection attempts reached');
      if (this.callbacks.onReconnectFailed) {
        this.callbacks.onReconnectFailed();
      }
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  send(message: SocketMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }
  
  onOpen(callback: () => void) {
    this.callbacks.onOpen = callback;
  }
  
  onMessage(callback: (data: any) => void) {
    this.callbacks.onMessage = callback;
  }
  
  onClose(callback: () => void) {
    this.callbacks.onClose = callback;
  }
  
  onError(callback: (error: Event) => void) {
    this.callbacks.onError = callback;
  }
  
  onReconnect(callback: (attempt: number) => void) {
    this.callbacks.onReconnect = callback;
  }
  
  onReconnectFailed(callback: () => void) {
    this.callbacks.onReconnectFailed = callback;
  }
  
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default WebSocketClient;
```

### WebSocket Hook
```typescript
// client/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import type { SocketMessage } from '@shared/types';

export const useWebSocket = (initialUrl: string) => {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  
  // Prepare the WebSocket URL
  const getAdjustedUrl = useCallback(() => {
    let url = initialUrl;
    
    // Convert ws:// to wss:// if the page is on HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('ws:')) {
      url = url.replace('ws:', 'wss:');
    }
    
    // Handle Replit's domain structure for WebSockets
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('.replit.dev')) {
      const replitDomain = window.location.hostname;
      url = `wss://${replitDomain}/ws`;
    }
    
    console.log('Adjusted WebSocket URL:', url);
    return url;
  }, [initialUrl]);
  
  const connect = useCallback(() => {
    try {
      const url = getAdjustedUrl();
      console.log('Connecting to WebSocket at:', url);
      
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setConnected(true);
        setReconnecting(false);
        setReconnectAttempt(0);
        setError(null);
      };
      
      socket.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log('WebSocket message received:', parsedData);
          setLastMessage(parsedData);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e, event.data);
        }
      };
      
      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error');
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
        setConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempt < maxReconnectAttempts) {
          setReconnecting(true);
          const nextAttempt = reconnectAttempt + 1;
          setReconnectAttempt(nextAttempt);
          console.log(`Attempting to reconnect (${nextAttempt}/${maxReconnectAttempts})...`);
          
          if (reconnectTimeoutRef.current) {
            window.clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          setReconnecting(false);
          setError('Maximum reconnection attempts reached');
        }
      };
      
      socketRef.current = socket;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to establish connection');
      setConnected(false);
      
      // Attempt to reconnect
      if (reconnectAttempt < maxReconnectAttempts) {
        setReconnecting(true);
        const nextAttempt = reconnectAttempt + 1;
        setReconnectAttempt(nextAttempt);
        
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, reconnectDelay);
      } else {
        setReconnecting(false);
        setError('Maximum reconnection attempts reached');
      }
    }
  }, [getAdjustedUrl, reconnectAttempt]);
  
  useEffect(() => {
    connect();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);
  
  const sendMessage = useCallback((message: SocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.error('Cannot send message, socket not connected');
      return false;
    }
  }, []);
  
  const resetConnection = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    
    setReconnectAttempt(0);
    setReconnecting(false);
    connect();
  }, [connect]);
  
  return { 
    connected, 
    reconnecting, 
    reconnectAttempt, 
    maxReconnectAttempts,
    lastMessage, 
    error, 
    sendMessage,
    resetConnection
  };
};
```

### App Component
```typescript
// client/src/App.tsx
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Lobby} />
      <Route path="/game/:id" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
        <Router />
      </div>
    </TooltipProvider>
  );
}

export default App;
```

### Header Component
```typescript
// client/src/components/Header.tsx
import { useState } from "react";
import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
import { Link } from "wouter";
import { GiPokerHand } from "react-icons/gi";

const Header = () => {
  const address = useAddress();
  
  return (
    <header className="bg-slate-800 py-3 px-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <GiPokerHand className="text-amber-500 text-2xl mr-2" />
            <h1 className="text-xl font-bold text-white">Poker 1v1</h1>
          </div>
        </Link>
        
        {/* ThirdWeb Wallet Connection */}
        <div className="wallet-connection">
          <ConnectWallet 
            theme="dark"
            btnTitle="Connect Wallet"
            modalTitle="Login"
            auth={{
              loginOptional: false,
            }}
            modalSize="wide"
            modalTitleIconUrl=""
            className="!bg-amber-500 !text-slate-900 font-medium !py-2 !px-4 !rounded-lg flex items-center hover:!bg-amber-400 transition-all"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
```

### Lobby Page
```typescript
// client/src/pages/Lobby.tsx
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
```

### Main Entry Point
```typescript
// client/src/main.tsx
import { createRoot } from "react-dom/client";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// You can use any chain here for wallet connection
const activeChain = "mumbai";

createRoot(document.getElementById("root")!).render(
  <ThirdwebProvider 
    clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || ""}
    activeChain={activeChain}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ThirdwebProvider>
);
```

### Custom CSS
```css
/* client/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}

@layer components {
  .bg-ui-blue {
    @apply bg-slate-900;
  }
  
  .text-light {
    @apply text-slate-100;
  }
  
  .text-dark {
    @apply text-slate-900;
  }
  
  .border-accent-gold {
    @apply border-amber-500;
  }
  
  .text-accent-gold {
    @apply text-amber-500;
  }
  
  .bg-accent-gold {
    @apply bg-amber-500;
  }
  
  .bg-dark {
    @apply bg-slate-800;
  }
  
  .font-poppins {
    font-family: 'Poppins', sans-serif;
  }
  
  .font-inter {
    font-family: 'Inter', sans-serif;
  }
}
```

## Server-Side Components

### Routes Configuration
```typescript
// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time game updates
  const wss = new WebSocketServer({ server: httpServer });
  setupWebSocketServer(wss, storage);
  
  // API routes for game management
  app.post("/api/games", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Get or create the user
      let user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        user = await storage.createUser({ address });
      }
      
      // Create a new game
      const game = await storage.createGame({
        status: "waiting",
        player1Id: user.id,
        currentPlayerId: user.id,
        createdAt: new Date().toISOString(),
      });
      
      // Associate player with the game
      await storage.createPlayerGame({
        gameId: game.id,
        playerId: user.id,
      });
      
      return res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      return res.status(500).json({ message: "Failed to create game" });
    }
  });
  
  app.post("/api/games/join", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Get or create the user
      let user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        user = await storage.createUser({ address });
      }
      
      // Find a waiting game
      const waitingGame = await storage.findWaitingGame();
      
      if (!waitingGame) {
        return res.status(404).json({ message: "No waiting games available" });
      }
      
      // Update the game with the second player
      const updatedGame = await storage.updateGame(waitingGame.id, {
        status: "active",
        player2Id: user.id,
      });
      
      // Associate player with the game
      await storage.createPlayerGame({
        gameId: waitingGame.id,
        playerId: user.id,
      });
      
      // Start the game
      await storage.startGame(waitingGame.id);
      
      return res.status(200).json(updatedGame);
    } catch (error) {
      console.error("Error joining game:", error);
      return res.status(500).json({ message: "Failed to join game" });
    }
  });
  
  return httpServer;
}
```

### WebSocket Server Setup
```typescript
// server/websocket.ts
import { WebSocketServer, WebSocket } from 'ws';
import { IStorage } from './storage';
import type { SocketMessage, GameState } from '@shared/types';

// Map to store client connections by game ID and user address
const clients = new Map<number, Map<string, WebSocket>>();

// Map to store client addresses by WebSocket
const clientAddresses = new Map<WebSocket, { gameId: number, address: string }>();

export function setupWebSocketServer(wss: WebSocketServer, storage: IStorage) {
  wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as SocketMessage;
        
        switch (data.type) {
          case 'join':
            await handleJoin(ws, data.payload, storage);
            break;
          case 'leave':
            handleLeave(ws);
            break;
          case 'action':
            await handleAction(ws, data.payload, storage);
            break;
          default:
            sendError(ws, 'Unknown message type');
        }
      } catch (error) {
        console.error('Error processing message:', error);
        sendError(ws, 'Failed to process message');
      }
    });
    
    ws.on('close', () => {
      handleLeave(ws);
    });
  });
}

async function handleJoin(
  ws: WebSocket, 
  payload: { gameId: number; address: string },
  storage: IStorage
) {
  const { gameId, address } = payload;
  
  // Store client connection
  if (!clients.has(gameId)) {
    clients.set(gameId, new Map());
  }
  
  const gameClients = clients.get(gameId)!;
  gameClients.set(address.toLowerCase(), ws);
  
  // Store client address
  clientAddresses.set(ws, { gameId, address: address.toLowerCase() });
  
  // Get user from address
  const user = await storage.getUserByWalletAddress(address);
  
  if (!user) {
    sendError(ws, 'User not found');
    return;
  }
  
  // Get game state
  const gameState = await storage.getGameState(gameId);
  
  if (!gameState) {
    sendError(ws, 'Game not found');
    return;
  }
  
  // Send game state to the client
  sendGameState(ws, gameState);
}

function handleLeave(ws: WebSocket) {
  const clientInfo = clientAddresses.get(ws);
  
  if (clientInfo) {
    const { gameId, address } = clientInfo;
    
    // Remove client from game clients
    if (clients.has(gameId)) {
      const gameClients = clients.get(gameId)!;
      gameClients.delete(address);
      
      // Remove game if no clients left
      if (gameClients.size === 0) {
        clients.delete(gameId);
      }
    }
    
    // Remove client address
    clientAddresses.delete(ws);
  }
}

async function handleAction(
  ws: WebSocket,
  payload: { gameId: number; action: string; amount?: number; address: string },
  storage: IStorage
) {
  const { gameId, action, amount, address } = payload;
  
  // Validate client is in the game
  const clientInfo = clientAddresses.get(ws);
  if (!clientInfo || clientInfo.gameId !== gameId || clientInfo.address !== address.toLowerCase()) {
    sendError(ws, 'Invalid client');
    return;
  }
  
  // Get user from address
  const user = await storage.getUserByWalletAddress(address);
  
  if (!user) {
    sendError(ws, 'User not found');
    return;
  }
  
  try {
    // Perform action
    const gameState = await storage.performGameAction(
      gameId,
      user.id,
      action as any,
      amount
    );
    
    // Broadcast updated game state to all clients in the game
    broadcastGameState(gameId, gameState);
  } catch (error) {
    console.error('Error performing action:', error);
    sendError(ws, (error as Error).message);
  }
}

function sendGameState(ws: WebSocket, gameState: GameState) {
  ws.send(JSON.stringify({
    type: 'gameState',
    payload: gameState
  }));
}

function broadcastGameState(gameId: number, gameState: GameState) {
  const gameClients = clients.get(gameId);
  
  if (gameClients) {
    const message = JSON.stringify({
      type: 'gameState',
      payload: gameState
    });
    
    gameClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

function sendError(ws: WebSocket, message: string) {
  ws.send(JSON.stringify({
    type: 'error',
    payload: message
  }));
}
```

### Server Entry Point
```typescript
// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
```

## Configuration Files

### Theme Configuration
```json
// theme.json
{
  "variant": "vibrant",
  "primary": "hsl(43, 100%, 50%)",
  "appearance": "dark",
  "radius": 0.5
}
```

### Tailwind Configuration
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
```

## Shared Types

### Poker Solver Type Definition
```typescript
// shared/pokersolver.d.ts
declare module 'pokersolver' {
  interface HandResult {
    name: string;
    rank: number;
    cards: string[];
    value: number[];
  }

  interface HandClass {
    solve(cards: string[]): HandResult;
    winners(hands: HandResult[]): HandResult[];
  }

  export const Hand: HandClass;
}
```

### Game Types
```typescript
// shared/types.ts (partial)
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Value = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface CardType {
  suit: Suit;
  value: Value;
  isRevealed?: boolean;
}

export type GameRound = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
export type GameStatus = 'waiting' | 'active' | 'completed';
export type PlayerAction = 'fold' | 'check' | 'call' | 'raise';

export interface ChipCount {
  value: number;
  count: number;
}

export interface PlayerState {
  id: number;
  address: string;
  username?: string;
  chips: number;
  hand: CardType[];
  bet: number;
  hasFolded: boolean;
  isConnected: boolean;
  lastAction?: PlayerAction;
}

export interface GameState {
  id: number;
  status: GameStatus;
  pot: number;
  currentRound: GameRound;
  communityCards: CardType[];
  players: Record<number, PlayerState>;
  currentPlayerId?: number;
  winnerId?: number;
  winningHand?: string;
}

export interface SocketMessage {
  type: 'join' | 'leave' | 'action' | 'gameState' | 'error';
  payload: any;
}
```

## Environment Setup

### ThirdWeb Configuration
- THIRDWEB_SECRET_KEY: Used for server-side operations with ThirdWeb's API
- VITE_THIRDWEB_CLIENT_ID: Used for client-side connection to ThirdWeb

## Current Status and Next Steps

The application implements core poker game mechanics with ThirdWeb wallet authentication. The current configuration encounters WebSocket connection issues in the Replit environment due to how Replit handles WebSocket connections through proxies.

## Important Note on Icon Usage

When deploying, make sure to use the correct icons. We switched from `FaCards` (which doesn't exist) to `GiPokerHand` from the `react-icons/gi` package.

## Deployment Instructions

### Option 1: Deploy to Render (Full-Stack)

For a simpler approach, you can deploy both frontend and backend to Render:

1. Create a GitHub repository with your code
2. Sign up on [Render](https://render.com)
3. Create a new "Web Service" 
4. Configure the service:
   - Build Command: `npm install && cd client && npm install && npm run build`
   - Start Command: `NODE_ENV=production tsx server/index.ts`
5. Add environment variables:
   - `THIRDWEB_SECRET_KEY`: Your ThirdWeb secret key
   - `VITE_THIRDWEB_CLIENT_ID`: Your ThirdWeb client ID
6. Deploy

### Option 2: Deploy to Vercel (Frontend) + Render (Backend)

This split approach gives you better performance for both parts:

1. Deploy Backend to Render:
   - Configure as above, but only the server portion
   - Start Command: `NODE_ENV=production tsx server/index.ts`
   - Add environment variables:
     - `THIRDWEB_SECRET_KEY`: Your ThirdWeb secret key
     - `FRONTEND_URL`: Your Vercel frontend URL (for CORS)

2. Deploy Frontend to Vercel:
   - Connect your GitHub repository
   - Configure the build settings:
     - Framework Preset: Vite
     - Build Command: `cd client && npm install && npm run build`
     - Output Directory: `client/dist`
   - Add environment variables:
     - `VITE_THIRDWEB_CLIENT_ID`: Your ThirdWeb client ID
     - `VITE_API_URL`: Your backend URL (from Render)

### Port Configuration

Make sure your server uses the environment port:

```typescript
// In server/index.ts
const port = process.env.PORT || 5000;
```

### CORS Configuration 

If you're deploying frontend and backend separately, add this to server/index.ts:

```typescript
import cors from 'cors';

// Add after app initialization
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### WebSocket URL Updates

Update the WebSocket URL in `client/src/hooks/useWebSocket.ts` to match your deployment:

```typescript
// For production
if (process.env.NODE_ENV === 'production') {
  const backendUrl = process.env.VITE_API_URL || '';
  return backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
}
```