const apiKey = 'cvopq21r01qihjtq7uagcvopq21r01qihjtq7ub0';
const toggleAddTickerButton = document.getElementById('toggle-add-ticker');
const addTickerModal = document.getElementById('add-ticker-modal');
const closeButton = document.querySelector('.close-button');
const tickerSearchInput = document.getElementById('ticker-search');
const suggestionsList = document.getElementById('suggestions');
const price1ModalInput = document.getElementById('price1-modal');
const price2ModalInput = document.getElementById('price2-modal');
const addButtonModal = document.getElementById('add-button-modal');
const watchlist = document.getElementById('watchlist');
const notificationDiv = document.createElement('div');
notificationDiv.classList.add('notification');
document.body.appendChild(notificationDiv);

let trackedTickers = loadWatchlist();
let allSymbols = []; // Store all available symbols for autocompletion

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
    ).slice(0, 10); // Limit to 10 suggestions

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
}

// Function to update current prices and check thresholds
async function updateCurrentPrices() {
    const updatedTickers = [];
    for (const item of trackedTickers) {
        const priceInfo = await fetchCurrentPrice(item.ticker);
        if (priceInfo.currentPrice !== null) {
            const oldPrice = item.currentPrice;
            const currentPrice = priceInfo.currentPrice.toFixed(2);

            const thresholdPositive1 = item.price1 * 1.02;
            const thresholdNegative1 = item.price1 * 0.98;
            const thresholdPositive2 = item.price2 * 1.02;
            const thresholdNegative2 = item.price2 * 0.98;

            if (oldPrice !== null) {
                if (currentPrice >= thresholdPositive2 && oldPrice < thresholdPositive2) {
                    showNotification(`Alerte: ${item.ticker} a atteint ou dépassé +2% de Prix 2 (${item.price2}) !`, 'warning');
                } else if (currentPrice <= thresholdNegative2 && oldPrice > thresholdNegative2) {
                    showNotification(`Alerte: ${item.ticker} a atteint ou dépassé -2% de Prix 2 (${item.price2}) !`, 'warning');
                } else if (currentPrice >= thresholdPositive1 && oldPrice < thresholdPositive1) {
                    showNotification(`Alerte: ${item.ticker} a atteint ou dépassé +2% de Prix 1 (${item.price1}) !`, 'warning');
                } else if (currentPrice <= thresholdNegative1 && oldPrice > thresholdNegative1) {
                    showNotification(`Alerte: ${item.ticker} a atteint ou dépassé -2% de Prix 1 (${item.price1}) !`, 'warning');
                }
            }
            item.currentPrice = currentPrice;
        }
        updatedTickers.push(item);
    }
    trackedTickers = updatedTickers; // Update global trackedTickers after all fetches
    renderWatchlist();
}

// Function to render the watchlist
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
    setInterval(updateCurrentPrices, 10000);
});
