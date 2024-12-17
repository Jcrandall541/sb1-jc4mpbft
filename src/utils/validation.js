const { logger } = require('./logger');

class ValidationUtils {
    static validateConfig(config) {
        const requiredFields = ['rpc.solana', 'wallet.privateKey'];
        
        for (const field of requiredFields) {
            if (!this.getNestedValue(config, field)) {
                throw new Error(`Missing required config field: ${field}`);
            }
        }
    }

    static getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => 
            current && current[key], obj);
    }

    static validateTransaction(transaction) {
        if (!transaction || !transaction.instructions || !transaction.instructions.length) {
            logger.error('Invalid transaction structure');
            return false;
        }
        return true;
    }
}

module.exports = { ValidationUtils };