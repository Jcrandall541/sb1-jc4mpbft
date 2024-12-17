import { logger } from '../../utils/logger.js';
import { DEFAULT_CONFIG } from '../../utils/constants.js';

export class Strategy {
    constructor(name, config = {}) {
        this.name = name;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async analyze(data) {
        throw new Error('analyze method must be implemented');
    }

    async execute(opportunity) {
        throw new Error('execute method must be implemented');
    }

    async validateOpportunity(opportunity) {
        if (!opportunity || !opportunity.type) {
            return false;
        }
        return this.meetsMinimumProfit(opportunity);
    }

    meetsMinimumProfit(opportunity) {
        return opportunity.expectedProfit >= this.config.MIN_PROFIT_THRESHOLD;
    }

    async calculateExpectedProfit(input, output) {
        return (output - input) / input;
    }
}