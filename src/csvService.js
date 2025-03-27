import {createObjectCsvWriter} from "csv-writer";

export async function writeToCSV(filename, data) {
    const csvWriter = createObjectCsvWriter({
        path: filename,
        header: [
            { id: "date", title: "Date" },
            { id: "txHash", title: "TxHash" },
            { id: "txSrc", title: "TxSrc" },
            { id: "txDest", title: "TxDest" },
            { id: "sentAmount", title: "Sent Amount" },
            { id: "sentCurrency", title: "Sent Currency" },
            { id: "receivedAmount", title: "Received Amount" },
            { id: "receivedCurrency", title: "Received Currency" },
            { id: "feeAmount", title: "Fee Amount" },
            { id: "feeCurrency", title: "Fee Currency" },
        ],
    });
    await csvWriter.writeRecords(data);
}
