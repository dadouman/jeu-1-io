// Gestion centralisée des transitions et de l'introduction de la boutique

class ShopTransitionManager {
    constructor(transitionDuration, shopIntroDuration) {
        this.transitionDuration = transitionDuration;
        this.shopIntroDuration = shopIntroDuration;
    }

    handleTransition(sessionOrLobby) {
        if (sessionOrLobby.inTransition) {
            if (sessionOrLobby.getTransitionElapsed() >= this.transitionDuration) {
                sessionOrLobby.endTransition();
                console.log(`✅ Transition terminée pour ${sessionOrLobby.id || sessionOrLobby.playerId}`);

                // Afficher l'introduction de la boutique
                sessionOrLobby.showShopIntro();
            }
        } else if (sessionOrLobby.shopIntroActive) {
            if (sessionOrLobby.getShopIntroElapsed() >= this.shopIntroDuration) {
                sessionOrLobby.endShopIntro();
                console.log(`✅ Introduction de la boutique terminée pour ${sessionOrLobby.id || sessionOrLobby.playerId}`);

                // Activer la boutique
                sessionOrLobby.activateShop();
            }
        }
    }
}

module.exports = ShopTransitionManager;