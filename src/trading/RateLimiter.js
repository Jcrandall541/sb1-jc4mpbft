import { tradingConfig } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class RateLimiter {
    constructor() {
        this.lastTradeTime = new Map();
        this.consecutiveLosses = 0;
        this.dailyVolume = 0;
        this.dailyProfitLoss = 0;
        this.inCooldown = false;
        this.setupDailyReset();
    }

    setupDailyReset() {
        // Reset metrics at midnight
        setInterval(() => {
            this.resetDaily();
        }, this.getMillisecondsUntilMidnight());
    }

    getMillisecondsUntilMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return midnight - now;
    }

    async canTrade(poolAddress) {
        if (this.inCooldown) {
            logger.debug('Trading in cooldown period');
            return false;
        }

        const lastTrade = this.lastTradeTime.get(poolAddress) || 0;
        const timeSinceLastTrade = Date.now() - lastTrade;
        const canTrade = timeSinceLastTrade >= tradingConfig.trading.tradeInterval;

        if (!canTrade) {
            logger.debug(`Trade interval not met for pool ${poolAddress}`);
        }

        return canTrade;
    }

    recordTrade(poolAddress, profitLoss, volume) {
        this.lastTradeTime.set(poolAddress, Date.now());
        this.dailyVolume += volume;
        this.dailyProfitLoss += profitLoss;

        logger.info('Trade recorded', {
            poolAddress,
            profitLoss,
            volume,
            dailyVolume: this.dailyVolume,
            dailyProfitLoss: this.dailyProfitLoss
        });

        if (profitLoss < 0) {
            this.consecutiveLosses++;
            if (this.consecutiveLosses >= tradingConfig.security.maxConsecutiveLosses) {
                logger.warn('Max consecutive losses reached');
                this.triggerCooldown();
            }
        } else {
            this.consecutiveLosses = 0;
        }

        // Check daily loss limit
        const dailyLossLimit = -tradingConfig.security.maxDailyLossPercentage * this.dailyVolume;
        if (this.dailyProfitLoss < dailyLossLimit) {
            logger.warn('Daily loss limit reached', {
                dailyProfitLoss: this.dailyProfitLoss,
                dailyLossLimit
            });
            this.triggerCooldown();
        }
    }

    triggerCooldown() {
        this.inCooldown = true;
        logger.info('Entering cooldown period', {
            duration: tradingConfig.security.cooldownPeriod
        });

        setTimeout(() => {
            this.inCooldown = false;
            this.consecutiveLosses = 0;
            logger.info('Cooldown period ended');
        }, tradingConfig.security.cooldownPeriod);
    }

    resetDaily() {
        const previousVolume = this.dailyVolume;
        const previousProfitLoss = this.dailyProfitLoss;

        this.dailyVolume = 0;
        this.dailyProfitLoss = 0;

        logger.info('Daily metrics reset', {
            previousVolume,
            previousProfitLoss
        });
    }

    getMetrics() {
        return {
            dailyVolume: this.dailyVolume,
            dailyProfitLoss: this.dailyProfitLoss,
            consecutiveLosses: this.consecutiveLosses,
            inCooldown: this.inCooldown
        };
    }
}