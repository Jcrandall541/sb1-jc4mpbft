export class MetricsHelper {
  static calculateWinRate(successful, total) {
    return total > 0 ? successful / total : 0;
  }

  static calculateTradesPerDay(totalTrades, startTime) {
    const runningHours = (Date.now() - startTime) / (1000 * 60 * 60);
    return (totalTrades / runningHours) * 24;
  }

  static formatProfit(profit) {
    return `${profit.toFixed(4)} SOL`;
  }

  static calculateProfitLoss(entry, current) {
    return ((current - entry) / entry) * 100;
  }
}