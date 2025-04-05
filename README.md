# Trading Dashboard

Un tableau de bord de suivi des actions de trading avec indicateurs techniques et alertes.

## Caractéristiques

- Ajout, modification et suppression de tickers
- Prix cibles personnalisés pour chaque ticker
- Affichage des indicateurs techniques (MA20, MA50, Bandes de Bollinger)
- Alertes "COMBO" basées sur des critères techniques
- Alertes sur prix cibles
- Rafraîchissement automatique des données toutes les heures
- Sauvegarde persistante dans le localStorage

## Technologies utilisées

- HTML5, CSS3, JavaScript (vanilla)
- API AlphaVantage pour les données financières
- LocalStorage pour la persistance des données
- Hébergé sur GitHub et déployé sur Netlify

## Comment utiliser

1. Clonez ce dépôt
2. Ouvrez `index.html` dans votre navigateur web
3. Ajoutez vos tickers préférés avec leurs prix cibles
4. Le tableau se met à jour automatiquement toutes les heures

## Critères d'alerte "COMBO"

Un "COMBO" est détecté lorsque les trois conditions suivantes sont remplies pour un ticker :
- Prix actuel < MA20
- Prix actuel > MA50
- Bande de Bollinger basse (20) est entre 0% et 5% sous le prix actuel

## Déploiement

Ce projet est conçu pour être facilement déployé sur Netlify :

1. Créez un compte sur [Netlify](https://www.netlify.com/) si vous n'en avez pas déjà un
2. Connectez votre compte GitHub
3. Sélectionnez le dépôt de ce projet
4. Suivez les instructions de déploiement de Netlify

## Limites de l'API

L'API AlphaVantage a une limite de 5 appels par minute avec la clé gratuite. L'application gère cette limitation en mettant en file d'attente les requêtes et en les traitant séquentiellement.

## Améliorations possibles

- Ajouter d'autres indicateurs techniques
- Permettre des alertes personnalisées
- Intégrer des graphiques
- Ajouter des thèmes visuels (clair/sombre)
- Notifications Push

## License

MIT License
