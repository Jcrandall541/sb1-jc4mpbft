import { logger } from '../../utils/logger.js';
import { eventEmitter } from '../../utils/EventEmitter.js';
import { connection } from '../../config/connection.js';
import { PublicKey } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import { tradingConfig } from '../../config/config.js';

export class PoolScanner {
    constructor() {
        this.pools = new Map();
        this.active = false;
        this.subscriptions = new Map();
        this.scanInterval = null;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Pre-initialize core components
            await this.initializeMarkets();
            this.initialized = true;
            logger.info('Pool scanner initialized');
        } catch (error) {
            logger.error('Failed to initialize pool scanner:', error);
            throw error;
        }
    }

    async start() {
        try {
            logger.info('Starting pool scanner...');
            
            // Ensure initialization
            if (!this.initialized) {
                await this.initialize();
            }
            
            this.active = true;
            this.startSubscriptions();
            
            this.scanInterval = setInterval(() => {
                if (this.active) {
                    this.checkPoolUpdates();
                }
            }, 1000);
            
            logger.info('Pool scanner started successfully');
            return true;
        } catch (error) {
            logger.error('Failed to start pool scanner:', error);
            throw error;
        }
    }

    async initializeMarkets() {
        try {
            const programId = new PublicKey(tradingConfig.dex.serumProgramId);
            
            logger.info('Initializing markets...');
            
            // Get all market addresses with better filtering
            const accounts = await connection.getProgramAccounts(programId, {
                filters: [
                    { dataSize: 388 }, // Size of a Serum market account
                ],
                commitment: 'confirmed'
            });

            logger.info(`Found ${accounts.length} potential markets`);

            // Process markets in smaller batches
            const batchSize = 5;
            for (let i = 0; i < accounts.length; i += batchSize) {
                const batch = accounts.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (account) => {
                    try {
                        const market = await Market.load(
                            connection,
                            account.pubkey,
                            {},
                            programId
                        );

                        if (market && await this.isValidMarket(market)) {
                            this.pools.set(market.address.toString(), {
                                address: market.address.toString(),
                                market,
                                lastUpdate: Date.now()
                            });
                        }
                    } catch (error) {
                        logger.debug('Failed to load market:', error);
                    }
                }));

                // Add delay between batches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            logger.info(`Successfully initialized ${this.pools.size} markets`);
        } catch (error) {
            logger.error('Error initializing markets:', error);
            throw error;
        }
    }

    async isValidMarket(market) {
        try {
            const { bids, asks } = await market.loadOrderbook(connection);
            
            // Check for minimum liquidity
            const bidLiquidity = bids.reduce((sum, [price, size]) => sum + (price * size), 0);
            const askLiquidity = asks.reduce((sum, [price, size]) => sum + (price * size), 0);
            const totalLiquidity = bidLiquidity + askLiquidity;

            return totalLiquidity >= tradingConfig.trading.minLiquidity;
        } catch (error) {
            return false;
        }
    }

    startSubscriptions() {
        if (!this.active) return;
        
        for (const [address, pool] of this.pools) {
            this.subscribeToMarket(address, pool);
        }
    }

    async subscribeToMarket(address, pool) {
        try {
            const subscription = connection.onAccountChange(
                new PublicKey(address),
                () => this.handleMarketUpdate(address),
                'confirmed'
            );
            
            this.subscriptions.set(address, subscription);
        } catch (error) {
            logger.error('Failed to subscribe to market:', error);
        }
    }

    async handleMarketUpdate(address) {
        try {
            const pool = this.pools.get(address);
            if (!pool) return;

            const market = await Market.load(
                connection,
                new PublicKey(address),
                {},
                new PublicKey(tradingConfig.dex.serumProgramId)
            );

            pool.market = market;
            pool.lastUpdate = Date.now();

            eventEmitter.emit('pool:update', pool);
        } catch (error) {
            logger.error('Error handling market update:', error);
        }
    }

    async checkPoolUpdates() {
        for (const [address, pool] of this.pools) {
            try {
                await this.handleMarketUpdate(address);
            } catch (error) {
                logger.error('Error checking pool update:', error);
            }
        }
    }

    stop() {
        this.active = false;
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        
        // Clear all subscriptions
        for (const [address, subscription] of this.subscriptions) {
            connection.removeAccountChangeListener(subscription);
        }
        this.subscriptions.clear();
        
        logger.info('Pool scanner stopped');
    }
}