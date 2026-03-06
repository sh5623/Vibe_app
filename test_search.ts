import YahooFinance from 'yahoo-finance2';

async function main() {
    const q = '에코프로';
    console.log("Searching:", q);
    const result = await YahooFinance.search(q);
    console.log(JSON.stringify(result.quotes, null, 2));
}

main().catch(console.error);
