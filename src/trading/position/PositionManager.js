import { logger } from '../../utils/logger.js';
import { eventEmitter } from '../../utils/EventEmitter.js';
import { TimeHelper } from '../../utils/helpers/time.js';
import { MetricsHelper } from '../../utils/helpers/metrics.js';

export class PositionManager {
    constructor() {
        this.positions = new Map();
        this.monitoringIntervals = new Map();
    }

    async openPosition(params) {
        const position = {
            id: `pos_${Date.now()}`,
            ...params,
            openTime: Date.now(),
            status: 'OPEN'
        };

        this.positions.set(position.id, position);
        this.startMonitoring(position);
        
        eventEmitter.emit('position:open', position);
        logger.info('Position opened', { positionId: position.id });
        
        return position;
    }

    async closePosition(positionId) {
        const position = this.positions.get(positionId);
        if (!position) return;

        position.status = 'CLOSED';
        position.closeTime = Date.now();
        
        this.stopMonitoring(positionId);
        this.positions.delete(positionId);
        
        eventEmitter.emit('position:close', position);
        logger.info('Position closed', { positionId });
        
        return position;
    }

    startMonitoring(position) {
        const interval = setInterval(() => {
            this.checkPosition(position);
        }, 1000);
        
        this.monitoringIntervals.set(position.id, interval);
    }

    stopMonitoring(positionId) {
        const interval = this.monitoringIntervals.get(positionId);
        if (interval) {
            clearInterval(interval);
            this.monitoringIntervals.delete(positionId);
        }
    }

    async checkPosition(position) {
        const metrics = await this.getPositionMetrics(position);
        if (this.shouldClosePosition(metrics)) {
            await this.closePosition(position.id);
        }
    }

    shouldClosePosition(metrics) {
        return metrics?.profitLoss >= metrics?.targetProfit;
    }

    getPositions() {
        return Array.from(this.positions.values());
    }
}