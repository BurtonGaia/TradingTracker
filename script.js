const apiKey = 'cvopq21r01qihjtq7uagcvopq21r01qihjtq7ub0';
const toggleAddTickerButton = document.getElementById('toggle-add-ticker');
const addTickerModal = document.getElementById('add-ticker-modal');
const closeButton = document.querySelector('.close-button');
const tickerSearchInput = document.getElementById('ticker-search');
const suggestionsList = document.getElementById('suggestions');
const price1ModalInput = document.getElementById('price1-modal');
const price2ModalInput = document.getElementById('price2-modal');
const addButtonModal = document.getElementById('add-button-modal');
const watchlistList = document.getElementById('watchlist');
const scoreCardsContainer = document.getElementById('score-cards-container');
const notificationDiv = document.createElement('div');
notificationDiv.classList.add('notification');
document.body.appendChild(notificationDiv);
const activeAlertsList = document.getElementById('active-alerts');
const watchlistSection = document.querySelector('.watchlist-section');
const scoreCardsSection = document.querySelector('.score-cards-section');
const displayModeSelector = document.getElementById('display-mode');

let trackedTickers = loadWatchlist();
let allSymbols = [];
let activeAlerts = {};
let displayMode = localStorage.getItem('displayMode') || 'list';

// Function to switch display mode
function switchDisplayMode(mode) {
    displayMode = mode;
    localStorage.setItem('displayMode', mode);
    renderWatchlist();
}

// Écouteur d'événements pour le changement de mode d'affichage
displayModeSelector.addEventListener('change', (event) => {
    switchDisplayMode(event.target.value);
});

// Initialisation du mode d'affichage au chargement de la page
switchDisplayMode(displayMode);
displayModeSelector.value = displayMode;

// Fetch all symbols for autocompletion
async function fetchAllSymbols() {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`);
        if (!response.ok) {
            console.error('Erreur lors de la récupération des symboles:', response.status);
            return;
        }
        const data = await response.json();
        allSymbols = data
            .filter(symbol => symbol.type === 'Common Stock' && symbol.displaySymbol.indexOf('.') === -1)
            .map(symbol => ({ symbol: symbol.displaySymbol, name: symbol.description }))
            .sort((a, b) => a.symbol.localeCompare(b.symbol));
    } catch (error) {
        console.error('Erreur lors de la récupération des symboles:', error);
    }
}

// Function to display autocomplete suggestions
function displaySuggestions(query) {
    suggestionsList.innerHTML = '';
    if (!query.trim()) {
        suggestionsList.style.display = 'none';
        return;
    }

    const filteredSymbols = allSymbols.filter(item =>
        item.symbol.toLowerCase().includes(query.toLowerCase()) ||
        item.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    if (filteredSymbols.length > 0) {
        suggestionsList.style.display = 'block';
        filteredSymbols.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.symbol} - ${item.name}`;
            li.addEventListener('click', () => {
                tickerSearchInput.value = item.symbol;
                suggestionsList.style.display = 'none';
            });
            suggestionsList.appendChild(li);
        });
    } else {
        suggestionsList.style.display = 'none';
    }
}

// Event listener for ticker search input
tickerSearchInput.addEventListener('input', () => {
    displaySuggestions(tickerSearchInput.value);
});

// Event listener to hide suggestions on blur (click outside)
document.addEventListener('click', (event) => {
    if (!event.target.closest('#add-ticker-modal')) {
        suggestionsList.style.display = 'none';
    }
});
// Function to show the add ticker modal
function openAddTickerModal() {
    addTickerModal.style.display = 'block';
    tickerSearchInput.value = '';
    suggestionsList.style.display = 'none';
    price1ModalInput.value = '';
    price2ModalInput.value = '';
}

// Function to hide the add ticker modal
function closeAddTickerModal() {
    addTickerModal.style.display = 'none';
}

// Event listeners for the modal
toggleAddTickerButton.addEventListener('click', openAddTickerModal);
closeButton.addEventListener('click', closeAddTickerModal);
window.addEventListener('click', (event) => {
    if (event.target === addTickerModal) {
        closeAddTickerModal();
    }
});

// Utility function to show a notification
function showNotification(message, type = 'success', duration = 3000) {
    notificationDiv.textContent = message;
    notificationDiv.className = 'notification';
    notificationDiv.classList.add('notification', type, 'show');
    setTimeout(() => {
        notificationDiv.classList.remove('show');
    }, duration);
}

// Function to fetch company profile
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

// Function to fetch current price
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

// Function to fetch historical prices for the mini-graph
async function fetchHistoricalPrices(ticker) {
    const now = Math.floor(Date.now() / 1000);
    const from = now - (24 * 60 * 60); // Last 24 hours (in seconds)
    try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=60&from=${from}&to=${now}&token=${apiKey}`);
        if (!response.ok) {
            console.warn(`Impossible de récupérer l'historique pour ${ticker}: ${response.status}`);
            return { t: [], c: [] };
        }
        const data = await response.json();
        return { timestamps: data.t || [], closingPrices: data.c || [] };
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'historique pour ${ticker}:`, error);
        return { timestamps: [], closingPrices: [] };
    }
}
// Function to add a ticker to the watchlist (using modal inputs)
async function addTickerToWatchlistModal() {
    const selectedTicker = tickerSearchInput.value.trim().toUpperCase();
    const price1 = parseFloat(price1ModalInput.value);
    const price2 = parseFloat(price2ModalInput.value);

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

    try {
        const [companyInfo, priceInfo] = await Promise.all([
            fetchCompanyProfile(selectedTicker),
            fetchCurrentPrice(selectedTicker)
        ]);

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
        renderActiveAlerts();
        closeAddTickerModal();

    } catch (error) {
        console.error("Erreur lors de l'ajout du ticker:", error);
        showNotification("Une erreur s'est produite lors de l'ajout du ticker.", 'error');
    }
}

// Event listener for adding ticker from modal
addButtonModal.addEventListener('click', addTickerToWatchlistModal);

// Function to remove a ticker from the watchlist
function removeTicker(tickerToRemove) {
    trackedTickers = trackedTickers.filter(item => item.ticker !== tickerToRemove);
    saveWatchlist();
    renderWatchlist();
    renderActiveAlerts();
}

// Function to update current prices and check thresholds
async function updateCurrentPrices() {
    const updatedTickers = [];
    const currentActiveAlerts = {};

    for (const item of trackedTickers) {
        const priceInfo = await fetchCurrentPrice(item.ticker);
        if (priceInfo.currentPrice !== null) {
            const currentPrice = priceInfo.currentPrice;
            const thresholdPositiveCurrent1 = currentPrice * 1.03;
            const thresholdNegativeCurrent1 = currentPrice * 0.97;
            const thresholdPositiveCurrent2 = currentPrice * 1.03;
            const thresholdNegativeCurrent2 = currentPrice * 0.97;

            let isAlerting = false;
            let alertMessage = null;

            if (item.price1 >= thresholdNegativeCurrent1 && item.price1 <= thresholdPositiveCurrent1) {
                alertMessage = `Alerte: Prix 1 (${item.price1.toFixed(2)}) proche du prix actuel (${currentPrice.toFixed(2)})`;
                isAlerting = true;
            } else if (item.price2 >= thresholdNegativeCurrent2 && item.price2 <= thresholdPositiveCurrent2) {
                alertMessage = `Alerte: Prix 2 (${item.price2.toFixed(2)}) proche du prix actuel (${currentPrice.toFixed(2)})`;
                isAlerting = true;
            }

            item.isAlerting = isAlerting;
            item.alertMessage = alertMessage;
            item.currentPrice = currentPrice.toFixed(2);

            // Fetch historical data for the graph
            const historicalData = await fetchHistoricalPrices(item.ticker);
            item.historicalData = historicalData;
        }
        updatedTickers.push(item);
    }

    trackedTickers = updatedTickers;
    activeAlerts = {};
    trackedTickers.forEach(tickerData => {
        if (tickerData.isAlerting && tickerData.alertMessage) {
            activeAlerts[tickerData.ticker] = tickerData.alertMessage;
        }
    });
    renderWatchlist();
    renderActiveAlerts();
}
// Function to render the watchlist
function renderWatchlist() {
    watchlistList.innerHTML = '';
    scoreCardsContainer.innerHTML = '';
    watchlistSection.style.display = 'none';
    scoreCardsSection.style.display = 'none';

    if (displayMode === 'list') {
        watchlistSection.style.display = 'block';
        trackedTickers.forEach(item => {
            const listItem = document.createElement('li');
            listItem.classList.toggle('alerting', item.isAlerting);
            listItem.innerHTML = `
                <span class="ticker">${item.ticker}</span>
                <span>${item.name}</span>
                <span>${item.currentPrice !== null ? item.currentPrice : 'N/A'}</span>
                <span>${item.price1}</span>
                <span>${item.price2}</span>
                <button class="delete-button" data-ticker="${item.ticker}">&times;</button>
            `;
            watchlistList.appendChild(listItem);
        });

        const deleteButtons = watchlistList.querySelectorAll('.delete-button');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tickerToDelete = this.dataset.ticker;
                removeTicker(tickerToDelete);
            });
        });
    } else if (displayMode === 'cards') {
        scoreCardsSection.style.display = 'flex';
        trackedTickers.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('score-card');
            card.classList.toggle('alerting', item.isAlerting);
            card.innerHTML = `
                <div class="score-card-header">
                    <span class="ticker">${item.ticker}</span>
                </div>
                <div class="score-card-info">
                    <p>Nom: ${item.name}</p>
                    <p>Prix Actuel: ${item.currentPrice !== null ? item.currentPrice : 'N/A'}</p>
                    <p>Prix 1: ${item.price1}</p>
                    <p>Prix 2: ${item.price2}</p>
                </div>
                <canvas class="score-card-graph" id="chart-${item.ticker}"></canvas>
                <button class="delete-button" data-ticker="${item.ticker}">&times;</button>
            `;
            scoreCardsContainer.appendChild(card);

            const deleteButton = card.querySelector('.delete-button');
            deleteButton.addEventListener('click', function() {
                const tickerToDelete = this.dataset.ticker;
                removeTicker(tickerToDelete);
            });

            const chartId = `chart-${item.ticker}`;
            const ctx = document.getElementById(chartId)?.getContext('2d');
            if (ctx && item.historicalData && item.historicalData.timestamps && item.historicalData.closingPrices) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: item.historicalData.timestamps.map(ts => new Date(ts * 1000).toLocaleTimeString()),
                        datasets: [{
                            label: 'Prix',
                            data: item.historicalData.closingPrices,
                            borderColor: '#64b5f6',
                            backgroundColor: 'rgba(100, 181, 246, 0.2)',
                            borderWidth: 1,
                            pointRadius: 0
                        }, {
                            label: 'Prix 1',
                            data: Array(item.historicalData.timestamps.length).fill(item.price1),
                            borderColor: '#48bb78',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            pointRadius: 0
                        }, {
                            label: 'Prix 2',
                            data: Array(item.historicalData.timestamps.length).fill(item.price2),
                            borderColor: '#ed8936',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            pointRadius: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                display: false // Cacher l'axe X pour la brièveté
                            },
                            y: {
                                beginAtZero: false
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        });
    }
}

// Function to render active alerts
function renderActiveAlerts() {
    activeAlertsList.innerHTML = '';
    for (const ticker in activeAlerts) {
        if (activeAlerts.hasOwnProperty(ticker)) {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>${ticker}</span>: ${activeAlerts[ticker]}`;
            activeAlertsList.appendChild(listItem);
        }
    }
}
// Function to save and load the watchlist
function saveWatchlist() {
    localStorage.setItem('tradingDashboardWatchlist', JSON.stringify(trackedTickers));
}

function loadWatchlist() {
    const storedWatchlist = localStorage.getItem('tradingDashboardWatchlist');
    return storedWatchlist ? JSON.parse(storedWatchlist) : [];
}

// Initial setup
fetchAllSymbols().then(() => {
    renderWatchlist();
    renderActiveAlerts();
    setInterval(updateCurrentPrices, 10000);
});
