import { logger } from '../utils/logger.js';

export class PathFinder {
    constructor(pools) {
        this.pools = pools;
        this.graph = new Map();
        this.paths = new Map();
    }

    buildGraph() {
        for (const [symbol, pool] of this.pools) {
            const [tokenA, tokenB] = symbol.split('-');
            this.addEdge(tokenA, tokenB, pool);
        }
    }

    findArbitragePaths(startToken, maxDepth = 3) {
        const paths = [];
        this.dfs(startToken, startToken, [], paths, maxDepth);
        return paths;
    }

    async calculatePathProfitability(path) {
        let inputAmount = 1;
        let expectedOutput = inputAmount;

        for (const hop of path) {
            const pool = this.pools.get(hop);
            expectedOutput = await this.simulateSwap(pool, expectedOutput);
        }

        return (expectedOutput - inputAmount) / inputAmount;
    }
}