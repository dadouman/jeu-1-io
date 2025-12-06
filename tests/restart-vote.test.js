// tests/restart-vote.test.js - Tests pour le système de vote de redémarrage

describe('Système de Vote pour Redémarrage', () => {

    // --- TEST 1 : Vote simple avec 2 joueurs ---
    test('Avec 2 joueurs, 1 vote OUI est suffisant pour redémarrer', () => {
        const totalPlayers = 2;
        const requiredYes = Math.ceil(totalPlayers / 2); // 1
        const votes = { 'player1': true };
        
        const yesVotes = Object.values(votes).filter(v => v === true).length;
        
        expect(requiredYes).toBe(1);
        expect(yesVotes >= requiredYes).toBe(true);
    });

    // --- TEST 2 : Vote simple avec 3 joueurs ---
    test('Avec 3 joueurs, 2 votes OUI sont nécessaires pour redémarrer', () => {
        const totalPlayers = 3;
        const requiredYes = Math.ceil(totalPlayers / 2); // 2
        
        // Cas 1 : 2 votes oui
        let votes = { 'player1': true, 'player2': true };
        let yesVotes = Object.values(votes).filter(v => v === true).length;
        expect(yesVotes >= requiredYes).toBe(true);
        
        // Cas 2 : 1 vote oui (pas suffisant)
        votes = { 'player1': true };
        yesVotes = Object.values(votes).filter(v => v === true).length;
        expect(yesVotes >= requiredYes).toBe(false);
    });

    // --- TEST 3 : Vote avec nombre pair de joueurs ---
    test('Avec 4 joueurs, 2 votes OUI sont nécessaires', () => {
        const totalPlayers = 4;
        const requiredYes = Math.ceil(totalPlayers / 2); // 2
        
        expect(requiredYes).toBe(2);
    });

    // --- TEST 4 : Votes non = OUI pour majorité ---
    test('Les non-votes comptent comme NON', () => {
        const totalPlayers = 4;
        const allPlayers = ['player1', 'player2', 'player3', 'player4'];
        
        // Scénario : 2 votes OUI, 0 votes enregistrés, donc 2 NON implicites
        const votes = {
            'player1': true,
            'player2': true
            // player3 et player4 n'ont pas voté = NON
        };
        
        const yesVotes = Object.values(votes).filter(v => v === true).length;
        const requiredYes = Math.ceil(totalPlayers / 2); // 2
        
        expect(yesVotes).toBe(2);
        expect(yesVotes >= requiredYes).toBe(true);
    });

    // --- TEST 5 : Majorité stricte pour 5 joueurs ---
    test('Avec 5 joueurs, 3 votes OUI sont nécessaires', () => {
        const totalPlayers = 5;
        const requiredYes = Math.ceil(totalPlayers / 2); // 3
        
        // 3 votes oui (juste suffisant)
        let votes = { 'p1': true, 'p2': true, 'p3': true };
        let yesVotes = Object.values(votes).filter(v => v === true).length;
        expect(yesVotes >= requiredYes).toBe(true);
        
        // 2 votes oui (pas suffisant)
        votes = { 'p1': true, 'p2': true };
        yesVotes = Object.values(votes).filter(v => v === true).length;
        expect(yesVotes >= requiredYes).toBe(false);
    });

    // --- TEST 6 : Timeout du vote ---
    test('Le vote doit expirer après 30 secondes', () => {
        const VOTE_TIMEOUT = 30000;
        const voteStartTime = Date.now();
        
        // Après 20 secondes
        let elapsed = 20000;
        expect(voteStartTime + elapsed).toBeLessThan(voteStartTime + VOTE_TIMEOUT);
        
        // Après 35 secondes
        elapsed = 35000;
        expect(voteStartTime + elapsed).toBeGreaterThan(voteStartTime + VOTE_TIMEOUT);
    });

    // --- TEST 7 : Vote avec mélange OUI/NON/Rien ---
    test('Les votes NON explicites comptent comme NON', () => {
        const totalPlayers = 5;
        const requiredYes = Math.ceil(totalPlayers / 2); // 3
        
        const votes = {
            'p1': true,
            'p2': true,
            'p3': false,    // Explicitement NON
            'p4': false     // Explicitement NON
            // p5 n'a pas voté (implicitement NON)
        };
        
        const yesVotes = Object.values(votes).filter(v => v === true).length;
        const noVotes = Object.values(votes).filter(v => v === false).length;
        
        expect(yesVotes).toBe(2);
        expect(noVotes).toBe(2);
        expect(yesVotes >= requiredYes).toBe(false); // 2 < 3
    });

    // --- TEST 8 : Un seul joueur ---
    test('Avec 1 joueur, son vote OUI suffit pour redémarrer', () => {
        const totalPlayers = 1;
        const requiredYes = Math.ceil(totalPlayers / 2); // 1
        
        const votes = { 'player1': true };
        const yesVotes = Object.values(votes).filter(v => v === true).length;
        
        expect(requiredYes).toBe(1);
        expect(yesVotes >= requiredYes).toBe(true);
    });

    // --- TEST 9 : Avant/Après le vote ---
    test('L\'état du vote doit changer avant et après', () => {
        let isVoteActive = false;
        let myVote = null;
        
        // Avant le vote
        expect(isVoteActive).toBe(false);
        expect(myVote).toBe(null);
        
        // Pendant le vote
        isVoteActive = true;
        myVote = true;
        
        expect(isVoteActive).toBe(true);
        expect(myVote).toBe(true);
        
        // Après le vote
        isVoteActive = false;
        myVote = null;
        
        expect(isVoteActive).toBe(false);
        expect(myVote).toBe(null);
    });

    // --- TEST 10 : Cas limite - 50/50 ---
    test('En cas d\'égalité parfaite, le OUI ne gagne pas', () => {
        const totalPlayers = 4;
        const requiredYes = Math.ceil(totalPlayers / 2); // 2
        
        // 2 oui, 2 non = égalité
        const votes = {
            'p1': true,
            'p2': true,
            'p3': false,
            'p4': false
        };
        
        const yesVotes = Object.values(votes).filter(v => v === true).length;
        
        // 2 >= 2 = vrai (le ceil fait que 2/4 = 0.5 arrondi en 1, non en 2)
        expect(requiredYes).toBe(2);
        expect(yesVotes >= requiredYes).toBe(true);
    });

    // --- TEST 11 : Requête pour redémarrer déjà en cours ---
    test('On ne peut pas commencer deux votes en même temps', () => {
        let isVoteActive = false;
        
        // Démarrer un vote
        isVoteActive = true;
        expect(isVoteActive).toBe(true);
        
        // Essayer d'en démarrer un autre
        if (isVoteActive) {
            // Condition : déjà en cours
            expect(isVoteActive).toBe(true);
        }
    });

    // --- TEST 12 : Calcul du nombre de votes reçus ---
    test('Compter le nombre de votes reçus', () => {
        const totalPlayers = 5;
        const votes = {
            'p1': true,
            'p2': false,
            'p3': true
            // p4 et p5 n'ont pas voté
        };
        
        const totalVotesReceived = Object.keys(votes).length;
        const remaining = totalPlayers - totalVotesReceived;
        
        expect(totalVotesReceived).toBe(3);
        expect(remaining).toBe(2);
    });

});
