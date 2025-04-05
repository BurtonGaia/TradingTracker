const apiBase = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=";
let tickers = JSON.parse(localStorage.getItem("tickers") || "[]");
const form = document.getElementById("tickerForm");
const list = document.getElementById("tickerList");
const alertSound = document.getElementById("alertSound");

form.addEventListener("submit", e => {
  e.preventDefault();
  const ticker = form.ticker.value.toUpperCase();
  const price1 = parseFloat(form.price1.value);
  const price2 = parseFloat(form.price2.value);
  tickers.push({ ticker, price1, price2 });
  saveTickers();
  form.reset();
  renderTickers();
});

function saveTickers() {
  localStorage.setItem("tickers", JSON.stringify(tickers));
}

function removeTicker(index) {
  tickers.splice(index, 1);
  saveTickers();
  renderTickers();
}

function renderTickers() {
  list.innerHTML = "";
  tickers.forEach((item, i) => {
    fetch(`${apiBase}${item.ticker}`)
      .then(res => res.json())
      .then(data => {
        const quote = data.quoteResponse.result[0];
        const price = quote.regularMarketPrice;
        const histUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${item.ticker}?interval=1d&range=3mo`;

        fetch(histUrl)
          .then(r => r.json())
          .then(hist => {
            const prices = hist.chart.result[0].indicators.quote[0].close;
            const validPrices = prices.filter(p => p);
            const ma20 = avg(validPrices.slice(-20));
            const ma50 = avg(validPrices.slice(-50));
            const std20 = std(validPrices.slice(-20));
            const lowerBB = ma20 - 2 * std20;
            const combo = price < ma20 && price > ma50 && lowerBB > price * 0.95;

            const card = document.createElement("div");
            card.className = "card";
            if (combo) card.classList.add("highlight");
            if (price <= item.price1 || price <= item.price2 || combo) {
              card.classList.add("alert");
              alertSound.play();
            }

            card.innerHTML = `
              <div class="card-header">
                <strong>${item.ticker}</strong>
                <button onclick="removeTicker(${i})">🗑</button>
              </div>
              <div class="card-body">
                <span>Prix actuel: ${price.toFixed(2)}</span>
                <span>Prix 1: ${item.price1}</span>
                <span>Prix 2: ${item.price2}</span>
                <span>MA20: ${ma20.toFixed(2)}</span>
                <span>MA50: ${ma50.toFixed(2)}</span>
                <span>BB Bas: ${lowerBB.toFixed(2)}</span>
                <span>COMBO: ${combo ? "✅" : "❌"}</span>
              </div>
            `;
            list.appendChild(card);
          });
      });
  });
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  const mean = avg(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
}

renderTickers();
setInterval(renderTickers, 3600000); // 1h
