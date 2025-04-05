// Fonctions utilitaires pour le dashboard

// Formater un nombre avec 2 décimales
function formatPrice(price) {
    if (price === undefined || price === null || isNaN(price)) {
        return '-';
    }
    return parseFloat(price).toFixed(2);
}

// Formater une date en format lisible
function formatDate(date) {
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    };
    return new Date(date).toLocaleString('fr-FR', options);
}

// Vérifier si un "COMBO" est présent
function hasCombo(currentPrice, ma20, ma50, bollingerLower) {
    if (!currentPrice || !ma20 || !ma50 || !bollingerLower) {
        return false;
    }
    
    // Condition 1: Prix actuel < MA20
    const condition1 = currentPrice < ma20;
    
    // Condition 2: Prix actuel > MA50
    const condition2 = currentPrice > ma50;
    
    // Condition 3: Bollinger Lower est entre 0% et 5% sous le prix actuel
    const lowerDiff = (currentPrice - bollingerLower) / currentPrice * 100;
    const condition3 = lowerDiff >= 0 && lowerDiff <= 5;
    
    return condition1 && condition2 && condition3;
}

// Vérifier si un prix cible est atteint
function isPriceAlertTriggered(currentPrice, price1, price2) {
    if (!currentPrice) return false;
    
    // Convertir en nombres
    currentPrice = parseFloat(currentPrice);
    price1 = parseFloat(price1);
    price2 = parseFloat(price2);
    
    // Vérifier si le prix actuel est proche d'un des prix cibles (±0.5%)
    const threshold = 0.005; // 0.5%
    
    const nearPrice1 = Math.abs((currentPrice - price1) / price1) <= threshold;
    const nearPrice2 = Math.abs((currentPrice - price2) / price2) <= threshold;
    
    return nearPrice1 || nearPrice2;
}

// Générer un ID unique
function generateID() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Afficher une notification
function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    notificationMessage.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Jouer un son pour les alertes
function playAlertSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLHPO7tawZxkHOoPZ+desVQ8OSqDk/dB+Ow4fb8r7x5dqHw+Cy/vNlWcZBnTRB+KWUhIMYcD0/L1+NwJ7HhMxW5PHzMF6WBEYMm6wzuDo2KJiEA4pe9L/8s6HVyUwpOL//eiwgXBfTluU1PTmxpxhWVdnm9f388uPZFZbc7Xo/fw=');
    audio.play();
}
