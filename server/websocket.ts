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
