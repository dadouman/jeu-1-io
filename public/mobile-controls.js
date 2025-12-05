// Détection de l'appareil mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Initialiser les contrôles mobiles
function initMobileControls() {
    if (!isMobileDevice()) return;

    const mobileControls = document.getElementById('mobileControls');
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const checkpointBtn = document.getElementById('checkpointBtn');
    const teleportBtn = document.getElementById('teleportBtn');

    // --- BOUTONS DIRECTIONNELS ---
    function setupDirectionButton(btn, direction) {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            inputs[direction] = true;
            btn.style.background = 'rgba(78, 205, 196, 0.4)';
        });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            inputs[direction] = false;
            btn.style.background = 'rgba(78, 205, 196, 0.1)';
        });

        // Support souris pour debug
        btn.addEventListener('mousedown', () => {
            inputs[direction] = true;
        });

        btn.addEventListener('mouseup', () => {
            inputs[direction] = false;
        });

        btn.addEventListener('mouseleave', () => {
            inputs[direction] = false;
        });
    }

    setupDirectionButton(btnUp, 'up');
    setupDirectionButton(btnDown, 'down');
    setupDirectionButton(btnLeft, 'left');
    setupDirectionButton(btnRight, 'right');

    // --- BOUTONS D'ACTION ---
    checkpointBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        actions.setCheckpoint = true;
    });

    checkpointBtn.addEventListener('touchend', () => {
        actions.setCheckpoint = false;
    });

    teleportBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        actions.teleportCheckpoint = true;
    });

    teleportBtn.addEventListener('touchend', () => {
        actions.teleportCheckpoint = false;
    });

    // Support souris pour les boutons d'action
    checkpointBtn.addEventListener('mousedown', () => {
        actions.setCheckpoint = true;
    });

    checkpointBtn.addEventListener('mouseup', () => {
        actions.setCheckpoint = false;
    });

    teleportBtn.addEventListener('mousedown', () => {
        actions.teleportCheckpoint = true;
    });

    teleportBtn.addEventListener('mouseup', () => {
        actions.teleportCheckpoint = false;
    });

    // Afficher les contrôles si c'est un mobile
    mobileControls.classList.add('active');

    console.log("📱 Contrôles mobiles (D-Pad) activés !");
}

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
    initMobileControls();
}
