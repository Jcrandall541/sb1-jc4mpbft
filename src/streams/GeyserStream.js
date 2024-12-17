import { logger } from '../utils/logger.js';
import { eventEmitter } from '../utils/EventEmitter.js';
import { CONFIG } from '../config/config.js';
import { YellowstoneClient } from '@triton-one/yellowstone-grpc';

export class GeyserStream {
    constructor() {
        this.client = null;
        this.subscription = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.client = new YellowstoneClient(CONFIG.RPC.GEYSER_ENDPOINT);
            
            this.isInitialized = true;
            logger.info('Geyser stream initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize geyser stream:', error);
            throw error;
        }
    }

    async subscribeToTransactions(addresses) {
        if (!this.isInitialized) {
            throw new Error('Geyser stream not initialized');
        }

        try {
            this.subscription = await this.client.subscribe({
                accounts: addresses,
                commitment: 'confirmed',
                accountExtensions: ['txn']
            });

            this.subscription.on('data', (data) => {
                this.handleTransactionData(data);
            });

            logger.info('Subscribed to transactions for addresses:', addresses);
        } catch (error) {
            logger.error('Failed to subscribe to transactions:', error);
            throw error;
        }
    }

    handleTransactionData(data) {
        try {
            const transaction = this.parseTransactionData(data);
            if (transaction) {
                eventEmitter.emit('transaction', transaction);
            }
        } catch (error) {
            logger.error('Error handling transaction data:', error);
        }
    }

    parseTransactionData(data) {
        try {
            return {
                signature: data.signature,
                slot: data.slot,
                timestamp: data.blockTime,
                instructions: data.transaction.message.instructions,
                accounts: data.transaction.message.accountKeys
            };
        } catch (error) {
            logger.error('Error parsing transaction data:', error);
            return null;
        }
    }

    async stop() {
        if (this.subscription) {
            await this.subscription.unsubscribe();
            this.subscription = null;
        }
        
        if (this.client) {
            await this.client.close();
            this.client = null;
        }

        logger.info('Geyser stream stopped');
    }
}