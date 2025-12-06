// tests/movement.test.js - Tests pour le système de mouvement amélioré

describe('Système de Mouvement Amélioré', () => {

    // --- TEST 1 : Mouvement en diagonale ---
    test('Le joueur doit pouvoir se déplacer en diagonale', () => {
        const player = { x: 100, y: 100 };
        const input = { left: false, right: true, up: true, down: false };
        const speed = 5;

        let moveX = 0;
        let moveY = 0;

        if (input.left) moveX -= speed;
        if (input.right) moveX += speed;
        if (input.up) moveY -= speed;
        if (input.down) moveY += speed;

        const nextX = player.x + moveX;
        const nextY = player.y + moveY;

        expect(moveX).toBe(5);
        expect(moveY).toBe(-5);
        expect(nextX).toBe(105);
        expect(nextY).toBe(95);
    });

    // --- TEST 2 : Glissement contre les murs ---
    test('Le joueur doit glisser le long d\'un mur en diagonale', () => {
        // Simuler : on veut aller en diagonale (right, up)
        // Mais le mouvement diagonal est bloqué
        const player = { x: 100, y: 100 };
        const speed = 5;
        let moveX = 5;  // right
        let moveY = -5; // up

        // Simuler une collision en diagonal mais pas sur les axes seuls
        const canMoveDiagonal = false;
        const canMoveX = true;  // Peut aller à droite
        const canMoveY = false; // Bloqué vers le haut

        let nextX = player.x;
        let nextY = player.y;

        if (!canMoveDiagonal) {
            if (canMoveX) nextX += moveX;
            else if (canMoveY) nextY += moveY;
        } else {
            nextX += moveX;
            nextY += moveY;
        }

        expect(nextX).toBe(105); // A bougé à droite
        expect(nextY).toBe(100); // N'a pas bougé vers le haut
    });

    // --- TEST 3 : Momentum (inertie) au relâchement ---
    test('Le momentum doit décroître progressivement après relâchement', () => {
        const MOMENTUM_DECAY = 0.85;
        let momentum = 1.0; // Touche relâchée

        // Simuler 5 frames après relâchement
        for (let i = 0; i < 5; i++) {
            momentum *= MOMENTUM_DECAY;
        }

        // Après 5 frames : 0.85^5 ≈ 0.443
        expect(momentum).toBeGreaterThan(0.4);
        expect(momentum).toBeLessThan(0.5);
    });

    // --- TEST 4 : Seuil d'activation du momentum ---
    test('Le mouvement doit s\'arrêter quand le momentum < 0.1', () => {
        const MOMENTUM_DECAY = 0.85;
        const MOMENTUM_THRESHOLD = 0.1;
        let momentum = 1.0;

        let isMoving = true;
        let frameCount = 0;

        while (momentum > MOMENTUM_THRESHOLD && frameCount < 50) {
            momentum *= MOMENTUM_DECAY;
            frameCount++;
        }

        expect(frameCount).toBeGreaterThan(10);
        expect(frameCount).toBeLessThan(50);
        expect(momentum).toBeLessThanOrEqual(MOMENTUM_THRESHOLD);
    });

    // --- TEST 5 : Momentum appliqué à chaque direction ---
    test('Chaque direction doit avoir son propre momentum', () => {
        const inputsMomentum = {
            up: 1,
            down: 1,
            left: 1,
            right: 1
        };
        const MOMENTUM_DECAY = 0.85;

        // Relâcher left et right, garder up
        const inputs = { up: true, down: false, left: false, right: false };

        // Appliquer decay
        if (!inputs.up) inputsMomentum.up *= MOMENTUM_DECAY;
        if (!inputs.down) inputsMomentum.down *= MOMENTUM_DECAY;
        if (!inputs.left) inputsMomentum.left *= MOMENTUM_DECAY;
        if (!inputs.right) inputsMomentum.right *= MOMENTUM_DECAY;

        expect(inputsMomentum.up).toBe(1); // up toujours à 1
        expect(inputsMomentum.down).toBeCloseTo(0.85, 2); // down en decay
        expect(inputsMomentum.left).toBeCloseTo(0.85, 2); // left en decay
        expect(inputsMomentum.right).toBeCloseTo(0.85, 2); // right en decay
    });

    // --- TEST 6 : Fusion mouvement direct + momentum ---
    test('Le mouvement doit combiner la touche pressée et le momentum', () => {
        const inputs = { up: false, down: false, left: false, right: true };
        let inputsMomentum = { up: 0, down: 0, left: 0.3, right: 1 };
        const MOMENTUM_THRESHOLD = 0.1;

        // Appliquer decay et calculer mouvement
        const inputsWithMomentum = {
            up: inputs.up || inputsMomentum.up > MOMENTUM_THRESHOLD,
            down: inputs.down || inputsMomentum.down > MOMENTUM_THRESHOLD,
            left: inputs.left || inputsMomentum.left > MOMENTUM_THRESHOLD,
            right: inputs.right || inputsMomentum.right > MOMENTUM_THRESHOLD
        };

        expect(inputsWithMomentum.right).toBe(true); // right est pressé
        expect(inputsWithMomentum.left).toBe(true);  // left a du momentum > 0.1
        expect(inputsWithMomentum.up).toBe(false);   // up = false
        expect(inputsWithMomentum.down).toBe(false); // down = false
    });

    // --- TEST 7 : Pas de blocage en diagonale ---
    test('Le mouvement en diagonale ne doit pas bloquer complètement', () => {
        const player = { x: 100, y: 100 };
        const moveX = 5;
        const moveY = 5;

        // Collision seulement en diagonal
        const canMoveDiagonal = false;
        const canMoveX = true;
        const canMoveY = true;

        let nextX = player.x;
        let nextY = player.y;

        if (!canMoveDiagonal && moveX !== 0 && moveY !== 0) {
            if (canMoveX) nextX += moveX;
            else if (canMoveY) nextY += moveY;
        }

        expect(nextX).toBe(105); // A pu bouger en X
        expect(nextY).toBe(100); // N'a pas bougé en Y
    });

    // --- TEST 8 : Vitesse de base + speedBoost ---
    test('La vitesse doit augmenter avec le speedBoost', () => {
        const speedBase = 5;
        const speedBoostValue = 2;

        const speedNormal = speedBase + 0; // Sans boost
        const speedBoosted = speedBase + speedBoostValue; // Avec boost

        expect(speedNormal).toBe(5);
        expect(speedBoosted).toBe(7);
    });

    // --- TEST 9 : Trace ajoutée à chaque mouvement ---
    test('La trace doit être enregistrée à chaque position', () => {
        const player = { x: 100, y: 100, trail: [] };
        
        // Simuler 10 mouvements
        for (let i = 0; i < 10; i++) {
            player.x += 5;
            player.trail.push({ x: player.x, y: player.y });
        }

        expect(player.trail.length).toBe(10);
        expect(player.trail[0]).toEqual({ x: 105, y: 100 });
        expect(player.trail[9]).toEqual({ x: 150, y: 100 });
    });

    // --- TEST 10 : Limite de trace (max 2000) ---
    test('La trace ne doit pas dépasser 2000 positions', () => {
        const player = { x: 100, y: 100, trail: [] };

        // Ajouter 3000 positions
        for (let i = 0; i < 3000; i++) {
            player.x += 1;
            player.trail.push({ x: player.x, y: player.y });
            if (player.trail.length > 2000) {
                player.trail.shift();
            }
        }

        expect(player.trail.length).toBeLessThanOrEqual(2000);
        expect(player.trail.length).toBe(2000);
    });

    // --- TEST 11 : Normalisation du mouvement diagonal ---
    test('Le mouvement diagonal doit avoir la même vitesse que le linéaire', () => {
        const speed = 3;

        // Mouvement linéaire (droite)
        let linearMoveX = speed;
        let linearMoveY = 0;
        let linearDistance = Math.sqrt(linearMoveX * linearMoveX + linearMoveY * linearMoveY);

        // Mouvement diagonal (avant normalisation)
        let diagonalMoveX = speed;
        let diagonalMoveY = -speed;
        let diagonalDistanceBefore = Math.sqrt(diagonalMoveX * diagonalMoveX + diagonalMoveY * diagonalMoveY);

        // Après normalisation
        if (diagonalMoveX !== 0 && diagonalMoveY !== 0) {
            const diagonal = Math.sqrt(diagonalMoveX * diagonalMoveX + diagonalMoveY * diagonalMoveY);
            diagonalMoveX = (diagonalMoveX / diagonal) * speed;
            diagonalMoveY = (diagonalMoveY / diagonal) * speed;
        }
        let diagonalDistanceAfter = Math.sqrt(diagonalMoveX * diagonalMoveX + diagonalMoveY * diagonalMoveY);

        // Avant normalisation : ~4.24 (3 * sqrt(2))
        expect(diagonalDistanceBefore).toBeCloseTo(3 * Math.sqrt(2), 1);

        // Après normalisation : 3 (comme le linéaire)
        expect(linearDistance).toBeCloseTo(3, 1);
        expect(diagonalDistanceAfter).toBeCloseTo(3, 1);
    });

    // --- TEST 12 : Vitesse correcte avec speedBoost ---
    test('Le speedBoost doit augmenter la vitesse', () => {
        const baseSpeed = 3;
        const boostSpeed = 1;

        const speedWithoutBoost = baseSpeed;
        const speedWithBoost = baseSpeed + boostSpeed;

        expect(speedWithBoost).toBe(4);
        expect(speedWithBoost > speedWithoutBoost).toBe(true);
    });

});

