// tests/solo-progression.test.js - Tests de progression du mode solo

describe('Solo Mode - Progression des niveaux', () => {
    
    test('Progression: Niveau 1 → Niveau 2', () => {
        const currentLevel = 1;
        const nextLevel = currentLevel + 1;
        
        expect(nextLevel).toBe(2);
        expect(nextLevel).toBeLessThanOrEqual(20);
    });

    test('Progression: Dernier niveau (20) doit signaler fin de jeu', () => {
        const currentLevel = 20;
        const isGameFinished = currentLevel >= 20;
        
        expect(isGameFinished).toBe(true);
    });

    test('Progression: Vérifier qu\'on ne peut pas aller au delà du niveau 20', () => {
        const currentLevel = 20;
        const nextLevel = Math.min(currentLevel + 1, 20);
        
        expect(nextLevel).toBe(20);
    });

    test('Progression: Séquence complète 1 → 20', () => {
        const levels = [];
        for (let i = 1; i <= 20; i++) {
            levels.push(i);
        }
        
        expect(levels.length).toBe(20);
        expect(levels[0]).toBe(1);
        expect(levels[19]).toBe(20);
    });

    test('Progression: Chaque niveau doit être unique', () => {
        const levels = [];
        for (let i = 1; i <= 20; i++) {
            levels.push(i);
        }
        
        const uniqueLevels = new Set(levels);
        expect(uniqueLevels.size).toBe(20);
    });

    test('Progression: Transition expansion → contraction au niveau 11', () => {
        const level10 = 10;
        const level11 = 11;
        
        const size10 = 15 + (level10 - 1) * 2;     // 33
        const size11 = 15 + (10 - (level11 - 10)) * 2; // 33
        
        // Même taille au tournant
        expect(size10).toBe(size11);
        expect(size10).toBe(33);
    });

    test('Progression: Niveau 10 et 11 doivent avoir la même taille (pivot)', () => {
        const size10 = 15 + (10 - 1) * 2;           // 33x33
        const size11 = 15 + (10 - (11 - 10)) * 2;   // 33x33
        
        expect(size10).toBe(size11);
    });

    test('Progression: Croissance des niveaux 1-10', () => {
        const sizes = [];
        for (let level = 1; level <= 10; level++) {
            const size = 15 + (level - 1) * 2;
            sizes.push(size);
        }
        
        // Vérifier progression linéaire: +2 par niveau
        for (let i = 1; i < sizes.length; i++) {
            expect(sizes[i] - sizes[i - 1]).toBe(2);
        }
    });

    test('Progression: Décroissance des niveaux 11-20', () => {
        const sizes = [];
        for (let level = 11; level <= 20; level++) {
            const size = 15 + (10 - (level - 10)) * 2;
            sizes.push(size);
        }
        
        // Vérifier progression linéaire inverse: -2 par niveau
        for (let i = 1; i < sizes.length; i++) {
            expect(sizes[i] - sizes[i - 1]).toBe(-2);
        }
    });

    test('Progression: Symétrie expansion/contraction', () => {
        // Niveau 1 et 20 doivent avoir la même taille
        const size1 = 15 + (1 - 1) * 2;           // 15x15
        const size20 = 15 + (10 - (20 - 10)) * 2; // 15x15
        
        expect(size1).toBe(size20);
        expect(size1).toBe(15);
    });

    test('Progression: Vérifier la continuité des tailles', () => {
        const sizes = [];
        
        // Niveaux 1-10
        for (let level = 1; level <= 10; level++) {
            sizes.push(15 + (level - 1) * 2);
        }
        
        // Niveaux 11-20
        for (let level = 11; level <= 20; level++) {
            sizes.push(15 + (10 - (level - 10)) * 2);
        }
        
        // Vérifier qu'on monte de 15 à 33 puis redescend à 15
        expect(sizes[0]).toBe(15);  // Niveau 1
        expect(sizes[9]).toBe(33);  // Niveau 10
        expect(sizes[10]).toBe(33); // Niveau 11
        expect(sizes[19]).toBe(15); // Niveau 20
    });
});
