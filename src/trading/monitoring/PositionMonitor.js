import { eventEmitter } from '../../utils/EventEmitter.js';
import { logger } from '../../utils/logger.js';
import { tradingConfig } from '../../config/config.js';

export class PositionMonitor {
    constructor() {
        this.positions = new Map();
        this.setupEventListeners();
        this.monitoringIntervals = new Map();
    }

    setupEventListeners() {
        eventEmitter.on('position:open', this.onPositionOpen.bind(this));
        eventEmitter.on('position:close', this.onPositionClose.bind(this));
        eventEmitter.on('position:update', this.onPositionUpdate.bind(this));
    }

    async onPositionOpen(position) {
        try {
            this.positions.set(position.id, position);
            logger.info('Position opened', { positionId: position.id });
            await this.startMonitoring(position);
        } catch (error) {
            logger.error('Error opening position:', error);
        }
    }

    async onPositionClose(positionId) {
        try {
            const interval = this.monitoringIntervals.get(positionId);
            if (interval) {
                clearInterval(interval);
                this.monitoringIntervals.delete(positionId);
            }
            
            this.positions.delete(positionId);
            logger.info('Position closed', { positionId });
            
            eventEmitter.emit('position:closed', { positionId });
        } catch (error) {
            logger.error('Error closing position:', error);
        }
    }

    async onPositionUpdate(update) {
        try {
            const position = this.positions.get(update.positionId);
            if (position) {
                Object.assign(position, update);
                logger.info('Position updated', { positionId: update.positionId });
            }
        } catch (error) {
            logger.error('Error updating position:', error);
        }
    }

    async startMonitoring(position) {
        const interval = setInterval(async () => {
            try {
                const metrics = await this.getPositionMetrics(position);
                
                if (this.shouldAdjustPosition(metrics)) {
                    await this.adjustPosition(position, metrics);
                }

                if (this.shouldClosePosition(metrics)) {
                    await this.closePosition(position.id);
                }
            } catch (error) {
                logger.error('Position monitoring error:', error);
            }
        }, tradingConfig.monitoring.positionCheckInterval || 1000);

        this.monitoringIntervals.set(position.id, interval);
    }

    async getPositionMetrics(position) {
        try {
            return {
                currentPrice: await this.getCurrentPrice(position),
                profitLoss: await this.calculateProfitLoss(position),
                riskMetrics: await this.calculateRiskMetrics(position)
            };
        } catch (error) {
            logger.error('Error getting position metrics:', error);
            return null;
        }
    }

    shouldAdjustPosition(metrics) {
        if (!metrics) return false;

        const { profitLoss, riskMetrics } = metrics;
        return (
            profitLoss < -tradingConfig.trading.maxLossThreshold ||
            riskMetrics.risk > tradingConfig.trading.maxRiskThreshold
        );
    }

    shouldClosePosition(metrics) {
        if (!metrics) return false;

        const { profitLoss, riskMetrics } = metrics;
        return (
            profitLoss >= tradingConfig.trading.targetProfit ||
            profitLoss <= -tradingConfig.trading.stopLoss ||
            riskMetrics.risk >= tradingConfig.trading.maxRisk
        );
    }

    async adjustPosition(position, metrics) {
        try {
            const adjustment = await this.calculateAdjustment(position, metrics);
            await this.executeAdjustment(position, adjustment);
            
            eventEmitter.emit('position:adjusted', {
                positionId: position.id,
                adjustment
            });
        } catch (error) {
            logger.error('Error adjusting position:', error);
        }
    }

    async closePosition(positionId) {
        try {
            const position = this.positions.get(positionId);
            if (!position) return;

            await this.executeClose(position);
            await this.onPositionClose(positionId);
        } catch (error) {
            logger.error('Error closing position:', error);
        }
    }

    async getCurrentPrice(position) {
        // Implementation needed based on your specific requirements
        return 0;
    }

    async calculateProfitLoss(position) {
        // Implementation needed based on your specific requirements
        return 0;
    }

    async calculateRiskMetrics(position) {
        // Implementation needed based on your specific requirements
        return { risk: 0 };
    }

    async calculateAdjustment(position, metrics) {
        // Implementation needed based on your specific requirements
        return {};
    }

    async executeAdjustment(position, adjustment) {
        // Implementation needed based on your specific requirements
    }

    async executeClose(position) {
        // Implementation needed based on your specific requirements
    }
}