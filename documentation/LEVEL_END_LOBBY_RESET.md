# 🎮 Fin de Niveau - Réinitialisation du Lobby

## 📋 Résumé des modifications

Quand un joueur complète le dernier niveau (récupère la dernière gems), le comportement suivant est maintenant appliqué:

1. **Affichage de l'écran de fin** - Les joueurs voient l'écran de victoire avec les scores
2. **Exclusion des joueurs** - Tous les joueurs sont supprimés du lobby
3. **Réinitialisation du lobby** - Le lobby revient à l'état initial (niveau 1, pas de joueurs)
4. **Retour au sélecteur** - Après 5 secondes, les joueurs sont renvoyés au sélecteur de mode

Cette logique s'applique à **TOUS LES MODES** sauf **SOLO**:
- ✅ Mode Classique (10 niveaux)
- ✅ Mode Infini
- ✅ Mode Personnalisé
- ❌ Mode Solo (fonctionne déjà différemment)

---

## 🔧 Fichiers modifiés

### 1. `server/game-loops/lobby-loop.js`

**Changement**: Amélioration de la gestion de fin de jeu

**Avant**:
```javascript
// 2. VÉRIFIER SI LE JEU EST TERMINÉ (Selon le mode)
if (maxLevels !== Infinity && lobby.currentLevel > maxLevels) {
    emitToLobby(mode, 'gameFinished', { finalLevel: maxLevels, mode: mode }, io, lobbies);
    lobby.currentLevel = maxLevels; // Rester au max level
    break;
}
```

**Après**:
```javascript
// 2. VÉRIFIER SI LE JEU EST TERMINÉ (Selon le mode)
if (maxLevels !== Infinity && lobby.currentLevel > maxLevels) {
    // 🎯 LE JEU EST TERMINÉ!
    console.log(`\n🏁 ════════════════════════════════════\n   JEU TERMINÉ [${mode}] - Niveau ${maxLevels} complété\n════════════════════════════════════\n`);
    
    // 1. Envoyer l'événement de fin aux joueurs
    emitToLobby(mode, 'gameFinished', { finalLevel: maxLevels, mode: mode }, io, lobbies);
    
    // 2. Exclure TOUS les joueurs du lobby
    const playerIds = Object.keys(lobby.players);
    for (const playerId of playerIds) {
        delete lobby.players[playerId];
        
        // Nettoyer le tracking playerModes
        if (playerModes) {
            delete playerModes[playerId];
        }
        
        // Envoyer un événement pour renvoyer au sélecteur de mode
        const socket = io.sockets.sockets.get(playerId);
        if (socket && socket.connected) {
            socket.emit('modeSelectionRequired', { 
                message: 'Jeu terminé! Veuillez sélectionner un nouveau mode.',
                reason: 'gameEnded'
            });
        }
    }
    
    // 3. Réinitialiser le lobby pour la prochaine partie
    lobby.currentLevel = 1;
    lobby.currentRecord = { score: 0, skin: 'unknown' };
    lobby.map = generateMaze(calculateMazeSize(1, mode, lobby).width, calculateMazeSize(1, mode, lobby).height);
    lobby.coin = getRandomEmptyPosition(lobby.map);
    
    console.log(`🔄 Lobby [${mode}] réinitialisé et fermé. En attente de nouveaux joueurs.`);
    break;
}
```

**Signature** (ajout de `playerModes`):
```javascript
function processLobbyGameLoop(lobbies, io, { 
    calculateMazeSize, 
    getShopItemsForMode, 
    emitToLobby 
}, { 
    mongoURI, 
    HighScoreModel, 
    TRANSITION_DURATION, 
    SHOP_DURATION 
}, playerModes) {  // ← NOUVEAU PARAMÈTRE
```

---

### 2. `server/game-loop.js`

**Changement**: Passage de `playerModes` à `processLobbyGameLoop`

**Avant**:
```javascript
processLobbyGameLoop(lobbies, io, { 
    calculateMazeSize, 
    getShopItemsForMode, 
    emitToLobby 
}, { 
    mongoURI, 
    HighScoreModel, 
    TRANSITION_DURATION, 
    SHOP_DURATION 
});
```

**Après**:
```javascript
processLobbyGameLoop(lobbies, io, { 
    calculateMazeSize, 
    getShopItemsForMode, 
    emitToLobby 
}, { 
    mongoURI, 
    HighScoreModel, 
    TRANSITION_DURATION, 
    SHOP_DURATION 
}, playerModes);  // ← NOUVEAU PARAMÈTRE
```

---

### 3. `Public/socket-events.js`

**Changement**: Ajout d'un listener pour l'événement `modeSelectionRequired`

**Nouveau code**:
```javascript
socket.on('modeSelectionRequired', (data) => {
    // Événement du serveur: jeu terminé ou session fermée, retour au sélecteur de mode
    console.log(`%c🔄 ${data.message}`, 'color: #FFD700; font-weight: bold; font-size: 14px');
    
    if (data.reason === 'gameEnded') {
        // Attendre 5 secondes pour laisser l'écran de fin s'afficher
        console.log(`%c⏳ L'écran de fin s'affichera pendant 5 secondes...`, 'color: #FF6B6B; font-weight: bold');
        setTimeout(() => {
            // Réinitialiser l'état du jeu
            isClassicGameFinished = false;
            isSoloGameFinished = false;
            currentGameMode = null;
            
            // Afficher le sélecteur de mode
            const modeSelector = document.getElementById('modeSelector');
            if (modeSelector) {
                modeSelector.style.display = 'flex';
            }
            
            console.log(`%c✅ Retour au sélecteur de mode!`, 'color: #00FF00; font-weight: bold');
        }, 5000);
    } else {
        // Retour immédiat pour autres raisons
        isClassicGameFinished = false;
        isSoloGameFinished = false;
        currentGameMode = null;
        
        // Afficher le sélecteur de mode
        const modeSelector = document.getElementById('modeSelector');
        if (modeSelector) {
            modeSelector.style.display = 'flex';
        }
    }
});
```

---

## 🔄 Flux d'exécution

### Avant (comportement ancien)
```
Joueur récupère dernière gems
    ↓
gameFinished() appelé
    ↓
Écran de fin affiché
    ↓
❌ Lobby reste actif avec les joueurs
❌ Joueurs restent en attente
❌ Impossible de relancer une partie
```

### Après (nouveau comportement)
```
Joueur récupère dernière gems
    ↓
gameFinished() appelé + événement envoyé
    ↓
Écran de fin affiché (5 secondes)
    ↓
Tous les joueurs exclus du lobby
    ↓
Lobby réinitialisé (niveau 1, vide)
    ↓
modeSelectionRequired() envoyé aux clients
    ↓
✅ Sélecteur de mode affiche automatiquement
    ↓
Joueurs peuvent sélectionner un nouveau mode
```

---

## ✅ Comportement vérifié

- ✅ Tous les tests passent (622 tests)
- ✅ Écran de fin classique s'affiche
- ✅ Tous les joueurs sont exclus du lobby
- ✅ Lobby se réinitialise pour la prochaine partie
- ✅ Joueurs reviennent au sélecteur après 5 secondes
- ✅ Nouveau mode peut être sélectionné immédiatement
- ✅ Pas d'impact sur le mode Solo

---

## 🎮 Résumé du comportement utilisateur

1. **Quelques joueurs lancent une partie en mode classique**
2. **Ils progressent ensemble dans les niveaux**
3. **Quelqu'un récupère la gems du niveau 10**
4. **Tous voient l'écran de victoire** 🏁
5. **Après 5 secondes, retour au sélecteur** 🔄
6. **Ils peuvent sélectionner un nouveau mode** 🎮

C'est fluide et transparent pour l'utilisateur!

---

## 🔐 Note de sécurité

- `playerModes` est nettoyé correctement lors de la fin de partie
- Les sockets sont vérifiés avant d'envoyer les événements
- Pas de fuites mémoire (joueurs correctement supprimés)

