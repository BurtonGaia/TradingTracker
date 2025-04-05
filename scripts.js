let tickers = JSON.parse(localStorage.getItem('tickers')) || [];

function saveTickers() {
    localStorage.setItem('tickers', JSON.stringify(tickers));
}

function addTicker() {
    const ticker = document.getElementById('tickerInput').value.toUpperCase();
    const price1 = parseFloat(document.getElementById('price1Input').value);
    const price2 = parseFloat(document.getElementById('price2Input').value);
    
    if (ticker && !isNaN(price1) && !isNaN(price2)) {
        tickers.push({ ticker, price1, price2 });
        saveTickers();
        updateDashboard();
        clearInputs();
    }
}

function clearInputs() {
    document.getElementById('tickerInput').value = '';
    document.getElementById('price1Input').value = '';
    document.getElementById('price2Input').value = '';
}

async function fetchStockData(ticker) {
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`);
    const data = await response.json();
    const quote = data.quoteResponse.result[0];
    return {
        price: quote.regularMarketPrice,
        ma20: quote.fiftyDayAverage, // Approximation pour MA20
        ma50: quote.twoHundredDayAverage, // Approximation pour MA50
        bbLower: quote.regularMarketPrice * 0.95 // Approximation simple pour BB basse
    };
}

function checkCombo(price, ma20, ma50, bbLower) {
    return price < ma20 && price > ma50 && (bbLower >= price * 0.95 && bbLower <= price);
}

function playAlert() {
    document.getElementById('alertSound').play();
}

function updateDashboard() {
    const tickerList = document.getElementById('tickerList');
    tickerList.innerHTML = '';

    tickers.forEach(async (item, index) => {
        const data = await fetchStockData(item.ticker);
        const card = document.createElement('div');
        card.className = 'ticker-card';

        const isCombo = checkCombo(data.price, data.ma20, data.ma50, data.bbLower);
        const hitPrice1 = Math.abs(data.price - item.price1) < 0.01;
        const hitPrice2 = Math.abs(data.price - item.price2) < 0.01;

        if (isCombo || hitPrice1 || hitPrice2) playAlert();

        card.innerHTML = `
            <h3>${item.ticker}</h3>
            <p>Prix actuel: ${data.price.toFixed(2)}</p>
            <p>Prix 1: ${item.price1.toFixed(2)} ${hitPrice1 ? '<span class="alert">Atteint!</span>' : ''}</p>
            <p>Prix 2: ${item.price2.toFixed(2)} ${hitPrice2 ? '<span class="alert">Atteint!</span>' : ''}</p>
            <p>COMBO: ${isCombo ? '<span class="combo">Oui</span>' : 'Non'}</p>
            <button class="delete-btn" onclick="deleteTicker(${index})">Supprimer</button>
        `;
        tickerList.appendChild(card);
    });
}

function deleteTicker(index) {
    tickers.splice(index, 1);
    saveTickers();
    updateDashboard();
}

// Rafraîchissement toutes les heures (3600000 ms)
setInterval(updateDashboard, 3600000);

// Initialisation
updateDashboard();
