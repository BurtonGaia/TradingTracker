// Classe principale de l'application
class TradingDashboard {
    constructor() {
        this.tickers = [];
        this.lastUpdate = null;
        this.autoRefreshInterval = 3600000; // 1 heure en millisecondes
        this.autoRefreshTimer = null;
        this.initElements();
        this.initEventListeners();
        this.loadFromLocalStorage();
        this.startAutoRefresh();
    }

    // Initialiser les éléments du DOM
    initElements() {
        this.tickerForm = document.getElementById('ticker-form');
        this.tickersList = document.getElementById('tickers-list');
        this.lastUpdateTime = document.getElementById('last-update-time');
        this.refreshBtn = document.getElementById('refresh-btn');
        this.editModal = document.getElementById('edit-modal');
        this.editTickerForm = document.getElementById('edit-ticker-form');
        this.closeModal = document.querySelector('.close-modal');
    }

    // Initialiser les écouteurs d'événements
    initEventListeners() {
        this.tickerForm.addEventListener('submit', this.handleAddTicker.bind(this));
        this.refreshBtn.addEventListener('click', this.refreshAllTickers.bind(this));
        this.editTickerForm.addEventListener('submit', this.handleEditTicker.bind(this));
        this.closeModal.addEventListener('click', this.closeEditModal.bind(this));
        
        // Fermer le modal si on clique en dehors
        window.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });
    }

    // Gérer l'ajout d'un nouveau ticker
    async handleAddTicker(e) {
        e.preventDefault();
        
        const symbolInput = document.getElementById('ticker-symbol');
        const price1Input = document.getElementById('price-1');
        const price2Input = document.getElementById('price-2');
        
        const symbol = symbolInput.value.trim().toUpperCase();
        const price1 = parseFloat(price1Input.value);
        const price2 = parseFloat(price2Input.value);
        
        if (!symbol || isNaN(price1) || isNaN(price2)) {
            showNotification('Veuillez remplir tous les champs correctement', 3000);
            return;
        }
        
        // Vérifier si le ticker existe déjà
        if (this.tickers.some(ticker => ticker.symbol === symbol)) {
            showNotification(`Le ticker ${symbol} existe déjà`, 3000);
            return;
        }
        
        try {
            // Vérifier si le ticker est valide en essayant de récupérer son prix
            const tickerData = await apiService.getTickerData(symbol);
            
            const newTicker = {
                id: generateID(),
                symbol,
                price1,
                price2,
                ...tickerData,
                lastUpdate: new Date().toISOString()
            };
            
            this.tickers.push(newTicker);
            this.renderTickers();
            this.saveToLocalStorage();
            
            // Réinitialiser le formulaire
            symbolInput.value = '';
            price1Input.value = '';
            price2Input.value = '';
            
            showNotification(`Ticker ${symbol} ajouté avec succès`, 3000);
        } catch (error) {
            showNotification(`Erreur: Impossible d'ajouter le ticker ${symbol}. Vérifiez qu'il est valide.`, 3000);
            console.error('Erreur lors de l\'ajout du ticker:', error);
        }
    }

    // Gérer la modification d'un ticker
    async handleEditTicker(e) {
        e.preventDefault();
        
        const id = document.getElementById('edit-ticker-id').value;
        const symbol = document.getElementById('edit-ticker-symbol').value;
        const price1 = parseFloat(document.getElementById('edit-price-1').value);
        const price2 = parseFloat(document.getElementById('edit-price-2').value);
        
        if (!id || !symbol || isNaN(price1) || isNaN(price2)) {
            showNotification('Veuillez remplir tous les champs correctement', 3000);
            return;
        }
        
        // Trouver et mettre à jour le ticker
        const tickerIndex = this.tickers.findIndex(ticker => ticker.id === id);
        
        if (tickerIndex !== -1) {
            this.tickers[tickerIndex].price1 = price1;
            this.tickers[tickerIndex].price2 = price2;
            
            this.renderTickers();
            this.saveToLocalStorage();
            this.closeEditModal();
            
            showNotification(`Ticker ${symbol} mis à jour avec succès`, 3000);
        }
    }

    // Ouvrir le modal d'édition pour un ticker
    openEditModal(id) {
        const ticker = this.tickers.find(ticker => ticker.id === id);
        
        if (!ticker) return;
        
        document.getElementById('edit-ticker-id').value = ticker.id;
        document.getElementById('edit-ticker-symbol').value = ticker.symbol;
        document.getElementById('edit-price-1').value = ticker.price1;
        document.getElementById('edit-price-2').value = ticker.price2;
        
        this.editModal.style.display = 'block';
    }

    // Fermer le modal d'édition
    closeEditModal() {
        this.editModal.style.display = 'none';
    }

    // Supprimer un ticker
    deleteTicker(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce ticker?')) {
            const tickerIndex = this.tickers.findIndex(ticker => ticker.id === id);
            
            if (tickerIndex !== -1) {
                const symbol = this.tickers[tickerIndex].symbol;
                this.tickers.splice(tickerIndex, 1);
                this.renderTickers();
                this.saveToLocalStorage();
                
                showNotification(`Ticker ${symbol} supprimé`, 3000);
            }
        }
    }

    // Rafraîchir les données d'un ticker
    async refreshTicker(id) {
        const tickerIndex = this.tickers.findIndex(ticker => ticker.id === id);
        
        if (tickerIndex === -1) return;
        
        const ticker = this.tickers[tickerIndex];
        
        try {
            const tickerData = await apiService.getTickerData(ticker.symbol);
            
            this.tickers[tickerIndex] = {
                ...ticker,
                ...tickerData,
                lastUpdate: new Date().toISOString()
            };
            
            this.renderTickers();
            this.saveToLocalStorage();
            this.updateLastUpdateTime();
            
            // Vérifier les alertes
            this.checkAlerts(this.tickers[tickerIndex]);
            
            showNotification(`Ticker ${ticker.symbol} mis à jour`, 3000);
        } catch (error) {
            showNotification(`Erreur lors de la mise à jour de ${ticker.symbol}`, 3000);
            console.error('Erreur lors du rafraîchissement du ticker:', error);
        }
    }

    // Rafraîchir tous les tickers
    async refreshAllTickers() {
        if (this.tickers.length === 0) {
            showNotification('Aucun ticker à rafraîchir', 3000);
            return;
        }
        
        showNotification('Rafraîchissement de tous les tickers...', 3000);
        
        try {
            // Mettre à jour chaque ticker séquentiellement pour respecter les limites de l'API
            for (const ticker of this.tickers) {
                await this.refreshTicker(ticker.id);
            }
            
            this.updateLastUpdateTime();
            showNotification('Tous les tickers ont été mis à jour', 3000);
        } catch (error) {
            showNotification('Erreur lors du rafraîchissement des tickers', 3000);
            console.error('Erreur lors du rafraîchissement de tous les tickers:', error);
        }
    }

    // Vérifier les alertes pour un ticker
    checkAlerts(ticker) {
        if (!ticker) return;
        
        // Vérifier COMBO
        const hasComboAlert = hasCombo(
            ticker.currentPrice,
            ticker.ma20,
            ticker.ma50,
            ticker.bollingerLower
        );
        
        // Vérifier les alertes de prix
        const hasPriceAlert = isPriceAlertTriggered(
            ticker.currentPrice,
            ticker.price1,
            ticker.price2
        );
        
        // Jouer un son d'alerte si nécessaire
        if (hasComboAlert || hasPriceAlert) {
            playAlertSound();
            
            if (hasComboAlert) {
                showNotification(`COMBO détecté pour ${ticker.symbol}!`, 5000);
            }
            
            if (hasPriceAlert) {
                showNotification(`Prix cible atteint pour ${ticker.symbol}!`, 5000);
            }
        }
    }

    // Rendre la liste des tickers
    renderTickers() {
        this.tickersList.innerHTML = '';
        
        if (this.tickers.length === 0) {
            this.tickersList.innerHTML = '<div class="no-tickers">Aucun ticker ajouté</div>';
            return;
        }
        
        this.tickers.forEach(ticker => {
            const hasComboAlert = hasCombo(
                ticker.currentPrice, 
                ticker.ma20, 
                ticker.ma50, 
                ticker.bollingerLower
            );
            
            const hasPriceAlert = isPriceAlertTriggered(
                ticker.currentPrice,
                ticker.price1,
                ticker.price2
            );
            
            let statusClass = 'status-normal';
            let statusText = 'Normal';
            
            if (hasComboAlert) {
                statusClass = 'status-combo';
                statusText = 'COMBO';
            } else if (hasPriceAlert) {
                statusClass = 'status-price-alert';
                statusText = 'PRIX CIBLE';
            }
            
            const tickerElement = document.createElement('div');
            tickerElement.className = 'ticker-item';
            tickerElement.innerHTML = `
                <div class="ticker-symbol">${ticker.symbol}</div>
                <div class="ticker-price">${formatPrice(ticker.currentPrice)}</div>
                <div>${formatPrice(ticker.price1)}</div>
                <div>${formatPrice(ticker.price2)}</div>
                <div>${formatPrice(ticker.ma20)}</div>
                <div>${formatPrice(ticker.ma50)}</div>
                <div>${formatPrice(ticker.bollingerLower)}</div>
                <div><span class="status-indicator ${statusClass}">${statusText}</span></div>
                <div class="ticker-actions">
                    <button class="btn btn-edit" data-id="${ticker.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-delete" data-id="${ticker.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Ajouter les événements
            const editBtn = tickerElement.querySelector('.btn-edit');
            const deleteBtn = tickerElement.querySelector('.btn-delete');
            
            editBtn.addEventListener('click', () => this.openEditModal(ticker.id));
            deleteBtn.addEventListener('click', () => this.deleteTicker(ticker.id));
            
            this.tickersList.appendChild(tickerElement);
        });
    }

    // Démarrer le rafraîchissement automatique
    startAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }
        
        this.autoRefreshTimer = setInterval(() => {
            this.refreshAllTickers();
        }, this.autoRefreshInterval);
    }

    // Mettre à jour l'heure de la dernière mise à jour
    updateLastUpdateTime() {
        this.lastUpdate = new Date();
        this.lastUpdateTime.textContent = formatDate(this.lastUpdate);
    }

    // Sauvegarder les tickers dans le localStorage
    saveToLocalStorage() {
        localStorage.setItem('tradingDashboardTickers', JSON.stringify(this.tickers));
        localStorage.setItem('tradingDashboardLastUpdate', this.lastUpdate ? this.lastUpdate.toISOString() : null);
    }

    // Charger les tickers depuis le localStorage
    loadFromLocalStorage() {
        const savedTickers = localStorage.getItem('tradingDashboardTickers');
        const savedLastUpdate = localStorage.getItem('tradingDashboardLastUpdate');
        
        if (savedTickers) {
            this.tickers = JSON.parse(savedTickers);
        }
        
        if (savedLastUpdate) {
            this.lastUpdate = new Date(savedLastUpdate);
            this.lastUpdateTime.textContent = formatDate(this.lastUpdate);
        }
        
        this.renderTickers();
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const app = new TradingDashboard();
});
