const { WalletManager } = require('../utils/wallet');
const { tradingConfig } = require('./config');
const { logger } = require('../utils/logger');

let walletInstance = null;

function initializeWallet() {
    try {
        if (!walletInstance) {
            walletInstance = new WalletManager(tradingConfig.wallet.privateKey);
            logger.info('Wallet initialized successfully');
        }
        return walletInstance;
    } catch (error) {
        logger.error('Failed to initialize wallet:', error);
        throw error;
    }
}

module.exports = {
    initializeWallet,
    getWallet: () => walletInstance
};