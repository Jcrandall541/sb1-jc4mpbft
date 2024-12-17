export class TimeHelper {
  static getMillisecondsUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight - now;
  }

  static formatTimestamp(timestamp) {
    return new Date(timestamp).toISOString();
  }

  static getTimeElapsed(startTime) {
    return Date.now() - startTime;
  }
}