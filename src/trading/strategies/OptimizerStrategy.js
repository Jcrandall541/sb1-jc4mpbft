import { logger } from '../../utils/logger.js';
import { tradingConfig } from '../../config/config.js';
import { ValidationHelper } from '../../utils/helpers/validation.js';
import { connection } from '../../config/connection.js';
import { Market, PublicKey } from '@project-serum/serum';

export class OptimizerStrategy {
    constructor(config = {}) {
        this.name = 'OPTIMIZER';
        this.config = { ...tradingConfig.trading, ...config };
        this.minProfitThreshold = 0.013; // 1.3% minimum profit
        this.priceHistory = new Map();
    }

    async analyze(data) {
        try {
            if (!ValidationHelper.validatePool(data?.pool)) {
                return null;
            }

            // Get market data
            const market = await this.getMarketData(data.pool.address);
            if (!market) {
                return null;
            }

            // Calculate metrics
            const metrics = await this.calculateMetrics(market);
            if (!metrics || !this.isViableOpportunity(metrics)) {
                return null;
            }

            const opportunity = {
                type: 'OPTIMIZER',
                pool: data.pool.address,
                metrics,
                expectedProfit: metrics.expectedProfit,
                confidence: metrics.confidence,
                suggestedSize: this.calculateOptimalSize(metrics),
                timestamp: Date.now()
            };

            logger.info('Opportunity detected', {
                pool: data.pool.address,
                expectedProfit: opportunity.expectedProfit,
                confidence: opportunity.confidence
            });

            return opportunity;
        } catch (error) {
            logger.error('Optimizer analysis failed:', error);
            return null;
        }
    }

    async getMarketData(address) {
        try {
            return await Market.load(
                connection,
                new PublicKey(address),
                {},
                new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin')
            );
        } catch (error) {
            logger.error('Error loading market:', error);
            return null;
        }
    }

    async calculateMetrics(market) {
        try {
            const { bids, asks } = await market.loadOrderbook(connection);
            
            if (!bids || !asks || bids.length === 0 || asks.length === 0) {
                return null;
            }

            const bestBid = bids[0].price;
            const bestAsk = asks[0].price;
            const spread = (bestAsk - bestBid) / bestBid;
            
            // Calculate expected profit based on spread
            const expectedProfit = spread * 0.5; // Assume we can capture 50% of the spread
            
            // Calculate confidence score
            const confidence = this.calculateConfidence(bids, asks, spread);

            return {
                price: (bestBid + bestAsk) / 2,
                spread,
                expectedProfit,
                confidence,
                volume: this.calculateVolume(bids, asks),
                liquidity: this.calculateLiquidity(bids, asks)
            };
        } catch (error) {
            logger.error('Error calculating metrics:', error);
            return null;
        }
    }

    calculateConfidence(bids, asks, spread) {
        const spreadScore = Math.max(0, 1 - spread * 10);
        const depthScore = Math.min(bids.length, asks.length) / 100;
        const balanceScore = Math.min(bids.length / asks.length, asks.length / bids.length);
        
        return (spreadScore * 0.4 + depthScore * 0.3 + balanceScore * 0.3);
    }

    calculateVolume(bids, asks) {
        return bids.reduce((sum, order) => sum + order.size, 0) +
               asks.reduce((sum, order) => sum + order.size, 0);
    }

    calculateLiquidity(bids, asks) {
        return Math.min(
            bids.reduce((sum, order) => sum + order.size * order.price, 0),
            asks.reduce((sum, order) => sum + order.size * order.price, 0)
        );
    }

    isViableOpportunity(metrics) {
        return (
            metrics.expectedProfit >= this.minProfitThreshold &&
            metrics.confidence >= 0.7 &&
            metrics.liquidity >= this.config.minLiquidity
        );
    }

    calculateOptimalSize(metrics) {
        const baseSize = (this.config.maxTradeSize + this.config.minTradeSize) / 2;
        const liquidityFactor = Math.min(metrics.liquidity / this.config.minLiquidity, 1);
        const confidenceFactor = metrics.confidence;
        
        const optimalSize = baseSize * liquidityFactor * confidenceFactor;
        
        return Math.min(
            Math.max(optimalSize, this.config.minTradeSize),
            this.config.maxTradeSize
        );
    }
}