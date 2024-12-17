export class TransactionBundle {
    constructor() {
        this.transactions = [];
        this.recentBlockhash = null;
    }

    add(transaction) {
        this.transactions.push(transaction);
    }

    getTransactions() {
        return this.transactions;
    }

    setRecentBlockhash(blockhash) {
        this.recentBlockhash = blockhash;
    }
}