import { logger } from './utils/logger.js';
import { TradingEngine } from './core/TradingEngine.js';

export class EliteMultiPoolSniper {
    constructor() {
        this.tradingEngine = new TradingEngine();
        this.isInitialized = false;
    }

    async initialize() {
        try {
            logger.info('Initializing Elite Multi-Pool Sniper...');
            
            // Initialize trading engine
            await this.tradingEngine.initialize();
            
            this.isInitialized = true;
            logger.info('Elite Multi-Pool Sniper initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize sniper:', error);
            throw error;
        }
    }

    async start() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await this.tradingEngine.start();
            
            logger.info('🚀 Elite Multi-Pool Sniper Active');
            return true;
        } catch (error) {
            logger.error('Error starting sniper:', error);
            throw error;
        }
    }
}