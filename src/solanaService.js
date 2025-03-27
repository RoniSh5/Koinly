import * as solanaweb3 from "@solana/web3.js";
import {RATE_LIMIT, SOL_TOKEN} from "./constants.js";
import 'dotenv/config';

const SOLANA_URL = process.env.SOLANA_URL;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const solanaConnection = new solanaweb3.Connection(`https://${SOLANA_URL}`);

export async function fetchTransactions(walletAddress, beforeSignature = null) {
    try {
        const publicKey = new solanaweb3.PublicKey(walletAddress);
        const options = { limit: RATE_LIMIT, before: beforeSignature };
        if (beforeSignature) {
            options.before = beforeSignature;
        }
        const transactionSignatures =
            await solanaConnection.getSignaturesForAddress(publicKey, options);
        const transactions = await Promise.all(
            transactionSignatures.map(async (tx) => {
                const details =
                    await solanaConnection.getParsedTransaction(tx.signature,
                        { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
                return processTransactionDetails(details, tx.signature);
            })
        );
        return transactions.filter(tx => tx !== null);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
}

function processTransactionDetails(details, signature) {
    if (!details) return null;

    const { blockTime, meta } = details;
    const date = new Date(blockTime * 1000).toISOString();
    const feeAmount = meta?.fee / Math.pow(10, 9) || 0;

    let sentAmount
    let sentCurrency
    let receivedAmount
    let receivedCurrency
    let postTokenAmount = null
    let postTokenCurrency = null
    let preTokenAmount = null
    let preTokenCurrency = null
    for (let i = 0; i < meta.postTokenBalances.length; i++) {
        if (meta.postTokenBalances[i].owner === WALLET_ADDRESS) {
            postTokenAmount = meta.postTokenBalances[i].uiTokenAmount.uiAmount
            postTokenCurrency = meta.postTokenBalances[i].mint
            break;
        }
    }
    for (let i = 0; i < meta.preTokenBalances.length; i++) {
        if (meta.preTokenBalances[i].owner === WALLET_ADDRESS) {
            preTokenAmount = meta.postTokenBalances[i].uiTokenAmount.uiAmount
            preTokenCurrency = meta.postTokenBalances[i].mint
            break;
        }
    }
    const amountDifference = postTokenAmount - preTokenAmount;
    if (amountDifference > 0) {
        sentAmount = ""
        sentCurrency = ""
        receivedAmount = amountDifference.toString()
        receivedCurrency = postTokenCurrency
    } else {
        sentAmount = (-amountDifference).toString()
        sentCurrency = postTokenCurrency
        receivedAmount = ""
        receivedCurrency = ""
    }
    const txSrc = details.transaction.message.accountKeys[0].pubkey.toBase58();
    let txDest = details.transaction.message.accountKeys[1].pubkey.toBase58();

    return {
        date,
        txHash: signature,
        txSrc,
        txDest,
        sentAmount: sentAmount,
        sentCurrency: sentCurrency,
        receivedAmount: receivedAmount,
        receivedCurrency: receivedCurrency,
        feeAmount,
        feeCurrency: SOL_TOKEN
    };
}
