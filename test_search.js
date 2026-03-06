import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function main() {
    const q2 = '086520';
    try {
        console.log("Searching:", q2);
        const result2 = await yahooFinance.search(q2);
        console.log(result2.quotes[0]?.symbol);
    } catch (e) {
        if (e.result && e.result.quotes && e.result.quotes.length > 0) {
            console.log("Found in error:", e.result.quotes[0].symbol);
        } else {
            console.log("Other error:", e);
        }
    }
}

main().catch(console.error);
