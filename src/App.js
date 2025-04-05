// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [stocks, setStocks] = useState(() => {
    // Charger les données sauvegardées depuis LocalStorage
    const saved = localStorage.getItem('stocks');
    return saved ? JSON.parse(saved) : [];
  });
  const [symbol, setSymbol] = useState('');
  const [price1, setPrice1] = useState('');
  const [price2, setPrice2] = useState('');
  const [currentPrices, setCurrentPrices] = useState({});

  // Sauvegarder les stocks dans LocalStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('stocks', JSON.stringify(stocks));
  }, [stocks]);

  // Récupérer les prix en temps réel (simulé ici)
  const fetchPrice = async (symbol) => {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=YOUR_API_KEY`
      );
      const price = response.data['Global Quote']['05. price'];
      setCurrentPrices((prev) => ({ ...prev, [symbol]: price }));
      checkAlerts(symbol, price);
    } catch (error) {
      console.error('Erreur lors de la récupération du prix', error);
    }
  };

  // Vérifier les alertes
  const checkAlerts = (symbol, currentPrice) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    if (stock) {
      if (currentPrice <= stock.price1) alert(`${symbol} a atteint le prix bas : ${currentPrice}`);
      if (currentPrice >= stock.price2) alert(`${symbol} a atteint le prix haut : ${currentPrice}`);
    }
  };

  // Ajouter un stock
  const addStock = (e) => {
    e.preventDefault();
    if (symbol && price1 && price2) {
      const newStock = { symbol: symbol.toUpperCase(), price1: parseFloat(price1), price2: parseFloat(price2) };
      setStocks([...stocks, newStock]);
      fetchPrice(newStock.symbol);
      setSymbol('');
      setPrice1('');
      setPrice2('');
    }
  };

  // Mettre à jour les prix toutes les 60 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      stocks.forEach((stock) => fetchPrice(stock.symbol));
    }, 60000);
    return () => clearInterval(interval);
  }, [stocks]);

  return (
    <div className="App">
      <h1>Dashboard de Trading</h1>
      <form onSubmit={addStock}>
        <input
          type="text"
          placeholder="Symbole (ex: AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <input
          type="number"
          placeholder="Prix 1 (alerte basse)"
          value={price1}
          onChange={(e) => setPrice1(e.target.value)}
        />
        <input
          type="number"
          placeholder="Prix 2 (alerte haute)"
          value={price2}
          onChange={(e) => setPrice2(e.target.value)}
        />
        <button type="submit">Ajouter</button>
      </form>

      <h2>Mes alertes</h2>
      <ul>
        {stocks.map((stock, index) => (
          <li key={index}>
            {stock.symbol} - Prix actuel : {currentPrices[stock.symbol] || 'Chargement...'} 
            (Alerte basse: {stock.price1}, Alerte haute: {stock.price2})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
