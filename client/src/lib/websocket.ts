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
