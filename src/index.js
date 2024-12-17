import { Engine } from './core/Engine.js';
import { logger } from './utils/logger.js';

async function main() {
    const statusElement = document.getElementById('status');
    const engine = new Engine();

    try {
        statusElement.textContent = 'Initializing connection...';
        await engine.initialize();

        statusElement.textContent = 'Starting trading engine...';
        await engine.start();

        statusElement.textContent = '🚀 Trading bot active';
        logger.info('🚀 Trading bot started successfully');
    } catch (error) {
        statusElement.textContent = `Error: ${error.message}`;
        statusElement.classList.add('error');
        logger.error('Failed to start trading bot:', error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}