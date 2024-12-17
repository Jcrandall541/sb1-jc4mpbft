import { logger } from '../utils/logger.js';
import { eventEmitter } from '../utils/EventEmitter.js';
import { connectionManager } from '../config/connection.js';
import { connectionState } from '../utils/connection/ConnectionState.js';
import { PoolManager } from './PoolManager.js';
import { OpportunityAnalyzer } from '../trading/OpportunityAnalyzer.js';
import { WebSocketStream } from '../streams/WebSocketStream.js';
import { TransactionMonitor } from '../monitoring/TransactionMonitor.js';

export class TradingEngine {
    constructor() {
        this.poolManager = new PoolManager();
        this.opportunityAnalyzer = new OpportunityAnalyzer();
        this.webSocketStream = new WebSocketStream();
        this.transactionMonitor = new TransactionMonitor();
        this.isInitialized = false;
        
        this.setupConnectionStateListeners();
    }

    setupConnectionStateListeners() {
        connectionState.on('rpc:change', this.handleRpcStateChange.bind(this));
        connectionState.on('ws:change', this.handleWsStateChange.bind(this));
    }

    async handleRpcStateChange(connected) {
        if (!connected && this.isInitialized) {
            logger.warn('RPC connection lost, pausing trading activities');
            await this.pauseTrading();
        } else if (connected && this.isInitialized) {
            logger.info('RPC connection restored, resuming trading activities');
            await this.resumeTrading();
        }
    }

    async handleWsStateChange(connected) {
        if (!connected && this.isInitialized) {
            logger.warn('WebSocket connection lost, switching to HTTP polling');
            await this.switchToHttpPolling();
        } else if (connected && this.isInitialized) {
            logger.info('WebSocket connection restored');
            await this.restoreWebSocketConnection();
        }
    }

    async initialize() {
        try {
            logger.info('Initializing trading engine...');

            // Initialize connection first
            await connectionManager.initialize();

            // Initialize other components sequentially
            await this.poolManager.initialize();
            await this.opportunityAnalyzer.initialize();
            await this.webSocketStream.initialize();
            await this.transactionMonitor.initialize();

            this.setupEventListeners();
            
            this.isInitialized = true;
            logger.info('Trading engine initialized successfully');
            
            return true;
        } catch (error) {
            logger.error('Failed to initialize trading engine:', error);
            throw error;
        }
    }

    // ... rest of the TradingEngine class implementation remains the same
}