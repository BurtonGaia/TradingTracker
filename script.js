document.addEventListener('DOMContentLoaded', () => {
    const addTickerBtn = document.getElementById('add-ticker-btn');
    const tickersBody = document.getElementById('tickers-body');
    const newTickerInput = document.getElementById('new-ticker');
    const finnhubApiKey = 'VOTRE_CLE_API_FINNHUB'; // Remplacez par votre clé API Finnhub
    const localStorageKey = 'tradingDashboardData';

    let tickers = loadTickers(); // Charger les données sauvegardées
    let editingIndex = -1; // Index de la ligne en cours d'édition

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
            row.dataset.index = index; // Stocker l'index dans l'attribut data

            const tickerCell = row.insertCell();
            const nameCell = row.insertCell();
            const priceCell = row.insertCell();
            const price1Cell = row.insertCell();
            const price2Cell = row.insertCell();
            const actionsCell = row.insertCell();

            if (editingIndex === index) {
                row.classList.add('edit-row');
                tickerCell.innerHTML = `<input type="text" class="edit-input" value="${ticker.symbol}">`;
                nameCell.textContent = ticker.name || 'N/A'; // Le nom est récupéré à la sauvegarde
                priceCell.textContent = ticker.currentPrice || '--'; // Prix actuel non modifiable ici
                price1Cell.innerHTML = `<input type="number" class="edit-input" value="${ticker.price1 === null ? '' : ticker.price1}">`;
                price2Cell.innerHTML = `<input type="number" class="edit-input" value="${ticker.price2 === null ? '' : ticker.price2}">`;
                actionsCell.classList.add('edit-actions');
                actionsCell.innerHTML = `
                    <button class="save-row-btn" data-index="${index}">Sauvegarder</button>
                    <button class="cancel-row-btn" data-index="${index}">Annuler</button>
                `;

                // Ajouter les gestionnaires d'événements ici, après la création des boutons
                const saveButton = actionsCell.querySelector('.save-row-btn');
                saveButton.addEventListener('click', () => saveEditedRow(index));

                const cancelButton = actionsCell.querySelector('.cancel-row-btn');
                cancelButton.addEventListener('click', () => {
                    editingIndex = -1;
                    renderTickers();
                });

            } else {
                tickerCell.textContent = ticker.symbol;
                nameCell.textContent = ticker.name || 'N/A';
                priceCell.textContent = ticker.currentPrice || '--';
                price1Cell.textContent = ticker.price1 === null ? '' : ticker.price1;
                price2Cell.textContent = ticker.price2 === null ? '' : ticker.price2;
                actionsCell.innerHTML = `
                    <button class="action-button edit-btn" data-index="${index}" title="Modifier">M</button>
                    <button class="action-button delete-btn" data-index="${index}" title="Supprimer">✖</button>
                `;

                const editButton = actionsCell.querySelector('.edit-btn');
                editButton.addEventListener('click', () => startEditRow(index));

                const deleteButton = actionsCell.querySelector('.delete-btn');
                deleteButton.addEventListener('click', () => deleteTicker(index));
            }
        });

        fetchCurrentPrices();
        saveTickers(); // Sauvegarder après chaque rendu
    }

    function startEditRow(index) {
        editingIndex = index;
        renderTickers();
    }

    async function saveEditedRow(index) {
        console.log('saveEditedRow appelée avec index:', index);
        const row = tickersBody.rows[index];
        const tickerInput = row.cells[0].querySelector('input[type="text"]');
        const price1Input = row.cells[3].querySelector('input[type="number"]');
        const price2Input = row.cells[4].querySelector('input[type="number"]');

        if (tickerInput) {
            const newTicker = tickerInput.value.trim().toUpperCase();
            const newPrice1 = parseFloat(price1Input ? price1Input.value : null); // Vérification si l'input existe
            const newPrice2 = parseFloat(price2Input ? price2Input.value : null); // Vérification si l'input existe

            console.log('newTicker:', newTicker, 'newPrice1:', newPrice1, 'newPrice2:', newPrice2);

            if (newTicker) {
                const existingTickerIndex = tickers.findIndex(t => t.symbol === newTicker && t !== tickers[index]);
                if (existingTickerIndex === -1) {
                    const name = await fetchAssetName(newTicker);
                    tickers[index].symbol = newTicker;
                    tickers[index].name = name;
                    tickers[index].price1 = isNaN(newPrice1) ? null : newPrice1;
                    tickers[index].price2 = isNaN(newPrice2) ? null : newPrice2;
                    editingIndex = -1;
                    console.log('tickers après modification:', tickers);
                    renderTickers();
                } else {
                    alert('Ce ticker est déjà suivi.');
                }
            } else {
                alert('Le ticker ne peut pas être vide.');
            }
        }
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
            if (row && editingIndex !== index) {
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

    // Supprimer un ticker (sans confirmation)
    function deleteTicker(index) {
        tickers.splice(index, 1);
        if (editingIndex === index) {
            editingIndex = -1; // Sortir du mode édition si la ligne est supprimée
        } else if (editingIndex > index) {
            editingIndex--; // Ajuster l'index d'édition si une ligne précédente est supprimée
        }
        renderTickers();
    }

    // Rendu initial des tickers
    renderTickers();

    // Mettre à jour les prix en temps réel
    setInterval(fetchCurrentPrices, 5000);
});
