export const CONFIG = {
  RPC: {
    ENDPOINT: 'https://api.mainnet-beta.solana.com',
    WSS_ENDPOINT: 'wss://api.mainnet-beta.solana.com',
    BACKUP_ENDPOINTS: [
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana'
    ],
    CONNECTION_TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },
  TRADING: {
    MIN_PROFIT_THRESHOLD: 0.013,
    MAX_SLIPPAGE: 0.003,
    MIN_TRADE_SIZE: 0.1,
    MAX_TRADE_SIZE: 0.3,
    TRADES_PER_DAY: 2000
  },
  SECURITY: {
    MAX_TRANSACTION_SIZE: 0.3,
    DAILY_TRANSACTION_LIMIT: 600
  },
  MONITORING: {
    METRICS_INTERVAL: 1000,
    HEALTH_CHECK_INTERVAL: 30000,
    TRANSACTION_BATCH_SIZE: 100
  }
};