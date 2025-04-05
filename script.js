document.addEventListener('DOMContentLoaded', () => {
    const addTickerBtn = document.getElementById('add-ticker-btn');
    const tickersBody = document.getElementById('tickers-body');
    const newTickerInput = document.getElementById('new-ticker');
    const finnhubApiKey = 'cvopq21r01qihjtq7uagcvopq21r01qihjtq7ub0';
    const localStorageKey = 'tradingDashboardData';

    let tickers = loadTickers(); // Charger les données sauvegardées

    // Fonction pour sauvegarder les tickers dans le localStorage
    function saveTickers() {
        localStorage.setItem(localStorageKey, JSON.stringify(tickers));
    }

    // Fonction pour charger les tickers depuis le localStorage
    function loadTickers() {
        const storedData = localStorage.getItem(localStorageKey);
        return storedData ? JSON.parse(storedData) : [];
    }

    // Fonction pour afficher les tickers dans le tableau
    function renderTickers() {
        tickersBody.innerHTML = '';
        tickers.forEach((ticker, index) => {
            const row = tickersBody.insertRow();

            const tickerCell = row.insertCell();
            tickerCell.textContent = ticker.symbol;

            const nameCell = row.insertCell();
            nameCell.textContent = ticker.name || 'N/A';

            const priceCell = row.insertCell();
            priceCell.textContent = ticker.currentPrice || '--';

            const price1Cell = row.insertCell();
            price1Cell.innerHTML = `<span class="editable" data-index="${index}" data-field="price1">${ticker.price1 === null ? '' : ticker.price1}</span>`;

            const price2Cell = row.insertCell();
            price2Cell.innerHTML = `<span class="editable" data-index="${index}" data-field="price2">${ticker.price2 === null ? '' : ticker.price2}</span>`;

            const actionsCell = row.insertCell();
            actionsCell.innerHTML = `
                <button class="action-button delete-btn" data-index="${index}" title="Supprimer">✖</button>
            `;

            // Gestionnaire d'événements pour la suppression
            const deleteButton = actionsCell.querySelector('.delete-btn');
            deleteButton.addEventListener('click', () => deleteTicker(index));
        });

        addEditableListeners();
        fetchCurrentPrices();
        saveTickers(); // Sauvegarder après chaque rendu
    }

    function addEditableListeners() {
        const editableSpans = document.querySelectorAll('.editable');
        editableSpans.forEach(span => {
            span.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const field = this.dataset.field;
                const currentValue = this.textContent;

                const input = document.createElement('input');
                input.type = 'number';
                input.classList.add('edit-input');
                input.value = currentValue;

                this.replaceWith(input);
                input.focus();

                input.addEventListener('blur', () => saveEditedValue(index, field, input.value));
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        input.blur();
                    } else if (event.key === 'Escape') {
                        const span = document.createElement('span');
                        span.classList.add('editable');
                        span.dataset.index = index;
                        span.dataset.field = field;
                        span.textContent = currentValue;
                        input.replaceWith(span);
                        addEditableListeners(); // Réattacher l'écouteur au nouveau span
                    }
                });
            });
        });
    }

    function saveEditedValue(index, field, newValue) {
        const parsedValue = parseFloat(newValue);
        const row = tickersBody.rows[index];
        const cellIndex = field === 'price1' ? 3 : 4;
        const cell = row.cells[cellIndex];
        const span = document.createElement('span');
        span.classList.add('editable');
        span.dataset.index = index;
        span.dataset.field = field;

        if (!isNaN(parsedValue)) {
            tickers[index][field] = parsedValue;
            span.textContent = parsedValue;
        } else {
            tickers[index][field] = null;
            span.textContent = '';
        }
        cell.innerHTML = '';
        cell.appendChild(span);
        addEditableListeners();
        saveTickers();
    }

    // Fonction pour récupérer le nom de l'actif via l'API Finnhub
    async function fetchAssetName(ticker) {
        const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${finnhubApiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.name || null;
        } catch (error) {
            console.error(`Erreur lors de la récupération du nom pour ${ticker}:`, error);
            return null;
        }
    }

    // Fonction pour récupérer le prix actuel via l'API Finnhub
    async function fetchCurrentPrice(ticker) {
        const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubApiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.c || '--';
        } catch (error) {
            console.error(`Erreur lors de la récupération du prix pour ${ticker}:`, error);
            return '--';
        }
    }

    // Fonction pour mettre à jour les prix actuels affichés
    async function fetchCurrentPrices() {
        for (const [index, ticker] of tickers.entries()) {
            const currentPrice = await fetchCurrentPrice(ticker.symbol);
            ticker.currentPrice = currentPrice;
            const row = tickersBody.rows[index];
            if (row) {
                row.cells[2].textContent = currentPrice;
            }
        }
        saveTickers(); // Sauvegarder après la mise à jour des prix
    }

    // Ajouter un nouveau ticker
    addTickerBtn.addEventListener('click', async () => {
        const newTicker = newTickerInput.value.trim().toUpperCase();

        if (newTicker) {
            const existingTickerIndex = tickers.findIndex(t => t.symbol === newTicker);
            if (existingTickerIndex === -1) {
                const name = await fetchAssetName(newTicker);
                tickers.push({ symbol: newTicker, name: name, currentPrice: null, price1: null, price2: null });
                renderTickers();
                newTickerInput.value = '';
            } else {
                alert('Ce ticker est déjà suivi.');
            }
        } else {
            alert('Veuillez saisir un ticker valide.');
        }
    });

    // Supprimer un ticker
    function deleteTicker(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce ticker ?')) {
            tickers.splice(index, 1);
            renderTickers();
        }
    }

    // Rendu initial des tickers
    renderTickers();

    // Mettre à jour les prix en temps réel
    setInterval(fetchCurrentPrices, 5000);
});
