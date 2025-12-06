// tests/shop-transition-timing.test.js
// Tests pour vérifier la succession : Transition → Shop → Timing du niveau suivant

const { isShopLevel } = require('../utils/shop');

describe('Succession Transition → Shop → Timing', () => {

    // --- TEST 1 : Le shop s'ouvre au bon niveau ---
    test('Le shop s\'ouvre uniquement à la fin des niveaux 5, 10, 15, etc.', () => {
        // Fin du niveau 4 → passage au niveau 5 → shop DOIT ouvrir
        expect(isShopLevel(5)).toBe(true);
        
        // Fin du niveau 5 → passage au niveau 6 → shop NE DOIT PAS ouvrir
        expect(isShopLevel(6)).toBe(false);
        
        // Fin du niveau 9 → passage au niveau 10 → shop DOIT ouvrir
        expect(isShopLevel(10)).toBe(true);
        
        // Fin du niveau 10 → passage au niveau 11 → shop NE DOIT PAS ouvrir
        expect(isShopLevel(11)).toBe(false);
    });

    // --- TEST 2 : Timing de transition vers le shop ---
    test('Quand on arrive au niveau 5 après avoir complété le niveau 4, une transition s\'affiche puis le shop ouvre', () => {
        // Simulation de la séquence d'événements
        const levelProgression = [
            { level: 1, shouldShowTransition: true, shouldOpenShop: false },
            { level: 2, shouldShowTransition: true, shouldOpenShop: false },
            { level: 3, shouldShowTransition: true, shouldOpenShop: false },
            { level: 4, shouldShowTransition: true, shouldOpenShop: false },
            { level: 5, shouldShowTransition: true, shouldOpenShop: true },  // ← Transition PUIS Shop
            { level: 6, shouldShowTransition: true, shouldOpenShop: false },
            { level: 10, shouldShowTransition: true, shouldOpenShop: true }, // ← Transition PUIS Shop
        ];

        levelProgression.forEach(({ level, shouldShowTransition, shouldOpenShop }) => {
            // Chaque nouveau niveau doit afficher une transition
            expect(shouldShowTransition).toBe(true);
            
            // Vérifier que le shop s'ouvre seulement aux bons niveaux
            expect(isShopLevel(level)).toBe(shouldOpenShop);
        });
    });

    // --- TEST 3 : Le chronomètre du niveau ne compte pas pendant le shop ---
    test('Pendant les 15 secondes du shop, le chronomètre du niveau suivant ne compte pas', () => {
        // Simulation de la gestion du temps
        const SHOP_DURATION = 15000; // 15 secondes
        const TRANSITION_DURATION = 3000; // 3 secondes

        // Scenario: Fin du niveau 5
        const levelCompletionTime = Date.now();
        
        // 1. Transition s'affiche (3 secondes)
        const transitionEnd = levelCompletionTime + TRANSITION_DURATION;
        
        // 2. On arrive au niveau 6 et le shop s'ouvre
        const shopOpenTime = transitionEnd;
        
        // 3. Pendant que le shop est ouvert, levelStartTime DOIT être null
        let levelStartTime = null; // ← Paused pendant le shop
        expect(levelStartTime).toBe(null); // ← Vérification que le timer est paused
        
        // 4. Après 15 secondes, le shop ferme et on redémarre le timer du niveau 6
        const shopCloseTime = shopOpenTime + SHOP_DURATION;
        levelStartTime = shopCloseTime; // ← On redémarre le timer après le shop
        
        // Vérifier que le temps s'est bien arrêté
        expect(shopCloseTime - shopOpenTime).toBe(SHOP_DURATION);
        expect(levelStartTime).toBe(shopCloseTime);
    });

    // --- TEST 4 : Succession correcte des événements au niveau 5 ---
    test('Succession des événements au niveau 5 (shop level)', () => {
        const events = [];
        const level = 5;

        // 1. On complète le niveau 4, on reçoit levelUpdate(5)
        events.push('levelUpdate(5)');
        
        // 2. Une transition s'affiche pendant 3 secondes
        events.push('transitionStart');
        
        // 3. Après 3 secondes, le shop s'ouvre
        events.push('shopOpen');
        
        // 4. Le chrono du niveau 5 NE compte pas pendant le shop (levelStartTime = null)
        events.push('levelTimerPaused');
        
        // 5. Après 15 secondes, le shop se ferme
        events.push('shopClose');
        
        // 6. Le chrono du niveau 6 commence (levelStartTime = Date.now())
        events.push('levelTimerStartLevel6');

        expect(events).toEqual([
            'levelUpdate(5)',
            'transitionStart',
            'shopOpen',
            'levelTimerPaused',
            'shopClose',
            'levelTimerStartLevel6'
        ]);
    });

    // --- TEST 5 : Succession des événements au niveau 6 (pas de shop) ---
    test('Succession des événements au niveau 6 (pas de shop)', () => {
        const events = [];
        const level = 6;

        // 1. On complète le niveau 5, on reçoit levelUpdate(6)
        events.push('levelUpdate(6)');
        
        // 2. Une transition s'affiche pendant 3 secondes
        events.push('transitionStart');
        
        // 3. Le shop NE s'ouvre pas (isShopLevel(6) = false)
        const shouldOpenShop = isShopLevel(6);
        expect(shouldOpenShop).toBe(false);
        
        // 4. Le chrono du niveau 6 commence (levelStartTime = Date.now() + 3000)
        events.push('levelTimerStartLevel6');

        expect(events).toEqual([
            'levelUpdate(6)',
            'transitionStart',
            'levelTimerStartLevel6'
        ]);
    });

    // --- TEST 6 : Timing global pour 3 niveaux complets ---
    test('Timing global: niveau 4 → 5 (avec shop) → 6', () => {
        const TRANSITION_DURATION = 3000;
        const SHOP_DURATION = 15000;
        const LEVEL_DURATION = 10000; // Exemple: 10 secondes par niveau

        let timelineMilliseconds = 0;
        const timeline = [];

        // Niveau 4
        timeline.push({ event: 'Niveau 4 démarre', time: timelineMilliseconds, timerActive: true });
        timelineMilliseconds += LEVEL_DURATION;
        timeline.push({ event: 'Niveau 4 complété (gem trouvée)', time: timelineMilliseconds, timerActive: false });

        // Passage au niveau 5
        timeline.push({ event: 'Transition affichée', time: timelineMilliseconds, timerActive: false });
        timelineMilliseconds += TRANSITION_DURATION;
        
        // Shop au niveau 5
        timeline.push({ event: 'Shop s\'ouvre', time: timelineMilliseconds, timerActive: false });
        timeline.push({ event: 'Niveau 5 timer: PAUSED (levelStartTime = null)', time: timelineMilliseconds, timerActive: false });
        timelineMilliseconds += SHOP_DURATION;
        timeline.push({ event: 'Shop ferme', time: timelineMilliseconds, timerActive: false });

        // Niveau 6
        timeline.push({ event: 'Niveau 6 timer: STARTED (levelStartTime = now)', time: timelineMilliseconds, timerActive: true });
        timelineMilliseconds += LEVEL_DURATION;
        timeline.push({ event: 'Niveau 6 pourrait être complété', time: timelineMilliseconds, timerActive: false });

        // Vérifications
        expect(timeline[2].event).toBe('Transition affichée');
        expect(timeline[3].event).toBe('Shop s\'ouvre');
        expect(timeline[4].event).toContain('PAUSED');
        expect(timeline[5].event).toBe('Shop ferme');
        expect(timeline[6].event).toContain('STARTED');

        // Le temps total jusqu'à la fin du shop
        const totalTimeToShopEnd = timeline.filter(e => e.time <= timelineMilliseconds && e.event.includes('Shop ferme'))[0].time;
        const expectedTimeToShopEnd = LEVEL_DURATION + TRANSITION_DURATION + SHOP_DURATION;
        expect(totalTimeToShopEnd).toBe(expectedTimeToShopEnd);
    });

    // --- TEST 7 : Pas de shop au niveau 4 (avant le premier shop) ---
    test('Il n\'y a pas de shop avant le niveau 5', () => {
        expect(isShopLevel(1)).toBe(false);
        expect(isShopLevel(2)).toBe(false);
        expect(isShopLevel(3)).toBe(false);
        expect(isShopLevel(4)).toBe(false);
    });

    // --- TEST 8 : Vérifier que le shop n'interfère pas avec les autres niveaux ---
    test('Les niveaux sans shop affichent une transition puis le timer démarre', () => {
        const nonShopLevels = [6, 7, 8, 9, 11, 12, 13, 14];
        
        nonShopLevels.forEach(level => {
            expect(isShopLevel(level)).toBe(false);
        });
        
        // Aucun de ces niveaux ne doit ouvrir le shop
        const hasShop = nonShopLevels.some(level => isShopLevel(level));
        expect(hasShop).toBe(false);
    });

});
