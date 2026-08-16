require("dotenv").config();
const { NewsAnalyzer } = require("../trading/newsAnalysis");
const { MultiSourceNewsAggregator } = require("../trading/multiSourceNews");

async function test() {
  const analyzer = new NewsAnalyzer();
  const aggregator = new MultiSourceNewsAggregator();
  
  console.log("Testing NewsAnalyzer...");
  const news1 = await analyzer.fetchMarketNews("EURUSD", "1h");
  console.log("NewsAnalyzer result articles count:", news1.totalArticles);
  console.log("NewsAnalyzer summary:", news1.summary);
  
  console.log("\nTesting MultiSourceNewsAggregator...");
  const news2 = await aggregator.aggregateNews("EURUSD", "1h");
  console.log("Aggregator result articles count:", news2.totalArticles);
  console.log("Aggregator summary:", news2.summary);
}

test().catch(console.error);
