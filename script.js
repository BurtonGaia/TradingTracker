const apiKey = 'cvopq21r01qihjtq7uagcvopq21r01qihjtq7ub0';
const tickerInput = document.getElementById('ticker-input');
const price1Input = document.getElementById('price1');
const price2Input = document.getElementById('price2');
const addButton = document.getElementById('add-button');
const watchlist = document.getElementById('watchlist');
const notificationDiv = document.createElement('div');
notificationDiv.classList.add('notification');
document.body.appendChild(notificationDiv);

let trackedTickers = loadWatchlist();

// Fonction pour afficher une notification (inchangée)
function showNotification(message, type = 'success', duration = 3000) {
    notificationDiv.textContent = message;
    notificationDiv.className = 'notification';
    notificationDiv.classList.add('notification', type);
    notificationDiv.classList.add('show');
    setTimeout(() => {
        notificationDiv.classList.remove('show');
    }, duration);
}

// Fonction pour récupérer les informations de l'actif (nom) (inchangée)
async function fetchCompanyProfile(ticker) {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`);
        if (!response.ok) {
            console.warn(`Impossible de récupérer le profil pour ${ticker}: ${response.status}`);
            return { name: 'N/A' };
        }
        const data = await response.json();
        return { name: data.name || 'N/A' };
    } catch (error) {
        console.error(`Erreur lors de la récupération du profil pour ${ticker}:`, error);
        return { name: 'N/A' };
    }
}

// Fonction pour récupérer le prix actuel (inchangée)
async function fetchCurrentPrice(ticker) {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
        if (!response.ok) {
            console.warn(`Impossible de récupérer le prix pour ${ticker}: ${response.status}`);
            return { currentPrice: null };
        }
        const data = await response.json();
        return { currentPrice: data.c !== undefined ? data.c : null };
    } catch (error) {
        console.error(`Erreur lors de la récupération du prix pour ${ticker}:`, error);
        return { currentPrice: null };
    }
}

// Fonction pour récupérer les moyennes mobiles
async function fetchMovingAverages(ticker) {
    const now = Math.floor(Date.now() / 1000);
    const from = now - (365 * 24 * 3600); // Environ 1 an de données pour avoir suffisamment de points

    try {
        const responseMA50 = await fetch(`https://finnhub.io/api/v1/indicator?symbol=${ticker}&resolution=D&from=${from}&to=${now}&indicator=sma&timeperiod=50&token=${apiKey}`);
        const responseMA20 = await fetch(`https://finnhub.io/api/v1/indicator?symbol=${ticker}&resolution=D&from=${from}&to=${now}&indicator=sma&timeperiod=20&token=${apiKey}`);

        if (!responseMA50.ok || !responseMA20.ok) {
            console.warn(`Impossible de récupérer les MAs pour ${ticker}: MA50 Status: ${responseMA50.status}, MA20 Status: ${responseMA20.status}`);
            return { ma50: 'N/A', ma20: 'N/A' };
        }

        const dataMA50 = await responseMA50.json();
        const dataMA20 = await responseMA20.json();

        const ma50Value = dataMA50.sma && dataMA50.sma.length > 0 ? dataMA50.sma[dataMA50.sma.length - 1].toFixed(2) : 'N/A';
        const ma20Value = dataMA20.sma && dataMA20.sma.length > 0 ? dataMA20.sma[dataMA20.sma.length - 1].toFixed(2) : 'N/A';

        return { ma50: ma50Value, ma20: ma20Value };

    } catch (error) {
        console.error(`Erreur lors de la récupération des MAs pour ${ticker}:`, error);
        return { ma50: 'N/A', ma20: 'N/A' };
    }
}

// Fonction pour ajouter un ticker à la watchlist
async function addTickerToWatchlist() {
    const selectedTicker = tickerInput.value.trim().toUpperCase();
    const price1 = parseFloat(price1Input.value);
    const price2 = parseFloat(price2Input.value);

    if (!selectedTicker) {
        showNotification('Veuillez entrer un ticker.', 'warning');
        return;
    }

    if (isNaN(price1) || isNaN(price2)) {
        showNotification('Veuillez entrer des prix valides.', 'warning');
        return;
    }

    if (trackedTickers.some(item => item.ticker === selectedTicker)) {
        showNotification('Ce ticker est déjà dans votre watchlist.', 'warning');
        return;
    }

    const companyInfo = await fetchCompanyProfile(selectedTicker);
    const priceInfo = await fetchCurrentPrice(selectedTicker);
    const maInfo = await fetchMovingAverages(selectedTicker);

    if (priceInfo.currentPrice === null) {
        showNotification(`Impossible de récupérer le prix pour ${selectedTicker}. Vérifiez le ticker.`, 'error');
        return;
    }

    const newTickerData = {
        ticker: selectedTicker,
        name: companyInfo.name,
        price1: price1,
        price2: price2,
        currentPrice: priceInfo.currentPrice,
        ma50: maInfo.ma50,
        ma20: maInfo.ma20
    };

    trackedTickers.push(newTickerData);
    saveWatchlist();
    renderWatchlist();

    tickerInput.value = '';
    price1Input.value = '';
    price2Input.value = '';
}

// Fonction pour supprimer un ticker de la watchlist (inchangée)
function removeTicker(tickerToRemove) {
    trackedTickers = trackedTickers.filter(item => item.ticker !== tickerToRemove);
    saveWatchlist();
    renderWatchlist();
}

// Fonction pour mettre à jour le prix actuel et vérifier les seuils et les MAs
async function updateCurrentPrices() {
    for (const item of trackedTickers) {
        const priceInfo = await fetchCurrentPrice(item.ticker);
        const maInfo = await fetchMovingAverages(item.ticker); // Mise à jour des MAs

        if (priceInfo.currentPrice !== null) {
            const oldPrice = item.currentPrice;
            item.currentPrice = priceInfo.currentPrice.toFixed(2);
            item.ma50 = maInfo.ma50;
            item.ma20 = maInfo.ma20;

            const thresholdPositive1 = item.price1 * 1.02;
            const thresholdNegative1 = item.price1 * 0.98;
            const thresholdPositive2 = item.price2 * 1.02;
            const thresholdNegative2 = item.price2 * 0.98;

            if (oldPrice !== null) {
                if (item.currentPrice >= thresholdPositive2 && oldPrice < thresholdPositive2) {
                    showNotification(`Alerte: ${item.ticker} a atteint ou dépassé +2% de Prix 2 (${item.price2}) !`, 'warning');
                } else if (item.currentPrice <= thresholdNegative2 && oldPrice > thresholdNegative2) {
                    showNotification(`Alerte: ${item.ticker} a atteint ou dépassé -2% de Prix 2 (${item.price2}) !`, 'warning');
                } else if (item.currentPrice >= thresholdPositive1 && oldPrice < thresholdPositive1) {
                    showNotification(`Alerte: ${item.ticker} a atteint ou dépassé +2% de Prix 1 (${item.price1}) !`, 'warning');
                } else if (item.currentPrice <= thresholdNegative1 && oldPrice > thresholdNegative1) {
                    showNotification(`Alerte: ${item.ticker} a atteint ou dépassé -2% de Prix 1 (${item.price1}) !`, 'warning');
                }
            }
        }
    }
    renderWatchlist();
}

// Fonction pour afficher la watchlist
function renderWatchlist() {
    watchlist.innerHTML = '';
    trackedTickers.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="ticker">${item.ticker}</span>
            <span>${item.name}</span>
            <span>Prix actuel: ${item.currentPrice !== null ? item.currentPrice : 'N/A'}</span>
            <span>Prix 1: ${item.price1}</span>
            <span>Prix 2: ${item.price2}</span>
            <span>MA50: ${item.ma50}</span>
            <span>MA20: ${item.ma20}</span>
            <button class="delete-button" data-ticker="${item.ticker}">Supprimer</button>
        `;
        watchlist.appendChild(listItem);
    });

    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tickerToDelete = this.dataset.ticker;
            removeTicker(tickerToDelete);
        });
    });
}

// Fonction pour sauvegarder et charger la watchlist (inchangées)
function saveWatchlist() {
    localStorage.setItem('tradingDashboardWatchlist', JSON.stringify(trackedTickers));
}

function loadWatchlist() {
    const storedWatchlist = localStorage.getItem('tradingDashboardWatchlist');
    return storedWatchlist ? JSON.parse(storedWatchlist) : [];
}

// Événement pour ajouter un ticker (inchangé)
addButton.addEventListener('click', addTickerToWatchlist);

// Mettre à jour les prix et les MAs toutes les 15 secondes
setInterval(updateCurrentPrices, 15000);

// Affichage initial de la watchlist
renderWatchlist();
