import { logger } from '../utils/logger.js';
import { connectionService } from '../services/connection/ConnectionService.js';
import { poolService } from '../services/pool/PoolService.js';
import { opportunityService } from '../services/opportunity/OpportunityService.js';
import { monitoringService } from '../services/monitoring/MonitoringService.js';
import { eventEmitter } from '../utils/EventEmitter.js';

export class Engine {
    constructor() {
        this.services = {
            connection: connectionService,
            pool: poolService,
            opportunity: opportunityService,
            monitoring: monitoringService
        };
        this.isInitialized = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        eventEmitter.on('connection:lost', this.handleConnectionLost.bind(this));
        eventEmitter.on('connection:established', this.handleConnectionRestored.bind(this));
        eventEmitter.on('error', this.handleError.bind(this));
    }

    async handleError(error) {
        logger.error('Engine error:', error);
        await this.pauseServices();
    }

    async handleConnectionLost() {
        logger.warn('Connection lost, pausing services...');
        await this.pauseServices();
    }

    async handleConnectionRestored() {
        logger.info('Connection restored, resuming services...');
        await this.resumeServices();
    }

    async initialize() {
        try {
            logger.info('Initializing trading engine...');

            // Initialize services sequentially with proper error handling
            await this.initializeService('connection');
            await this.initializeService('monitoring');
            await this.initializeService('pool');
            await this.initializeService('opportunity');

            this.isInitialized = true;
            logger.info('Trading engine initialized successfully');
            return true;
        } catch (error) {
            logger.error('Failed to initialize trading engine:', error);
            throw error;
        }
    }

    async initializeService(serviceName) {
        try {
            logger.info(`Initializing ${serviceName} service...`);
            await this.services[serviceName].initialize();
            logger.info(`${serviceName} service initialized successfully`);
        } catch (error) {
            logger.error(`Failed to initialize ${serviceName} service:`, error);
            throw error;
        }
    }

    async start() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Start services in correct order
            await this.startService('monitoring');
            await this.startService('opportunity');

            logger.info('Trading engine started successfully');
            return true;
        } catch (error) {
            logger.error('Failed to start trading engine:', error);
            throw error;
        }
    }

    async startService(serviceName) {
        try {
            logger.info(`Starting ${serviceName} service...`);
            await this.services[serviceName].start();
            logger.info(`${serviceName} service started successfully`);
        } catch (error) {
            logger.error(`Failed to start ${serviceName} service:`, error);
            throw error;
        }
    }

    async pauseServices() {
        try {
            await this.services.opportunity.stop();
            logger.info('Services paused');
        } catch (error) {
            logger.error('Error pausing services:', error);
        }
    }

    async resumeServices() {
        try {
            await this.services.opportunity.start();
            logger.info('Services resumed');
        } catch (error) {
            logger.error('Error resuming services:', error);
        }
    }

    async stop() {
        try {
            await Promise.all([
                this.services.opportunity.stop(),
                this.services.monitoring.stop(),
                this.services.connection.stop()
            ]);
            logger.info('Trading engine stopped');
        } catch (error) {
            logger.error('Error stopping trading engine:', error);
        }
    }
}