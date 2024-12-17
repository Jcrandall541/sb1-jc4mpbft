import { logger } from '../../utils/logger.js';
import { CONFIG } from '../../config/config.js';
import { eventEmitter } from '../../utils/EventEmitter.js';

class MonitoringService {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        this.metrics = new Map();
    }

    async initialize() {
        try {
            this.setupMetrics();
            this.isInitialized = true;
            logger.info('Monitoring service initialized');
            return true;
        } catch (error) {
            logger.error('Failed to initialize monitoring service:', error);
            throw error;
        }
    }

    setupMetrics() {
        this.metrics.set('trades', 0);
        this.metrics.set('profit', 0);
        this.metrics.set('errors', 0);
    }

    async start() {
        if (!this.isInitialized) {
            throw new Error('Service not initialized');
        }

        this.isRunning = true;
        this.startMetricsEmitter();
        logger.info('Monitoring service started');
    }

    async stop() {
        this.isRunning = false;
        logger.info('Monitoring service stopped');
    }

    startMetricsEmitter() {
        setInterval(() => {
            if (this.isRunning) {
                eventEmitter.emit('metrics:update', this.getMetrics());
            }
        }, CONFIG.MONITORING.METRICS_INTERVAL || 1000);
    }

    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
}

export const monitoringService = new MonitoringService();