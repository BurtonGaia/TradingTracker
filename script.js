// Charger les stocks depuis LocalStorage
let stocks = JSON.parse(localStorage.getItem('stocks')) || [];
const stockList = document.getElementById('stockList');

function saveStocks() {
  localStorage.setItem('stocks', JSON.stringify(stocks));
}

// Afficher les stocks
function displayStocks() {
  stockList.innerHTML = '';
  stocks.forEach((stock, index) => {
    const card = document.createElement('div');
    card.className = 'stock-card';
    card.innerHTML = `
      <span>${stock.symbol}</span>
      <div class="price">Prix actuel: <span class="current-price">Chargement...</span></div>
      <div>Seuil bas: <span class="price1">${stock.price1}</span></div>
      <div>Seuil haut: <span class="price2">${stock.price2}</span></div>
      <div class="edit-inputs" style="display: none;">
        <input type="number" class="edit-price1" value="${stock.price1}" step="0.01">
        <input type="number" class="edit-price2" value="${stock.price2}" step="0.01">
      </div>
     保護<button class="edit-btn" onclick="toggleEdit(${index})">Modifier</button>
      <button class="delete-btn" onclick="deleteStock(${index})">Supprimer</button>
    `;
    stockList.appendChild(card);
    fetchPrice(stock.symbol, card);
  });
}

// Récupérer le prix
function fetchPrice(symbol, card) {
  const apiKey = 'RZ7U8BGO3JZI1BQV'; // Remplace par ta clé Alpha Vantage
  fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const price = data['Global Quote']?.['05. price'] || 'N/A';
      card.querySelector('.current-price').textContent = price;
      checkAlerts(symbol, price);
    })
    .catch(error => {
      console.error('Erreur:', error);
      card.querySelector('.current-price').textContent = 'Erreur';
    });
}

// Vérifier les alertes
function checkAlerts(symbol, currentPrice) {
  const stock = stocks.find(s => s.symbol === symbol);
  if (stock && currentPrice !== 'N/A') {
    const price = parseFloat(currentPrice);
    if (price <= stock.price1) alert(`${symbol} a atteint le seuil bas: ${price}`);
    if (price >= stock.price2) alert(`${symbol} a atteint le seuil haut: ${price}`);
  }
}

// Ajouter un stock
document.getElementById('stockForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const symbol = document.getElementById('symbol').value.toUpperCase();
  const price1 = parseFloat(document.getElementById('price1').value);
  const price2 = parseFloat(document.getElementById('price2').value);
  stocks.push({ symbol, price1, price2 });
  saveStocks();
  displayStocks();
  document.getElementById('stockForm').reset();
});

// Supprimer un stock
function deleteStock(index) {
  stocks.splice(index, 1);
  saveStocks();
  displayStocks();
}

// Modifier un stock
function toggleEdit(index) {
  const card = stockList.children[index];
  const editInputs = card.querySelector('.edit-inputs');
  const editBtn = card.querySelector('.edit-btn');
  const isEditing = editInputs.style.display === 'flex';

  if (isEditing) {
    const newPrice1 = parseFloat(card.querySelector('.edit-price1').value);
    const newPrice2 = parseFloat(card.querySelector('.edit-price2').value);
    stocks[index].price1 = newPrice1;
    stocks[index].price2 = newPrice2;
    saveStocks();
    displayStocks();
  } else {
    editInputs.style.display = 'flex';
    card.querySelector('.price1').style.display = 'none';
    card.querySelector('.price2').style.display = 'none';
    editBtn.textContent = 'Sauvegarder';
  }
}

// Mettre à jour les prix toutes les 60 secondes
setInterval(() => {
  stocks.forEach((stock, index) => {
    const card = stockList.children[index];
    if (card) fetchPrice(stock.symbol, card);
  });
}, 60000);

// Afficher au démarrage
displayStocks();

// Exposer les fonctions globalement pour les boutons
window.deleteStock = deleteStock;
window.toggleEdit = toggleEdit;
