// Charger les stocks depuis LocalStorage
let stocks = JSON.parse(localStorage.getItem('stocks')) || [];
const stockList = document.getElementById('stockList');
const apiKey = 'RZ7U8BGO3JZI1BQV';

function saveStocks() {
  localStorage.setItem('stocks', JSON.stringify(stocks));
}

// Afficher les stocks
function displayStocks() {
  stockList.innerHTML = '';
  stocks.forEach((stock, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="stock-name">Chargement...</td>
      <td>${stock.symbol}</td>
      <td><span class="current-price">Chargement...</span></td>
      <td><span class="price1">${stock.price1}</span><div class="edit-inputs" style="display: none;"><input type="number" class="edit-price1" value="${stock.price1}" step="0.01"></div></td>
      <td><span class="price2">${stock.price2}</span><div class="edit-inputs" style="display: none;"><input type="number" class="edit-price2" value="${stock.price2}" step="0.01"></div></td>
      <td class="combo-status">Chargement...</td>
      <td>
        <button class="edit-btn" onclick="toggleEdit(${index})">Modifier</button>
        <button class="delete-btn" onclick="deleteStock(${index})">Supprimer</button>
      </td>
    `;
    stockList.appendChild(row);
    fetchData(stock.symbol, row);
  });
}

// Récupérer prix et données techniques
function fetchData(symbol, row) {
  // Nom de l'action
  fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const name = data.bestMatches?.[0]?.['2. name'] || 'Inconnu';
      row.querySelector('.stock-name').textContent = name;
    });

  // Prix actuel
  fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const price = data['Global Quote']?.['05. price'] || 'N/A';
      row.querySelector('.current-price').textContent = price;
      checkAlerts(symbol, price);
    });

  // Données weekly pour Combo
  fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const weekly = Object.entries(data['Weekly Time Series'])[0][1];
      const price = parseFloat(weekly['4. close']);
      checkCombo(symbol, price, row);
    })
    .catch(error => {
      console.error('Erreur:', error);
      row.querySelector('.combo-status').textContent = 'Erreur';
    });

  // Bollinger Bands (weekly)
  fetch(`https://www.alphavantage.co/query?function=BBANDS&symbol=${symbol}&interval=weekly&time_period=20&series_type=close&nbdevup=2&nbdevdn=2&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const latest = Object.entries(data['Technical Analysis: BBANDS'])[0][1];
      const lowerBand = parseFloat(latest['Lower Band']);
      checkCombo(symbol, null, row, lowerBand);
    });
}

// Vérifier le Combo
function checkCombo(symbol, price, row, lowerBand) {
  const stock = stocks.find(s => s.symbol === symbol);
  fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=weekly&time_period=20&series_type=close&apikey=${apiKey}`)
    .then(response => response.json())
    .then(ma20Data => {
      const ma20 = parseFloat(Object.entries(ma20Data['Technical Analysis: SMA'])[0][1]['SMA']);
      fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=weekly&time_period=50&series_type=close&apikey=${apiKey}`)
        .then(response => response.json())
        .then(ma50Data => {
          const ma50 = parseFloat(Object.entries(ma50Data['Technical Analysis: SMA'])[0][1]['SMA']);
          const currentPrice = price || parseFloat(row.querySelector('.current-price').textContent);
          const isCombo = currentPrice < ma20 && currentPrice > ma50 && lowerBand >= currentPrice * 0.95 && lowerBand <= currentPrice * 1.05;
          row.querySelector('.combo-status').textContent = isCombo ? 'Oui' : 'Non';
          row.querySelector('.combo-status').className = `combo-status ${isCombo ? 'combo-yes' : 'combo-no'}`;
        });
    });
}

// Vérifier les alertes (±2%)
function checkAlerts(symbol, currentPrice) {
  const stock = stocks.find(s => s.symbol === symbol);
  if (stock && currentPrice !== 'N/A') {
    const price = parseFloat(currentPrice);
    const lowThreshold = stock.price1 * 0.98;
    const highThreshold = stock.price2 * 1.02;
    if (price <= stock.price1 * 1.02 && price >= lowThreshold) {
      showAlert(`${symbol} est proche du seuil bas (${stock.price1}): ${price}`);
    } else if (price >= stock.price2 * 0.98 && price <= highThreshold) {
      showAlert(`${symbol} est proche du seuil haut (${stock.price2}): ${price}`);
    }
  }
}

// Afficher une alerte avec son
function showAlert(message) {
  const alertBox = document.createElement('div');
  alertBox.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #e53e3e; color: white; padding: 10px; border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000;
  `;
  alertBox.textContent = message;
  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
  const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
  audio.play().catch(err => console.log('Erreur son:', err));
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
  const row = stockList.children[index];
  const editInputs = row.querySelectorAll('.edit-inputs');
  const editBtn = row.querySelector('.edit-btn');
  const isEditing = editInputs[0].style.display === 'flex';

  if (isEditing) {
    const newPrice1 = parseFloat(row.querySelector('.edit-price1').value);
    const newPrice2 = parseFloat(row.querySelector('.edit-price2').value);
    stocks[index].price1 = newPrice1;
    stocks[index].price2 = newPrice2;
    saveStocks();
    displayStocks();
  } else {
    editInputs.forEach(input => input.style.display = 'flex');
    row.querySelector('.price1').style.display = 'none';
    row.querySelector('.price2').style.display = 'none';
    editBtn.textContent = 'Sauvegarder';
  }
}

// Mettre à jour les données toutes les 60 secondes
setInterval(() => {
  stocks.forEach((stock, index) => {
    const row = stockList.children[index];
    if (row) fetchData(stock.symbol, row);
  });
}, 60000);

// Afficher au démarrage
displayStocks();

window.deleteStock = deleteStock;
window.toggleEdit = toggleEdit;
