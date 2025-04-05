document.addEventListener('DOMContentLoaded', () => {
    const addTickerBtn = document.getElementById('add-ticker-btn');
    const tickersList = document.getElementById('tickers-list');
    const newTickerInput = document.getElementById('new-ticker');
    const finnhubApiKey = 'cvopq21r01qihjtq7uagcvopq21r01qihjtq7ub0'; // Remplacez par votre clé API Finnhub

    let tickers = []; // Tableau pour stocker les informations des tickers

    // Fonction pour afficher les tickers dans la liste
    function renderTickers() {
        tickersList.innerHTML = '';
        tickers.forEach((ticker, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="ticker-info">
                    <span><strong>Ticker:</strong> <span class="ticker-symbol">${ticker.symbol}</span></span>
                    <span><strong>Nom:</strong> <span class="ticker-name">${ticker.name || 'N/A'}</span></span>
                    <span><strong>Prix Actuel:</strong> <span class="current-price">--</span></span>
                    <span><strong>Prix 1:</strong> <span class="price-1">${ticker.price1 || ''}</span></span>
                    <span><strong>Prix 2:</strong> <span class="price-2">${ticker.price2 || ''}</span></span>
                </div>
                <div class="actions-buttons">
                    <button class="edit-btn" data-index="${index}">Modifier</button>
                    <button class="delete-btn" data-index="${index}">Supprimer</button>
                </div>
                <div class="edit-form" id="edit-form-${index}">
                    <label for="edit-price-1-${index}">Prix 1:</label>
                    <input type="number" class="edit-price-1" id="edit-price-1-${index}" placeholder="Prix 1" value="${ticker.price1 || ''}">
                    <label for="edit-price-2-${index}">Prix 2:</label>
                    <input type="number" class="edit-price-2" id="edit-price-2-${index}" placeholder="Prix 2" value="${ticker.price2 || ''}">
                    <button class="save-edit-btn" data-index="${index}">Sauvegarder</button>
                    <button class="cancel-edit-btn" data-index="${index}">Annuler</button>
                </div>
            `;
            tickersList.appendChild(listItem);
        });

        // Ajouter les gestionnaires d'événements pour les boutons après le rendu
        addEventListeners();
        fetchCurrentPrices(); // Mettre à jour les prix actuels après le rendu
    }

    // Fonction pour récupérer le nom de l'actif via l'API Finnhub (profil de l'entreprise)
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

    // Fonction pour récupérer le prix actuel via l'API Finnhub (prix en temps réel)
    async function fetchCurrentPrice(ticker) {
        const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubApiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.c || '--'; // 'c' représente le prix actuel
        } catch (error) {
            console.error(`Erreur lors de la récupération du prix pour ${ticker}:`, error);
            return '--';
        }
    }

    // Fonction pour mettre à jour les prix actuels affichés
    async function fetchCurrentPrices() {
        const tickerElements = document.querySelectorAll('#tickers-list li');
        for (let i = 0; i < tickerElements.length; i++) {
            const tickerSymbolElement = tickerElements[i].querySelector('.ticker-symbol');
            const currentPriceElement = tickerElements[i].querySelector('.current-price');
            if (tickerSymbolElement && currentPriceElement) {
                const ticker = tickerSymbolElement.textContent;
                const currentPrice = await fetchCurrentPrice(ticker);
                currentPriceElement.textContent = currentPrice;
            }
        }
    }

    // Ajouter un nouveau ticker (ne demande plus les prix)
    addTickerBtn.addEventListener('click', async () => {
        const newTicker = newTickerInput.value.trim().toUpperCase();

        if (newTicker) {
            const existingTicker = tickers.find(t => t.symbol === newTicker);
            if (!existingTicker) {
                const name = await fetchAssetName(newTicker);
                tickers.push({ symbol: newTicker, name: name, price1: null, price2: null }); // Prix initialisés à null
                renderTickers();
                newTickerInput.value = '';
            } else {
                alert('Ce ticker est déjà suivi.');
            }
        } else {
            alert('Veuillez saisir un ticker valide.');
        }
    });

    // Fonction pour ajouter les gestionnaires d'événements aux boutons (après le rendu)
    function addEventListeners() {
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                deleteTicker(index);
            });
        });

        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                showEditForm(index);
            });
        });

        const saveEditButtons = document.querySelectorAll('.save-edit-btn');
        saveEditButtons.forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                saveEditedTicker(index);
            });
        });

        const cancelEditButtons = document.querySelectorAll('.cancel-edit-btn');
        cancelEditButtons.forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                hideEditForm(index);
            });
        });
    }

    // Supprimer un ticker
    function deleteTicker(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce ticker ?')) {
            tickers.splice(index, 1);
            renderTickers();
        }
    }

    // Afficher le formulaire de modification
    function showEditForm(index) {
        const editForm = document.getElementById(`edit-form-${index}`);
        if (editForm) {
            editForm.style.display = 'block';
        }
    }

    // Cacher le formulaire de modification
    function hideEditForm(index) {
        const editForm = document.getElementById(`edit-form-${index}`);
        if (editForm) {
            editForm.style.display = 'none';
        }
    }

    // Sauvegarder les modifications du ticker (Prix 1 et Prix 2)
    function saveEditedTicker(index) {
        const editForm = document.getElementById(`edit-form-${index}`);
        if (editForm) {
            const newPrice1Input = editForm.querySelector('.edit-price-1');
            const newPrice2Input = editForm.querySelector('.edit-price-2');
            const newPrice1 = parseFloat(newPrice1Input.value);
            const newPrice2 = parseFloat(newPrice2Input.value);

            if (!isNaN(newPrice1) || !isNaN(newPrice2)) {
                if (!isNaN(newPrice1)) {
                    tickers[index].price1 = newPrice1;
                }
                if (!isNaN(newPrice2)) {
                    tickers[index].price2 = newPrice2;
                }
                renderTickers();
            } else {
                alert('Veuillez saisir des prix numériques valides.');
            }
        }
    }

    // Rendu initial des tickers (si vous avez des données initiales)
    renderTickers();

    // Mettre à jour les prix en temps réel (rafraîchissement toutes les quelques secondes)
    setInterval(fetchCurrentPrices, 5000); // Rafraîchir toutes les 5 secondes
});
