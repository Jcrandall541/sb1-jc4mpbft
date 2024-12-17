import { logger } from '../utils/logger.js';
import { eventEmitter } from '../utils/EventEmitter.js';
import { CONFIG } from '../config/config.js';

export class WebSocketStream {
    constructor() {
        this.ws = null;
        this.subscriptions = new Map();
        this.isInitialized = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async initialize() {
        try {
            await this.connect();
            this.setupHeartbeat();
            
            this.isInitialized = true;
            logger.info('WebSocket stream initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize WebSocket stream:', error);
            throw error;
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(CONFIG.RPC.WSS_ENDPOINT);

                this.ws.onopen = () => {
                    logger.info('WebSocket connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onclose = () => {
                    logger.warn('WebSocket disconnected');
                    this.handleDisconnect();
                };

                this.ws.onerror = (error) => {
                    logger.error('WebSocket error:', error);
                    reject(error);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    setupHeartbeat() {
        setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ method: 'ping' }));
            }
        }, 30000);
    }

    async subscribeToAccounts(addresses) {
        if (!this.isInitialized) {
            throw new Error('WebSocket stream not initialized');
        }

        try {
            const subscriptionId = await this.subscribe('accountSubscribe', addresses);
            this.subscriptions.set(subscriptionId, addresses);
            
            logger.info('Subscribed to accounts:', addresses);
            return subscriptionId;
        } catch (error) {
            logger.error('Failed to subscribe to accounts:', error);
            throw error;
        }
    }

    async subscribe(method, params) {
        return new Promise((resolve, reject) => {
            if (this.ws?.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const id = Date.now();
            const message = {
                jsonrpc: '2.0',
                id,
                method,
                params
            };

            this.ws.send(JSON.stringify(message));
            resolve(id);
        });
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            if (message.method === 'accountNotification') {
                eventEmitter.emit('account', message.params);
            }
        } catch (error) {
            logger.error('Error handling WebSocket message:', error);
        }
    }

    async handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(async () => {
                try {
                    await this.connect();
                    // Resubscribe to all accounts
                    for (const [id, addresses] of this.subscriptions) {
                        await this.subscribeToAccounts(addresses);
                    }
                } catch (error) {
                    logger.error('Reconnection failed:', error);
                }
            }, 5000 * Math.pow(2, this.reconnectAttempts - 1));
        } else {
            logger.error('Max reconnection attempts reached');
            eventEmitter.emit('stream:error', new Error('Connection lost'));
        }
    }

    async stop() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.subscriptions.clear();
        logger.info('WebSocket stream stopped');
    }
}