# ShopTransitionManager

La classe `ShopTransitionManager` centralise la gestion des transitions et de l'introduction de la boutique pour tous les modes de jeu. Cela permet de simplifier la maintenance et d'assurer une logique cohérente entre les différents modes.

## Localisation
Le fichier source de cette classe se trouve dans :
```
utils/shopTransitionManager.js
```

## Fonctionnalités
### Méthodes principales

#### `handleTransition(sessionOrLobby)`
Gère les transitions et l'introduction de la boutique pour une session ou un lobby.

- **Paramètre** :
  - `sessionOrLobby` : Objet représentant une session (mode solo) ou un lobby (mode multijoueur).
- **Comportement** :
  - Si une transition est en cours (`inTransition`), elle vérifie si la durée de transition est écoulée, puis termine la transition et démarre l'introduction de la boutique.
  - Si l'introduction de la boutique est active (`shopIntroActive`), elle vérifie si la durée d'introduction est écoulée, puis termine l'introduction et active la boutique.

### Constructeur
```javascript
new ShopTransitionManager(transitionDuration, shopIntroDuration)
```
- **Paramètres** :
  - `transitionDuration` : Durée de la transition (en millisecondes).
  - `shopIntroDuration` : Durée de l'introduction de la boutique (en millisecondes).

## Exemple d'utilisation
### Dans le mode solo
```javascript
const ShopTransitionManager = require('../../utils/shopTransitionManager');

const shopTransitionManager = new ShopTransitionManager(session.transitionDuration, session.shopIntroDuration);
shopTransitionManager.handleTransition(session);
```

### Dans le mode multijoueur
```javascript
const ShopTransitionManager = require('../../utils/shopTransitionManager');

const shopTransitionManager = new ShopTransitionManager(lobby.transitionDuration, lobby.shopIntroDuration);
shopTransitionManager.handleTransition(lobby);
```

## Avantages
- **Réduction de la duplication** : La logique est centralisée, évitant la répétition dans chaque mode.
- **Facilité de maintenance** : Toute modification de la logique de transition ou d'introduction peut être effectuée dans un seul fichier.
- **Cohérence** : Assure un comportement uniforme entre les modes solo et multijoueur.

## Notes
- Assurez-vous que les objets `session` ou `lobby` disposent des méthodes suivantes :
  - `getTransitionElapsed()` : Retourne le temps écoulé depuis le début de la transition.
  - `endTransition()` : Termine la transition.
  - `showShopIntro()` : Démarre l'introduction de la boutique.
  - `getShopIntroElapsed()` : Retourne le temps écoulé depuis le début de l'introduction de la boutique.
  - `endShopIntro()` : Termine l'introduction de la boutique.
  - `activateShop()` : Active la boutique.

## Historique des modifications
- **23 décembre 2025** : Création initiale de la classe et documentation associée.