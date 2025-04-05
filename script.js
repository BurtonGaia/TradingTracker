const apiKey = 'cvopq21r01qihjtq7uagcvopq21r01qihjtq7ub0';
const tickerSelect = document.getElementById('ticker-select');
const price1Input = document.getElementById('price1');
const price2Input = document.getElementById('price2');
const addButton = document.getElementById('add-button');
const watchlist = document.getElementById('watchlist');

let trackedTickers = [];

// Fonction pour récupérer la liste des symboles (vous pouvez la simplifier ou la personnaliser)
async function fetchSymbols() {
    try {
        const response = await fetch(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filtrer et trier les symboles (vous pouvez ajuster le filtre)
        const filteredSymbols = data
            .filter(symbol => symbol.type === 'Common Stock' && symbol.displaySymbol.indexOf('.') === -1)
            .sort((a, b) => a.displaySymbol.localeCompare(b.displaySymbol));

        filteredSymbols.forEach(symbol => {
            const option = document.createElement('option');
            option.value = symbol.displaySymbol;
            option.textContent = `${symbol.displaySymbol} - ${symbol.description}`;
            tickerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des symboles:', error);
    }
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
            return { currentPrice: 'N/A' };
        }
        const data = await response.json();
        return { currentPrice: data.c !== undefined ? data.c.toFixed(2) : 'N/A' };
    } catch (error) {
        console.error(`Erreur lors de la récupération du prix pour ${ticker}:`, error);
        return { currentPrice: 'N/A' };
    }
}

// Fonction pour ajouter un ticker à la watchlist
async function addTickerToWatchlist() {
    const selectedTicker = tickerSelect.value;
    const price1 = parseFloat(price1Input.value);
    const price2 = parseFloat(price2Input.value);

    if (!selectedTicker || isNaN(price1) || isNaN(price2)) {
        alert('Veuillez sélectionner un ticker et entrer des prix valides.');
        return;
    }

    if (trackedTickers.some(item => item.ticker === selectedTicker)) {
        alert('Ce ticker est déjà dans votre watchlist.');
        return;
    }

    const companyInfo = await fetchCompanyProfile(selectedTicker);
    const priceInfo = await fetchCurrentPrice(selectedTicker);

    const newTickerData = {
        ticker: selectedTicker,
        name: companyInfo.name,
        price1: price1,
        price2: price2,
        currentPrice: priceInfo.currentPrice
    };

    trackedTickers.push(newTickerData);
    renderWatchlist();

    // Réinitialiser les champs de saisie
    tickerSelect.value = '';
    price1Input.value = '';
    price2Input.value = '';
}

// Fonction pour supprimer un ticker de la watchlist
function removeTicker(tickerToRemove) {
    trackedTickers = trackedTickers.filter(item => item.ticker !== tickerToRemove);
    renderWatchlist();
}

// Fonction pour mettre à jour le prix actuel et réafficher la watchlist
async function updateCurrentPrices() {
    for (const item of trackedTickers) {
        const priceInfo = await fetchCurrentPrice(item.ticker);
        item.currentPrice = priceInfo.currentPrice;
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
            <span>Prix actuel: ${item.currentPrice}</span>
            <span>Prix 1: ${item.price1}</span>
            <span>Prix 2: ${item.price2}</span>
            <button class="delete-button" data-ticker="${item.ticker}">Supprimer</button>
        `;
        watchlist.appendChild(listItem);
    });

    // Ajouter des gestionnaires d'événements pour les boutons de suppression
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tickerToDelete = this.dataset.ticker;
            removeTicker(tickerToDelete);
        });
    });
}

// Événement pour ajouter un ticker
addButton.addEventListener('click', addTickerToWatchlist);

// Charger la liste des symboles au chargement de la page
fetchSymbols();

// Mettre à jour les prix actuels toutes les 15 secondes (par exemple)
setInterval(updateCurrentPrices, 15000);

// Affichage initial de la watchlist (si des données étaient stockées localement, par exemple)
renderWatchlist();
