const { Transaction, SystemProgram } = require('@solana/web3.js');
const { DEFAULT_CONFIG } = require('../utils/constants');
const { logger } = require('../utils/logger');

class TransactionBuilder {
    constructor(connection, wallet) {
        this.connection = connection;
        this.wallet = wallet;
    }

    async createTransaction(instructions, options = {}) {
        try {
            const { blockhash } = await this.connection.getLatestBlockhash();
            const transaction = new Transaction({
                recentBlockhash: blockhash,
                feePayer: this.wallet.getPublicKey()
            });

            transaction.add(...instructions);
            
            if (options.computeUnits) {
                this.addComputeBudget(transaction, options.computeUnits);
            }

            return this.wallet.sign(transaction);
        } catch (error) {
            logger.error('Error creating transaction:', error);
            throw error;
        }
    }

    addComputeBudget(transaction, computeUnits) {
        // Implementation for adding compute budget instruction
    }
}

module.exports = { TransactionBuilder };