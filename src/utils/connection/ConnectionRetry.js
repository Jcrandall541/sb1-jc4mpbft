import { logger } from '../logger.js';
import { CONFIG } from '../../config/config.js';

export class ConnectionRetry {
    static async withRetry(operation, maxAttempts = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                logger.warn(`Connection attempt ${attempt}/${maxAttempts} failed:`, error);
                
                if (attempt < maxAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    static async withFallback(operation, endpoints) {
        for (const endpoint of endpoints) {
            try {
                return await operation(endpoint);
            } catch (error) {
                logger.warn(`Endpoint ${endpoint} failed:`, error);
            }
        }
        throw new Error('All endpoints failed');
    }
}