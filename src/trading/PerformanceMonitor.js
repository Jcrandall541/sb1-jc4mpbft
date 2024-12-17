import { eventEmitter } from '../utils/EventEmitter.js';
import { logger } from '../utils/logger.js';
import { connection } from '../config/connection.js';
import { wallet } from '../utils/wallet.js';

export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            trades: 0,
            successfulTrades: 0,
            failedTrades: 0,
            totalProfit: 0,
            averageProfit: 0,
            winRate: 0,
            tradesPerDay: 0,
            recentTrades: [],
            walletBalance: 0
        };
        
        this.startTime = Date.now();
        this.setupMetricsEmitter();
        this.setupBalanceMonitor();
    }

    setupMetricsEmitter() {
        setInterval(() => {
            this.emitMetrics();
        }, 1000);
    }

    async setupBalanceMonitor() {
        const updateBalance = async () => {
            try {
                const balance = await connection.getBalance(wallet.getPublicKey());
                this.metrics.walletBalance = balance / 1e9;
                this.emitMetrics();
            } catch (error) {
                logger.error('Failed to update wallet balance:', error);
            }
        };

        // Update balance every 30 seconds
        await updateBalance();
        setInterval(updateBalance, 30000);
    }

    recordTrade(result) {
        if (!result) return;

        this.metrics.trades++;
        if (result.success) {
            this.metrics.successfulTrades++;
            this.metrics.totalProfit += result.profit || 0;
        } else {
            this.metrics.failedTrades++;
        }

        this.updateMetrics();
        this.addRecentTrade(result);
    }

    updateMetrics() {
        const totalTrades = this.metrics.trades;
        if (totalTrades > 0) {
            this.metrics.winRate = this.metrics.successfulTrades / totalTrades;
            this.metrics.averageProfit = this.metrics.totalProfit / totalTrades;
        }

        const hoursRunning = (Date.now() - this.startTime) / (1000 * 60 * 60);
        this.metrics.tradesPerDay = (totalTrades / hoursRunning) * 24;
    }

    addRecentTrade(trade) {
        this.metrics.recentTrades.unshift({
            ...trade,
            timestamp: Date.now()
        });

        // Keep only last 100 trades
        if (this.metrics.recentTrades.length > 100) {
            this.metrics.recentTrades.pop();
        }
    }

    emitMetrics() {
        eventEmitter.emit('metrics:update', this.getMetrics());
    }

    getMetrics() {
        return {
            ...this.metrics,
            lastUpdate: Date.now()
        };
    }
}