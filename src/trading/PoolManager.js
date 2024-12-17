import { logger } from '../utils/logger.js';
import { eventEmitter } from '../utils/EventEmitter.js';
import { PoolScanner } from './pool/PoolScanner.js';
import { OpportunityAnalyzer } from './analysis/OpportunityAnalyzer.js';

export class PoolManager {
    constructor() {
        this.scanner = new PoolScanner();
        this.analyzer = new OpportunityAnalyzer();
        this.setupEventListeners();
    }

    setupEventListeners() {
        eventEmitter.on('pool:update', this.handlePoolUpdate.bind(this));
    }

    async handlePoolUpdate(pool) {
        try {
            const opportunity = await this.analyzer.analyzeOpportunity({ pool });
            if (opportunity) {
                eventEmitter.emit('opportunity', opportunity);
            }
        } catch (error) {
            logger.error('Error handling pool update:', error);
        }
    }

    async start() {
        try {
            await this.scanner.start();
            await this.analyzer.start();
            logger.info('Pool manager started');
            return true;
        } catch (error) {
            logger.error('Failed to start pool manager:', error);
            throw error;
        }
    }

    async stop() {
        await this.scanner.stop();
        logger.info('Pool manager stopped');
        return true;
    }
}