const apiKey = 'VOTRE_CLE_API_FINNHUB'; // Remplacez par votre clé API
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

// Function to fetch company profile (unchanged)
async function fetchCompanyProfile(ticker) {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=<span class="math-inline">\{ticker\}&token\=</span>{apiKey}`);
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

// Function to fetch current price (unchanged)
async function fetchCurrentPrice(ticker) {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=<span class="math-inline">\{ticker\}&token\=</span>{apiKey}`);
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

// Function
