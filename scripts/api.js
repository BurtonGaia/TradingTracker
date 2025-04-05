// API Key pour AlphaVantage
const API_KEY = 'RZ7U8BGO3JZI1BQV';

// Classe pour gérer les appels API
class APIService {
    constructor() {
        this.baseURL = 'https://www.alphavantage.co/query';
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimitDelay = 12000; // Délai de 12 secondes entre les requêtes (5 appels/minute)
    }

    // Ajouter une requête à la file d'attente
    enqueueRequest(request) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                request,
                resolve,
                reject
            });
            
            if (!this.isProcessing) {
                this.processQueue();
            }
        });
    }

    // Traiter la file d'attente des requêtes
    async processQueue() {
        if (this.requestQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const { request, resolve, reject } = this.requestQueue.shift();

        try {
            const response = await fetch(request);
            
            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Vérifier si l'API a retourné une erreur
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            
            if (data['Note']) {
                console.warn('API Rate Limit Note:', data['Note']);
            }
            
            resolve(data);
        } catch (error) {
            reject(error);
        }

        // Attendre avant de traiter la prochaine requête
        setTimeout(() => this.processQueue(), this.rateLimitDelay);
    }

    // Obtenir le prix actuel d'un ticker
    async getCurrentPrice(symbol) {
        const url = `${this.baseURL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        
        try {
            const data = await this.enqueueRequest(url);
            
            if (data['Global Quote'] && data['Global Quote']['05. price']) {
                return parseFloat(data['Global Quote']['05. price']);
            } else {
                throw new Error('Données de prix non trouvées');
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération du prix pour ${symbol}:`, error);
            throw error;
        }
    }

    // Obtenir la MA20 d'un ticker
    async getMA20(symbol) {
        const url = `${this.baseURL}?function=SMA&symbol=${symbol}&interval=daily&time_period=20&series_type=close&apikey=${API_KEY}`;
        
        try {
            const data = await this.enqueueRequest(url);
            
            if (data['Technical Analysis: SMA']) {
                const dates = Object.keys(data['Technical Analysis: SMA']).sort((a, b) => new Date(b) - new Date(a));
                
                if (dates.length > 0) {
                    return parseFloat(data['Technical Analysis: SMA'][dates[0]]['SMA']);
                }
            }
            throw new Error('Données MA20 non trouvées');
        } catch (error) {
            console.error(`Erreur lors de la récupération de MA20 pour ${symbol}:`, error);
            throw error;
        }
    }

    // Obtenir la MA50 d'un ticker
    async getMA50(symbol) {
        const url = `${this.baseURL}?function=SMA&symbol=${symbol}&interval=daily&time_period=50&series_type=close&apikey=${API_KEY}`;
        
        try {
            const data = await this.enqueueRequest(url);
            
            if (data['Technical Analysis: SMA']) {
                const dates = Object.keys(data['Technical Analysis: SMA']).sort((a, b) => new Date(b) - new Date(a));
                
                if (dates.length > 0) {
                    return parseFloat(data['Technical Analysis: SMA'][dates[0]]['SMA']);
                }
            }
            throw new Error('Données MA50 non trouvées');
        } catch (error) {
            console.error(`Erreur lors de la récupération de MA50 pour ${symbol}:`, error);
            throw error;
        }
    }

    // Obtenir la bande de Bollinger basse
    async getBollingerLower(symbol) {
        const url = `${this.baseURL}?function=BBANDS&symbol=${symbol}&interval=daily&time_period=20&series_type=close&nbdevdn=2&nbdevup=2&apikey=${API_KEY}`;
        
        try {
            const data = await this.enqueueRequest(url);
            
            if (data['Technical Analysis: BBANDS']) {
                const dates = Object.keys(data['Technical Analysis: BBANDS']).sort((a, b) => new Date(b) - new Date(a));
                
                if (dates.length > 0) {
                    return parseFloat(data['Technical Analysis: BBANDS'][dates[0]]['Real Lower Band']);
                }
            }
            throw new Error('Données Bollinger non trouvées');
        } catch (error) {
            console.error(`Erreur lors de la récupération des bandes de Bollinger pour ${symbol}:`, error);
            throw error;
        }
    }

    // Obtenir toutes les données d'un ticker
    async getTickerData(symbol) {
        try {
            const currentPrice = await this.getCurrentPrice(symbol);
            const ma20 = await this.getMA20(symbol);
            const ma50 = await this.getMA50(symbol);
            const bollingerLower = await this.getBollingerLower(symbol);
            
            return {
                currentPrice,
                ma20,
                ma50,
                bollingerLower
            };
        } catch (error) {
            console.error(`Erreur lors de la récupération des données pour ${symbol}:`, error);
            throw error;
        }
    }
}

// Exporter une instance de APIService
const apiService = new APIService();
