const { logger } = require('../utils/logger');
const { ValidationUtils } = require('../utils/validation');

class WalletSecurity {
    constructor(wallet) {
        this.wallet = wallet;
        this.transactionLimits = {
            maxTransactionSize: process.env.MAX_TRANSACTION_SIZE || '10', // in SOL
            dailyLimit: process.env.DAILY_TRANSACTION_LIMIT || '100', // in SOL
            perTransactionLimit: process.env.PER_TRANSACTION_LIMIT || '5' // in SOL
        };
        this.dailyTransactions = new Map();
    }

    async validateTransaction(transaction, amount) {
        try {
            return (
                this.checkTransactionSize(amount) &&
                await this.checkDailyLimit(amount) &&
                this.checkTransactionLimit(amount)
            );
        } catch (error) {
            logger.error('Transaction validation failed:', error);
            return false;
        }
    }

    checkTransactionSize(amount) {
        return parseFloat(amount) <= parseFloat(this.transactionLimits.maxTransactionSize);
    }

    async checkDailyLimit(amount) {
        const today = new Date().toISOString().split('T')[0];
        const dailyTotal = this.dailyTransactions.get(today) || 0;
        return (dailyTotal + parseFloat(amount)) <= parseFloat(this.transactionLimits.dailyLimit);
    }

    checkTransactionLimit(amount) {
        return parseFloat(amount) <= parseFloat(this.transactionLimits.perTransactionLimit);
    }

    async updateDailyTransactions(amount) {
        const today = new Date().toISOString().split('T')[0];
        const currentTotal = this.dailyTransactions.get(today) || 0;
        this.dailyTransactions.set(today, currentTotal + parseFloat(amount));
    }
}

module.exports = { WalletSecurity };