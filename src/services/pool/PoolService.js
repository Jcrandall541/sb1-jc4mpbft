import { logger } from '../../utils/logger.js';
import { connectionService } from '../connection/ConnectionService.js';
import { Market } from '@project-serum/serum';

class PoolService {
    constructor() {
        this.pools = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        try {
            const connection = connectionService.getConnection();
            await this.loadPools(connection);
            this.isInitialized = true;
            return true;
        } catch (error) {
            logger.error('Failed to initialize pool service:', error);
            throw error;
        }
    }

    async loadPools(connection) {
        try {
            const markets = await Market.loadMultiple(
                connection,
                [],
                {},
                new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin')
            );

            markets.forEach(market => {
                if (market) {
                    this.pools.set(market.address.toString(), market);
                }
            });

            logger.info(`Loaded ${this.pools.size} pools`);
        } catch (error) {
            logger.error('Failed to load pools:', error);
            throw error;
        }
    }

    getPools() {
        return Array.from(this.pools.values());
    }
}

export const poolService = new PoolService();