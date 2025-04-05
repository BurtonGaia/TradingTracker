// Charger les stocks depuis LocalStorage
let stocks = JSON.parse(localStorage.getItem('stocks')) || [];
const stockList = document.getElementById('stockList');
const apiKey = 'RZ7U8BGO3JZI1BQV';

// File d'attente pour limiter les appels API
let apiQueue = [];
let isProcessing = false;

function saveStocks() {
  localStorage.setItem('stocks', JSON.stringify(stocks));
}

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
    queueApiCall(() => fetchData(stock.symbol, row));
  });
}

// Gestion de la file d'attente API
function queueApiCall(call) {
  apiQueue.push(call);
  if (!isProcessing) processQueue();
}

async function processQueue() {
  if (apiQueue.length === 0) {
    isProcessing = false;
    return;
  }
  isProcessing = true;
  const call = apiQueue.shift();
  await call();
  setTimeout(processQueue, 15000); // 15s entre appels pour respecter la limite
}

// Récupérer les données
async function fetchData(symbol, row) {
  try {
    // Nom
    const nameRes = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${apiKey}`);
    const nameData = await nameRes.json();
    row.querySelector('.stock-name').textContent = nameData.bestMatches?.[0]?.['2. name'] || 'Inconnu';

    // Prix
    const priceRes = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`);
    const priceData = await priceRes.json();
    const price = priceData['Global Quote']?.['05. price'] || 'N/A';
    row.querySelector('.current-price').textContent = price;
    checkAlerts(symbol, price);

    // Combo (Weekly)
    const weeklyRes = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${apiKey}`);
    const weeklyData = await weeklyRes.json();
    const weeklyPrice = parseFloat(Object.entries(weeklyData['Weekly Time Series'])[0][1]['4. close']);

    const ma20Res = await fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=weekly&time_period=20&series_type=close&apikey=${apiKey}`);
    const ma20Data = await ma20Res.json();
    const ma20 = parseFloat(Object.entries(ma20Data['Technical Analysis: SMA'])[0][1]['SMA']);

    const ma50Res = await fetch(`https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=weekly&time_period=50&series_type=close&apikey=${apiKey}`);
    const ma50Data = await ma50Res.json();
    const ma50 = parseFloat(Object.entries(ma50Data['Technical Analysis: SMA'])[0][1]['SMA']);

    const bbRes = await fetch(`https://www.alphavantage.co/query?function=BBANDS&symbol=${symbol}&interval=weekly&time_period=20&series_type=close&nbdevup=2&nbdevdn=2&apikey=${apiKey}`);
    const bbData = await bbRes.json();
    const lowerBand = parseFloat(Object.entries(bbData['Technical Analysis: BBANDS'])[0][1]['Lower Band']);

    const isCombo = weeklyPrice < ma20 && weeklyPrice > ma50 && lowerBand >= weeklyPrice * 0.95 && lowerBand <= weeklyPrice * 1.05;
    row.querySelector('.combo-status').textContent = isCombo ? 'Oui' : 'Non';
    row.querySelector('.combo-status').className = `combo-status ${isCombo ? 'combo-yes' : 'combo-no'}`;
  } catch (error) {
    console.error('Erreur:', error);
    row.querySelector('.stock-name').textContent = 'Erreur';
    row.querySelector('.current-price').textContent = 'N/A';
    row.querySelector('.combo-status').textContent = 'Erreur';
  }
}

// Vérifier les alertes (±2%)
function checkAlerts(symbol, currentPrice) {
  const stock = stocks.find(s => s.symbol === symbol);
  if (stock && currentPrice !== 'N/A') {
    const price = parseFloat(currentPrice);
    const lowThreshold = stock.price1 * 0.98;
    const highThreshold = stock.price2 * 1.02;
    if (price <= stock.price1 * 1.02 && price >= lowThreshold) {
      showAlert(`${symbol} proche du seuil bas (${stock.price1}): ${price}`);
    } else if (price >= stock.price2 * 0.98 && price <= highThreshold) {
      showAlert(`${symbol} proche du seuil haut (${stock.price2}): ${price}`);
    }
  }
}

// Afficher une alerte
function showAlert(message) {
  const alertBox = document.createElement('div');
  alertBox.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #ff3e3e; color: #fff; padding: 10px 20px; border-radius: 4px;
    box-shadow: 0 0 15px rgba(255, 62, 62, 0.7); z-index: 1000;
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

// Mettre à jour toutes les 60 secondes
setInterval(() => {
  stocks.forEach((stock, index) => {
    const row = stockList.children[index];
    if (row) queueApiCall(() => fetchData(stock.symbol, row));
  });
}, 60000);

// Afficher au démarrage
displayStocks();

window.deleteStock = deleteStock;
window.toggleEdit = toggleEdit;
