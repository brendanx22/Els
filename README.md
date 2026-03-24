# Els Trading Terminal

Els is a trading-only terminal-first market workspace focused on live symbol lookup, chart visuals, structured technical analysis, and AI-assisted trade briefing.

## What it does

- Pulls live market data for FX, crypto, futures, indices, and stocks
- Accepts natural trading inputs like `EURUSD`, `GBPJPY`, `BTCUSD`, `XAUUSD`, `NAS100`, `AAPL`, or provider symbols like `GC=F`
- Draws interactive candlestick charts with EMA overlays and on-chart strategy levels
- Marks swing highs and lows, BOS, CHOCH, Fib levels, supply/demand bodies, and aligned FVGs visually
- Calculates support, resistance, RSI, MACD, ATR, Bollinger context, ADX, and candle pattern signals
- Runs the strategy stack in this order: BOS / CHOCH -> Supply & Demand -> Fibonacci -> FVG -> RSI
- Generates an AI trade brief with directional call, trade verdict, risk flags, invalidations, and next actions
- Exports the web mirror as a visual image
- Runs the trading control loop in terminal while the browser mirrors the latest chart state

## Quick start

```bash
npm install
npm start
```

`npm start` opens the terminal controller and starts the web mirror on [http://localhost:3001](http://localhost:3001).

If you want provider-backed AI analysis, copy `.env.example` into `.env` and set `OPENAI_API_KEY`. The default AI model is `gpt-5.4`, and you can tune it with `OPENAI_REASONING_EFFORT` and `OPENAI_TEXT_VERBOSITY`.

Useful terminal commands:

- `analyze EURUSD 1h`
- `watch BTCUSD 5m`
- `refresh`
- `stop`
- `search gold`
- `status`

If you want only the read-only web server without the terminal controller:

```bash
npm run dashboard
```

## Supported market inputs

Examples:

- `EURUSD`
- `GBPJPY`
- `BTCUSD`
- `ETHUSD`
- `XAUUSD`
- `XAGUSD`
- `NAS100`
- `SPX500`
- `US30`
- `AAPL`
- `GC=F`
- `^NDX`

The app normalizes many common trading aliases automatically.

## Timeframes

- `1m`
- `5m`
- `15m`
- `1h`
- `4h`
- `1d`
- `1wk`

## Visual analysis stack

Backend analysis is calculated from market candles using:

- EMA 20
- EMA 50
- EMA 200
- RSI 14
- MACD
- ATR 14
- Bollinger Bands
- ADX
- Swing-point structure
- BOS / CHOCH
- Refined supply / demand candle bodies
- Fibonacci from the structural impulse
- FVG alignment inside the Fib execution pocket
- Candle pattern detection

The web mirror renders:

- Candlesticks
- EMA overlays
- Strategy overlays for structure, Fib, supply / demand, and FVG
- Swing markers
- An AI execution brief with risk flags, invalidations, and next actions
- A terminal session summary and command history

## AI analysis

The analysis engine always produces a rules-based read first, then builds an AI report from that structured market state.

- OpenAI is used first when `OPENAI_API_KEY` is available
- Gemini can be used as an optional fallback
- If no API key is configured, the app falls back to a deterministic local trade brief
- AI responses are lightly cached to avoid repeating the same live-market request unnecessarily

## Project structure

```text
Els/
|-- dashboard/
|   |-- app.js
|   |-- public/
|   |   |-- trading-terminal.css
|   |   `-- trading-terminal.js
|   `-- views/
|       |-- dashboard.ejs
|       `-- error.ejs
|-- terminal/
|   `-- index.js
|-- trading/
|   |-- analysis.js
|   |-- marketData.js
|   `-- sessionStore.js
`-- package.json
```

## Notes

- Market data is fetched from Yahoo Finance endpoints.
- The app is designed for fast market context, not for order execution.
- Analysis output is informational only and not financial advice.
