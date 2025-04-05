document.addEventListener('DOMContentLoaded', () => {
    const addTickerBtn = document.getElementById('add-ticker-btn');
    const tickersList = document.getElementById('tickers-list');
    const newTickerInput = document.getElementById('new-ticker');
    const price1Input = document.getElementById('price-1');
    const price2Input = document.getElementById('price-2');

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
                    <span><strong>Prix 1:</strong> <span class="price-1">${ticker.price1}</span></span>
                    <span><strong>Prix 2:</strong> <span class="price-2">${ticker.price2}</span></span>
                </div>
                <div class="actions-buttons">
                    <button class="edit-btn" data-index="${index}">Modifier</button>
                    <button class="delete-btn" data-index="${index}">Supprimer</button>
                </div>
                <div class="edit-form" id="edit-form-${index}">
                    <input type="number" class="edit-price-1" placeholder="Nouveau Prix 1" value="${ticker.price1}">
                    <input type="number" class="edit-price-2" placeholder="Nouveau Prix 2" value="${ticker.price2}">
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

    // Fonction pour récupérer le nom de l'actif (simulée ici)
    async function fetchAssetName(ticker) {
        // Dans une application réelle, vous feriez un appel API ici
        await new Promise(resolve => setTimeout(resolve, 500)); // Simule un délai d'appel API
        const mockData = {
            "AAPL": "Apple Inc.",
            "GOOGL": "Alphabet Inc. (Class A)",
            "MSFT": "Microsoft Corporation"
        };
        return mockData[ticker.toUpperCase()] || null;
    }

    // Fonction pour récupérer le prix actuel (simulée ici)
    async function fetchCurrentPrice(ticker) {
        // Dans une application réelle, vous feriez un appel API ici (par exemple, via une API de données boursières)
        await new Promise(resolve => setTimeout(resolve, 300)); // Simule un délai d'appel API
        const mockPrices = {
            "AAPL": (Math.random() * 50 + 150).toFixed(2),
            "GOOGL": (Math.random() * 500 + 2500).toFixed(2),
            "MSFT": (Math.random() * 100 + 300).toFixed(2)
        };
        return mockPrices[ticker.toUpperCase()] || '--';
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

    // Ajouter un nouveau ticker
    addTickerBtn.addEventListener('click', async () => {
        const newTicker = newTickerInput.value.trim().toUpperCase();
        const price1 = parseFloat(price1Input.value);
        const price2 = parseFloat(price2Input.value);

        if (newTicker && !isNaN(price1) && !isNaN(price2)) {
            const existingTicker = tickers.find(t => t.symbol === newTicker);
            if (!existingTicker) {
                const name = await fetchAssetName(newTicker);
                tickers.push({ symbol: newTicker, name: name, price1: price1, price2: price2 });
                renderTickers();
                newTickerInput.value = '';
                price1Input.value = '';
                price2Input.value = '';
            } else {
                alert('Ce ticker est déjà suivi.');
            }
        } else {
            alert('Veuillez saisir un ticker valide et des prix numériques.');
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

    // Sauvegarder les modifications du ticker
    function saveEditedTicker(index) {
        const editForm = document.getElementById(`edit-form-${index}`);
        if (editForm) {
            const newPrice1 = parseFloat(editForm.querySelector('.edit-price-1').value);
            const newPrice2 = parseFloat(editForm.querySelector('.edit-price-2').value);

            if (!isNaN(newPrice1) && !isNaN(newPrice2)) {
                tickers[index].price1 = newPrice1;
                tickers[index].price2 = newPrice2;
                renderTickers();
            } else {
                alert('Veuillez saisir des prix numériques valides.');
            }
        }
    }

    // Rendu initial des tickers (si vous avez des données initiales)
    renderTickers();
});
