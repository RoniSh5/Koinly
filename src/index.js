#!/usr/bin/env node
import {Command} from "commander";
import {fetchTransactions} from "./solanaService.js";
import {writeToCSV} from "./csvService.js";
import {LIMIT_NUMBER_OF_TRANSACTIONS, MILLISECONDS_FOR_TIMEOUT} from "./constants.js";

const command = new Command();

command
    .version("1.0.0")
    .description("Solana Transaction Exporter")
    .requiredOption("-a, --address <wallet_address>", "Solana wallet address");

command.parse(process.argv);
const options = command.opts();

(async () => {
    try {
        const transactions = await fetchAllTransactions(options.address);
        await writeToCSV(`solana_transactions_${options.address}.csv`, transactions);
        console.log("Transaction history exported to solana_transactions.csv");
    } catch (error) {
        console.error("An error has occurred while exporting transactions: ", error.message);
    }
})();

async function fetchAllTransactions(address) {
    let allTransactions = [];
    let lastSignature = null;
    while (allTransactions.length < LIMIT_NUMBER_OF_TRANSACTIONS) {
        const transactions = await fetchTransactions(address, lastSignature);
        if (transactions.length === 0) break;
        allTransactions.push(...transactions);
        lastSignature = transactions[transactions.length - 1].txHash;
        await new Promise(res => setTimeout(res, MILLISECONDS_FOR_TIMEOUT));
    }
    return allTransactions
}
