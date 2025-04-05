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

// Fonction pour afficher une notification
function showNotification(message, type = 'success', duration = 3000) {
    notificationDiv.textContent = message;
    notificationDiv.className = 'notification';
    notificationDiv.classList.add('notification', type);
    notificationDiv.classList.add('show');
    setTimeout(() => {
        notificationDiv.classList.remove('show');
    }, duration);
}

// Fonction pour récupérer les informations de l'actif (nom)
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

// Fonction pour récupérer le prix actuel
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

    if (priceInfo.currentPrice === null) {
        showNotification(`Impossible de récupérer le prix pour ${selectedTicker}. Vérifiez le ticker.`, 'error');
        return;
    }

    const newTickerData = {
        ticker: selectedTicker,
        name: companyInfo.name,
        price1: price1,
        price2: price2,
        currentPrice: priceInfo.currentPrice
    };

    trackedTickers.push(newTickerData);
    saveWatchlist();
    renderWatchlist();

    tickerInput.value = '';
    price1Input.value = '';
    price2Input.value = '';
}

// Fonction pour supprimer un ticker de la watchlist
function removeTicker(tickerToRemove) {
    trackedTickers = trackedTickers.filter(item => item.ticker !== tickerToRemove);
    saveWatchlist();
    renderWatchlist();
}

// Fonction pour mettre à jour le prix actuel et vérifier les seuils
async function updateCurrentPrices() {
    for (const item of trackedTickers) {
        const priceInfo = await fetchCurrentPrice(item.ticker);
        if (priceInfo.currentPrice !== null) {
            const oldPrice = item.currentPrice;
            item.currentPrice = priceInfo.currentPrice.toFixed(2);

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

// Fonction pour sauvegarder et charger la watchlist
function saveWatchlist() {
    localStorage.setItem('tradingDashboardWatchlist', JSON.stringify(trackedTickers));
}

function loadWatchlist() {
    const storedWatchlist = localStorage.getItem('tradingDashboardWatchlist');
    return storedWatchlist ? JSON.parse(storedWatchlist) : [];
}

// Événement pour ajouter un ticker
addButton.addEventListener('click', addTickerToWatchlist);

// Mettre à jour les prix toutes les 10 secondes
setInterval(updateCurrentPrices, 10000);

// Affichage initial de la watchlist
renderWatchlist();

// Auto-refresh de la page toutes les 10 secondes
setInterval(() => {
    location.reload();
}, 10000);
