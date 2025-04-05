// Charger les stocks sauvegardés depuis LocalStorage
let stocks = JSON.parse(localStorage.getItem('stocks')) || [];
const stockList = document.getElementById('stockList');

// Afficher les stocks au chargement
function displayStocks() {
  stockList.innerHTML = '';
  stocks.forEach(stock => {
    const li = document.createElement('li');
    li.textContent = `${stock.symbol} - Prix actuel: Chargement... (Alerte basse: ${stock.price1}, Alerte haute: ${stock.price2})`;
    stockList.appendChild(li);
    fetchPrice(stock.symbol, li);
  });
}

// Récupérer le prix via Alpha Vantage
function fetchPrice(symbol, liElement) {
  const apiKey = 'RZ7U8BGO3JZI1BQV'; // Remplace par ta clé Alpha Vantage
  fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const price = data['Global Quote']?.['05. price'] || 'N/A';
      liElement.textContent = `${symbol} - Prix actuel: ${price} (Alerte basse: ${stocks.find(s => s.symbol === symbol).price1}, Alerte haute: ${stocks.find(s => s.symbol === symbol).price2})`;
      checkAlerts(symbol, price);
    })
    .catch(error => {
      console.error('Erreur:', error);
      liElement.textContent += ' - Erreur de chargement';
    });
}

// Vérifier les alertes
function checkAlerts(symbol, currentPrice) {
  const stock = stocks.find(s => s.symbol === symbol);
  if (stock && currentPrice !== 'N/A') {
    const price = parseFloat(currentPrice);
    if (price <= stock.price1) alert(`${symbol} a atteint le prix bas: ${price}`);
    if (price >= stock.price2) alert(`${symbol} a atteint le prix haut: ${price}`);
  }
}

// Ajouter un nouveau stock
document.getElementById('stockForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const symbol = document.getElementById('symbol').value.toUpperCase();
  const price1 = parseFloat(document.getElementById('price1').value);
  const price2 = parseFloat(document.getElementById('price2').value);

  const newStock = { symbol, price1, price2 };
  stocks.push(newStock);
  localStorage.setItem('stocks', JSON.stringify(stocks));

  const li = document.createElement('li');
  li.textContent = `${symbol} - Prix actuel: Chargement... (Alerte basse: ${price1}, Alerte haute: ${price2})`;
  stockList.appendChild(li);
  fetchPrice(symbol, li);

  document.getElementById('stockForm').reset();
});

// Mettre à jour les prix toutes les 60 secondes
setInterval(() => {
  stocks.forEach(stock => {
    const li = Array.from(stockList.children).find(item => item.textContent.includes(stock.symbol));
    if (li) fetchPrice(stock.symbol, li);
  });
}, 60000);

// Afficher les stocks au démarrage
displayStocks();
