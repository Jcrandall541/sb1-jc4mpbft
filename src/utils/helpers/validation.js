import { logger } from '../logger.js';
import { PublicKey } from '@solana/web3.js';

export class ValidationHelper {
    static validatePool(pool) {
        try {
            if (!pool || !pool.address) {
                logger.error('Invalid pool data');
                return false;
            }
            // Validate address is a valid Solana public key
            new PublicKey(pool.address);
            return true;
        } catch (error) {
            logger.error('Pool validation failed:', error);
            return false;
        }
    }

    static validateTransaction(transaction) {
        if (!transaction?.instructions?.length) {
            logger.error('Invalid transaction structure');
            return false;
        }
        return true;
    }

    static validateMetrics(metrics) {
        if (!metrics || typeof metrics !== 'object') {
            logger.error('Invalid metrics data');
            return false;
        }
        return true;
    }
}