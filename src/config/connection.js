import { Connection } from '@solana/web3.js';
import { CONFIG } from './config.js';
import { logger } from '../utils/logger.js';
import { connectionState } from '../utils/connection/ConnectionState.js';
import { ConnectionRetry } from '../utils/connection/ConnectionRetry.js';

class ConnectionManager {
    constructor() {
        this.connection = null;
        this.wsConnection = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            await this.initializeConnection();
            await this.verifyConnection();
            
            this.isInitialized = true;
            logger.info('Connection initialized successfully');
            
            this.startHealthCheck();
            return true;
        } catch (error) {
            connectionState.setRpcState(false, error);
            logger.error('Failed to initialize connection:', error);
            throw error;
        }
    }

    async initializeConnection() {
        const endpoints = [CONFIG.RPC.ENDPOINT, ...CONFIG.RPC.BACKUP_ENDPOINTS];
        
        return await ConnectionRetry.withFallback(async (endpoint) => {
            return await ConnectionRetry.withRetry(async () => {
                this.connection = new Connection(endpoint, {
                    commitment: 'confirmed',
                    wsEndpoint: CONFIG.RPC.WSS_ENDPOINT
                });
                return this.connection;
            });
        }, endpoints);
    }

    async verifyConnection() {
        try {
            const { blockhash } = await this.connection.getLatestBlockhash();
            connectionState.setRpcState(true);
            return true;
        } catch (error) {
            connectionState.setRpcState(false, error);
            throw error;
        }
    }

    startHealthCheck() {
        setInterval(async () => {
            try {
                await this.verifyConnection();
            } catch (error) {
                logger.error('Health check failed:', error);
                await this.handleConnectionFailure();
            }
        }, 30000);
    }

    async handleConnectionFailure() {
        const attempts = connectionState.incrementReconnectAttempts();
        
        if (attempts <= 3) {
            try {
                await this.initializeConnection();
                connectionState.resetReconnectAttempts();
            } catch (error) {
                logger.error('Reconnection failed:', error);
            }
        } else {
            logger.error('Max reconnection attempts reached');
        }
    }

    getConnection() {
        if (!this.isInitialized) {
            throw new Error('Connection not initialized');
        }
        return this.connection;
    }
}

export const connectionManager = new ConnectionManager();