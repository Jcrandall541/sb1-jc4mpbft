import { EventEmitter } from 'eventemitter3';

export class ConnectionState extends EventEmitter {
    constructor() {
        super();
        this.state = {
            rpc: false,
            ws: false,
            lastError: null,
            reconnectAttempts: 0
        };
    }

    setRpcState(connected, error = null) {
        this.state.rpc = connected;
        if (error) this.state.lastError = error;
        this.emit('rpc:change', connected);
    }

    setWsState(connected, error = null) {
        this.state.ws = connected;
        if (error) this.state.lastError = error;
        this.emit('ws:change', connected);
    }

    incrementReconnectAttempts() {
        this.state.reconnectAttempts++;
        return this.state.reconnectAttempts;
    }

    resetReconnectAttempts() {
        this.state.reconnectAttempts = 0;
    }

    getState() {
        return { ...this.state };
    }
}

export const connectionState = new ConnectionState();