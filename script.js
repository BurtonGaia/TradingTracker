const API_KEY = 'RZ7U8BGO3JZI1BQV';
const tickerList = document.getElementById('tickerList');
let tickers = JSON.parse(localStorage.getItem('tickers')) || [];

// Charger les tickers au démarrage
document.addEventListener('DOMContentLoaded', () => {
    renderTickers();
    fetchData();
    setInterval(fetchData, 3600000); // Rafraîchissement toutes les heures
});

// Ajouter un ticker
function addTicker() {
    const ticker = document.getElementById('ticker').value.toUpperCase();
    const price1 = parseFloat(document.getElementById('price1').value);
    const price2 = parseFloat(document.getElementById('price2').value);

    if (ticker && price1 && price2) {
        tickers.push({ ticker, price1, price2 });
        localStorage.setItem('tickers', JSON.stringify(tickers));
        renderTickers();
        fetchData();
        document.getElementById('ticker').value = '';
        document.getElementById('price1').value = '';
        document.getElementById('price2').value = '';
    }
}

// Supprimer un ticker
function deleteTicker(index) {
    tickers.splice(index, 1);
    localStorage.setItem('tickers', JSON.stringify(tickers));
    renderTickers();
    fetchData();
}

// Récupérer les données via AlphaVantage
async function fetchData() {
    for (let i = 0; i < tickers.length; i++) {
        const ticker = tickers[i].ticker;
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${API_KEY}`;
        const bbUrl = `https://www.alphavantage.co/query?function=BBANDS&symbol=${ticker}&interval=daily&time_period=20&series_type=close&nbdevup=2&nbdevdn=2&apikey=${API_KEY}`;
        const ma20Url = `https://www.alphavantage.co/query?function=SMA&symbol=${ticker}&interval=daily&time_period=20&series_type=close&apikey=${API_KEY}`;
        const ma50Url = `https://www.alphavantage.co/query?function=SMA&symbol=${ticker}&interval=daily&time_period=50&series_type=close&apikey=${API_KEY}`;

        try {
            const [priceRes, bbRes, ma20Res, ma50Res] = await Promise.all([
                fetch(url).then(res => res.json()),
                fetch(bbUrl).then(res => res.json()),
                fetch(ma20Url).then(res => res.json()),
                fetch(ma50Url).then(res => res.json())
            ]);

            const currentPrice = parseFloat(priceRes['Time Series (Daily)'][Object.keys(priceRes['Time Series (Daily)'])[0]]['4. close']);
            const bbLower = parseFloat(bbRes['Technical Analysis: BBANDS'][Object.keys(bbRes['Technical Analysis: BBANDS'])[0]]['Lower Band']);
            const ma20 = parseFloat(ma20Res['Technical Analysis: SMA'][Object.keys(ma20Res['Technical Analysis: SMA'])[0]]['SMA']);
            const ma50 = parseFloat(ma50Res['Technical Analysis: SMA'][Object.keys(ma50Res['Technical Analysis: SMA'])[0]]['SMA']);

            tickers[i].currentPrice = currentPrice;
            tickers[i].ma20 = ma20;
            tickers[i].ma50 = ma50;
            tickers[i].bbLower = bbLower;
            tickers[i].combo = currentPrice < ma20 && currentPrice > ma50 && (bbLower >= currentPrice * 0.95 && bbLower <= currentPrice);

            checkAlerts(tickers[i]);
        } catch (error) {
            console.error(`Erreur pour ${ticker}:`, error);
        }
    }
    renderTickers();
}

// Vérifier les alertes
function checkAlerts(ticker) {
    if (ticker.combo) {
        playSound();
        ticker.alert = 'COMBO détecté !';
    } else if (ticker.currentPrice <= ticker.price1 || ticker.currentPrice >= ticker.price2) {
        playSound();
        ticker.alert = 'Seuil atteint !';
    } else {
        ticker.alert = '';
    }
}

// Jouer un son pour les alertes
function playSound() {
    const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
    audio.play();
}

// Afficher les tickers
function renderTickers() {
    tickerList.innerHTML = '';
    tickers.forEach((ticker, index) => {
        const card = document.createElement('div');
        card.className = `ticker-card ${ticker.combo ? 'combo' : ''} ${ticker.alert && !ticker.combo ? 'alert' : ''}`;
        card.innerHTML = `
            <div>
                <strong>${ticker.ticker}</strong><br>
                Prix actuel: ${ticker.currentPrice || 'N/A'}<br>
                Prix 1: ${ticker.price1} | Prix 2: ${ticker.price2}<br>
                MA20: ${ticker.ma20 || 'N/A'} | MA50: ${ticker.ma50 || 'N/A'}<br>
                BB Lower: ${ticker.bbLower || 'N/A'}<br>
                ${ticker.alert ? `<span>${ticker.alert}</span>` : ''}
            </div>
            <button class="delete" onclick="deleteTicker(${index})">Supprimer</button>
        `;
        tickerList.appendChild(card);
    });
}
