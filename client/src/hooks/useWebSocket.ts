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
