npmimport { logger } from '../../utils/logger.js';
import { eventEmitter } from '../../utils/EventEmitter.js';
import { RateLimiter } from '../RateLimiter.js';
import { PoolManager } from '../PoolManager.js';
import { OpportunityAnalyzer } from '../analysis/OpportunityAnalyzer.js';
import { PositionManager } from '../position/PositionManager.js';
import { connection } from '../../config/connection.js';
import { wallet } from '../../utils/wallet.js';
import { tradingConfig } from '../../config/config.js';

export class TradingEngine {
    constructor() {
        this.rateLimiter = new RateLimiter();
        this.poolManager = new PoolManager();
        this.opportunityAnalyzer = new OpportunityAnalyzer();
        this.positionManager = new PositionManager();
        this.active = false;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            logger.info('Initializing trading engine...');
            
            // Initialize core components sequentially
            await this.poolManager.initialize();
            this.setupEventListeners();
            
            this.initialized = true;
            logger.info('Trading engine initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize trading engine:', error);
            throw error;
        }
    }

    setupEventListeners() {
        eventEmitter.on('opportunity', async (opportunity) => {
            if (!this.active) return;
            
            try {
                await this.handleOpportunity(opportunity);
            } catch (error) {
                logger.error('Error handling opportunity:', error);
            }
        });

        eventEmitter.on('position:update', async (update) => {
            try {
                await this.handlePositionUpdate(update);
            } catch (error) {
                logger.error('Error handling position update:', error);
            }
        });
    }

    async handleOpportunity(opportunity) {
        if (!opportunity || !opportunity.pool) {
            logger.error('Invalid opportunity data');
            return;
        }

        try {
            if (await this.rateLimiter.canTrade(opportunity.pool)) {
                const position = await this.positionManager.openPosition({
                    pool: opportunity.pool,
                    type: opportunity.type,
                    amount: opportunity.suggestedSize,
                    expectedProfit: opportunity.expectedProfit
                });

                logger.info('Position opened for opportunity', {
                    positionId: position.id,
                    pool: opportunity.pool,
                    expectedProfit: opportunity.expectedProfit
                });
            }
        } catch (error) {
            logger.error('Failed to handle opportunity:', error);
        }
    }

    async handlePositionUpdate(update) {
        try {
            await this.positionManager.updatePosition(update);
        } catch (error) {
            logger.error('Failed to handle position update:', error);
        }
    }

    async start() {
        try {
            // Ensure initialization
            if (!this.initialized) {
                await this.initialize();
            }
            
            this.active = true;
            await this.poolManager.start();
            
            logger.info('Trading engine started successfully', {
                config: {
                    tradesPerDay: tradingConfig.trading.tradesPerDay,
                    targetProfit: tradingConfig.trading.targetProfit,
                    tradeSize: `${tradingConfig.trading.minTradeSize}-${tradingConfig.trading.maxTradeSize} SOL`
                }
            });
            
            return true;
        } catch (error) {
            this.active = false;
            logger.error('Failed to start trading engine:', error);
            throw error;
        }
    }

    async stop() {
        try {
            this.active = false;
            await this.poolManager.stop();
            logger.info('Trading engine stopped');
        } catch (error) {
            logger.error('Error stopping trading engine:', error);
        }
    }
}