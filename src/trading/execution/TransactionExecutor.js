const { logger } = require('../../utils/logger');
const { ValidationUtils } = require('../../utils/validation');
const { TransactionGuard } = require('../../security');

class TransactionExecutor {
    constructor(connection, wallet, security) {
        this.connection = connection;
        this.wallet = wallet;
        this.transactionGuard = new TransactionGuard(security);
    }

    async execute(transaction, amount, options = {}) {
        try {
            if (!ValidationUtils.validateTransaction(transaction)) {
                throw new Error('Invalid transaction');
            }

            const canExecute = await this.transactionGuard.guardTransaction(transaction, amount);
            if (!canExecute) {
                throw new Error('Transaction failed security checks');
            }

            const signed = await this.wallet.sign(transaction);
            const signature = await this.connection.sendTransaction(signed, {
                skipPreflight: options.skipPreflight || false,
                maxRetries: options.maxRetries || 3
            });

            const result = await this.confirmTransaction(signature);
            await this.transactionGuard.completeTransaction(signature, amount);
            
            return result;
        } catch (error) {
            logger.error('Transaction execution failed:', error);
            throw error;
        }
    }

    async confirmTransaction(signature) {
        try {
            const confirmation = await this.connection.confirmTransaction(signature);
            logger.info('Transaction confirmed:', { signature, confirmation });
            return { signature, confirmation };
        } catch (error) {
            logger.error('Transaction confirmation failed:', error);
            throw error;
        }
    }
}

module.exports = { TransactionExecutor };