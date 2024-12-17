import { Connection } from '@solana/web3.js';
import { logger } from '../../utils/logger.js';
import { CONFIG } from '../../config/config.js';
import { eventEmitter } from '../../utils/EventEmitter.js';

class ConnectionService {
    constructor() {
        this.connection = null;
        this.currentEndpoint = null;
        this.isConnected = false;
        this.healthCheckInterval = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            logger.info('Initializing connection service...');
            await this.connect();
            this.isInitialized = true;
            return true;
        } catch (error) {
            logger.error('Failed to initialize connection service:', error);
            throw error;
        }
    }

    async connect() {
        try {
            logger.info('Connecting to Solana network...');
            await this.establishConnection();
            this.startHealthCheck();
            return this.connection;
        } catch (error) {
            logger.error('Failed to connect:', error);
            throw error;
        }
    }

    async establishConnection() {
        const endpoints = [CONFIG.RPC.ENDPOINT, ...CONFIG.RPC.BACKUP_ENDPOINTS];
        
        for (const endpoint of endpoints) {
            try {
                this.connection = new Connection(endpoint, {
                    commitment: 'confirmed',
                    wsEndpoint: CONFIG.RPC.WSS_ENDPOINT,
                    confirmTransactionInitialTimeout: CONFIG.RPC.CONNECTION_TIMEOUT
                });

                // Verify connection
                await this.connection.getBlockHeight();
                
                this.currentEndpoint = endpoint;
                this.isConnected = true;
                
                logger.info('Connected to Solana network', { endpoint });
                eventEmitter.emit('connection:established');
                return;
            } catch (error) {
                logger.warn(`Failed to connect to ${endpoint}:`, error);
            }
        }

        throw new Error('Failed to connect to any endpoint');
    }

    getConnection() {
        if (!this.isConnected || !this.connection) {
            throw new Error('Not connected to Solana network');
        }
        return this.connection;
    }

    // ... rest of the ConnectionService implementation remains the same
}

export const connectionService = new ConnectionService();