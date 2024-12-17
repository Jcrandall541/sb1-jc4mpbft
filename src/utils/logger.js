// Enhanced browser-compatible logger with connection monitoring
class BrowserLogger {
    constructor() {
        this.logs = [];
        this.connectionStatus = {
            rpc: false,
            ws: false
        };
    }

    info(message, data = {}) {
        this.log('info', message, data);
    }

    error(message, data = {}) {
        this.log('error', message, data);
    }

    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    debug(message, data = {}) {
        this.log('debug', message, data);
    }

    connection(type, status, details = {}) {
        this.connectionStatus[type] = status;
        this.log('connection', `${type.toUpperCase()} Connection ${status ? 'established' : 'lost'}`, {
            type,
            status,
            ...details
        });
    }

    transaction(type, details = {}) {
        this.log('transaction', `Transaction ${type}`, {
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    log(level, message, data) {
        const logEntry = {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            connections: { ...this.connectionStatus }
        };
        
        this.logs.push(logEntry);
        
        // Format the console output
        const timestamp = new Date().toLocaleTimeString();
        const connectionStatus = `[RPC:${this.connectionStatus.rpc ? '✓' : '✗'}|WS:${this.connectionStatus.ws ? '✓' : '✗'}]`;
        
        // Color coding for different log levels
        let consoleMethod = console.log;
        let style = 'color: white';
        
        switch(level) {
            case 'error':
                consoleMethod = console.error;
                style = 'color: #ff4444; font-weight: bold';
                break;
            case 'warn':
                consoleMethod = console.warn;
                style = 'color: #ffbb33; font-weight: bold';
                break;
            case 'connection':
                style = 'color: #00C851; font-weight: bold';
                break;
            case 'transaction':
                style = 'color: #33b5e5; font-weight: bold';
                break;
        }

        consoleMethod(
            `%c${timestamp} ${connectionStatus} ${message}`,
            style,
            data
        );
    }

    getLogs() {
        return this.logs;
    }
}

export const logger = new BrowserLogger();