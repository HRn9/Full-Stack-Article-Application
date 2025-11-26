import { useEffect, useRef, useState, useCallback } from 'react';
import type { Notification } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5001';

export function useWebSocket() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const notificationIdsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING ||
      isConnectingRef.current
    ) {
      console.log('WebSocket already connected or connecting, skipping...');
      return;
    }

    isConnectingRef.current = true;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          console.log('WebSocket notification received:', notification);

          const notificationId = `${notification.timestamp}-${notification.type}-${notification.articleId || ''}`;

          if (notificationIdsRef.current.has(notificationId)) {
            console.log(
              'Duplicate notification detected, skipping:',
              notificationId
            );
            return;
          }

          notificationIdsRef.current.add(notificationId);

          if (notificationIdsRef.current.size > 10) {
            const idsArray = Array.from(notificationIdsRef.current);
            notificationIdsRef.current = new Set(idsArray.slice(-10));
          }

          setNotifications((prev) => [notification, ...prev]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        isConnectingRef.current = false;

        const maxAttempts = 5;
        if (reconnectAttemptsRef.current < maxAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxAttempts})...`
          );

          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      isConnectingRef.current = false;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        console.log('Cleaning up WebSocket connection');
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      isConnectingRef.current = false;
      setIsConnected(false);
    };
  }, [connect]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    notificationIdsRef.current.clear();
  }, []);

  const removeNotification = useCallback((timestamp: string) => {
    setNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
  }, []);

  return {
    notifications,
    isConnected,
    clearNotifications,
    removeNotification,
  };
}
