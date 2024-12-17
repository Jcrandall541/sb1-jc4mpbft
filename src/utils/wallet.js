import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { logger } from './logger.js';
import { tradingConfig } from '../config/config.js';
import { connection } from '../config/connection.js';

class WalletManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        try {
            // Convert base58 private key to Uint8Array
            const privateKeyString = tradingConfig.wallet.privateKey;
            const decodedKey = bs58.decode(privateKeyString);
            
            // Create keypair from private key
            this.keypair = Keypair.fromSecretKey(decodedKey);
            this.publicKey = this.keypair.publicKey;
            
            logger.info('Wallet initialized with public key:', this.publicKey.toString());
            
            // Start balance monitoring
            this.startBalanceMonitoring();
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize wallet:', error);
            throw error;
        }
    }

    async startBalanceMonitoring() {
        const checkBalance = async () => {
            try {
                const balance = await connection.getBalance(this.publicKey);
                const solBalance = balance / 1e9;
                logger.info('Current wallet balance:', `${solBalance.toFixed(4)} SOL`);
                return solBalance;
            } catch (error) {
                logger.error('Failed to get wallet balance:', error);
                return null;
            }
        };

        // Initial balance check
        await checkBalance();

        // Set up periodic balance checking
        setInterval(checkBalance, 30000);
    }

    getPublicKey() {
        return this.publicKey;
    }

    async sign(transaction) {
        try {
            transaction.sign(this.keypair);
            return transaction;
        } catch (error) {
            logger.error('Failed to sign transaction:', error);
            throw error;
        }
    }

    async signAllTransactions(transactions) {
        return Promise.all(transactions.map(tx => this.sign(tx)));
    }
}

export const wallet = new WalletManager();