import { eventEmitter } from '../../utils/EventEmitter.js';
import { logger } from '../../utils/logger.js';
import { OptimizerStrategy } from '../strategies/OptimizerStrategy.js';

export class OpportunityAnalyzer {
    constructor() {
        this.strategy = new OptimizerStrategy();
    }

    async start() {
        logger.info('OpportunityAnalyzer started');
        return true;
    }

    async analyzeOpportunity(data) {
        try {
            return await this.strategy.analyze(data);
        } catch (error) {
            logger.error('Opportunity analysis failed:', error);
            return null;
        }
    }
}