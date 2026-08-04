/**
 * Shared Binance WebSocket Connection Manager
 *
 * Manages a single WebSocket connection to Binance and handles subscriptions
 * for multiple streams (tickers, klines, trades, etc). This reduces the number
 * of connections and centralizes reconnection logic.
 */

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/stream?streams=';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

interface BinanceMessage {
  [key: string]: unknown;
}

interface Subscription {
  stream: string;
  callbacks: Set<(data: BinanceMessage) => void>;
}

class BinanceWebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Subscription>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<() => void> = new Set();

  /**
   * Subscribe to a Binance stream (e.g., "btcusdt@ticker", "ethusd@kline_1s").
   * Returns an unsubscribe function.
   */
  subscribe(stream: string, callback: (data: BinanceMessage) => void): () => void {
    if (!this.subscriptions.has(stream)) {
      this.subscriptions.set(stream, {
        stream,
        callbacks: new Set(),
      });
    }

    const subscription = this.subscriptions.get(stream)!;
    subscription.callbacks.add(callback);

    // Connect if not already connected
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    } else if (this.ws.readyState === WebSocket.OPEN) {
      // If already connected, subscribe to the new stream
      this.updateSubscriptions();
    }

    // Return unsubscribe function
    return () => {
      if (!subscription) return;
      subscription.callbacks.delete(callback);

      // Remove subscription if no more callbacks
      if (subscription.callbacks.size === 0) {
        this.subscriptions.delete(stream);
        this.updateSubscriptions();
      }
    };
  }

  private connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return; // Already connecting or connected
    }

    const streams = Array.from(this.subscriptions.keys());
    if (streams.length === 0) return;

    try {
      const url = `${BINANCE_WS_BASE}${streams.join('/')}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[BinanceWSManager] Connected to WebSocket');
        this.reconnectAttempt = 0;
        this.notifyListeners();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          if (!message.stream || !message.data) return;

          const subscription = this.subscriptions.get(message.stream);
          if (subscription) {
            subscription.callbacks.forEach((callback) => {
              try {
                callback(message.data);
              } catch (error) {
                console.error('[BinanceWSManager] Error in callback:', error);
              }
            });
          }
        } catch (error) {
          console.error('[BinanceWSManager] Error parsing message:', error);
        }
      };

      this.ws.onerror = () => {
        console.error('[BinanceWSManager] WebSocket error');
      };

      this.ws.onclose = () => {
        console.log('[BinanceWSManager] WebSocket closed');
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('[BinanceWSManager] Error connecting:', error);
      this.scheduleReconnect();
    }
  }

  private updateSubscriptions(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.subscriptions.size === 0) {
      return;
    }

    const streams = Array.from(this.subscriptions.keys());
    try {
      this.ws.send(
        JSON.stringify({
          method: 'SUBSCRIBE',
          params: streams,
          id: Date.now(),
        }),
      );
    } catch (error) {
      console.error('[BinanceWSManager] Error updating subscriptions:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    const delay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempt),
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempt++;

    console.log(`[BinanceWSManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.subscriptions.size > 0) {
        this.connect();
      }
    }, delay);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('[BinanceWSManager] Error in listener:', error);
      }
    });
  }

  /**
   * Listen for connection state changes
   */
  onConnectionChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get the current connection state
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect the WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const binanceWSManager = new BinanceWebSocketManager();
