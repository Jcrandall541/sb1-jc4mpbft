const { logger } = require('../utils/logger');

class TransactionGuard {
    constructor(walletSecurity) {
        this.walletSecurity = walletSecurity;
        this.pendingTransactions = new Set();
    }

    async guardTransaction(transaction, amount) {
        const transactionId = transaction.signature;
        
        try {
            if (this.pendingTransactions.has(transactionId)) {
                logger.warn('Duplicate transaction detected:', transactionId);
                return false;
            }

            const isValid = await this.walletSecurity.validateTransaction(transaction, amount);
            if (!isValid) {
                logger.warn('Transaction failed security validation:', transactionId);
                return false;
            }

            this.pendingTransactions.add(transactionId);
            return true;
        } catch (error) {
            logger.error('Transaction guard error:', error);
            return false;
        }
    }

    async completeTransaction(transactionId, amount) {
        try {
            await this.walletSecurity.updateDailyTransactions(amount);
            this.pendingTransactions.delete(transactionId);
            logger.info('Transaction completed successfully:', transactionId);
        } catch (error) {
            logger.error('Error completing transaction:', error);
        }
    }
}

module.exports = { TransactionGuard };