// Détection de l'appareil mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Initialiser les contrôles mobiles
function initMobileControls() {
    if (!isMobileDevice()) return;

    const mobileControls = document.getElementById('mobileControls');
    const joystick = document.getElementById('joystick');
    const joystickThumb = document.getElementById('joystickThumb');
    const checkpointBtn = document.getElementById('checkpointBtn');
    const teleportBtn = document.getElementById('teleportBtn');

    let isJoystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    const joystickRadius = 40; // Rayon du joystick

    // --- JOYSTICK ---
    joystick.addEventListener('touchstart', (e) => {
        isJoystickActive = true;
        const rect = joystick.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        handleJoystickInput(e);
    });

    document.addEventListener('touchmove', (e) => {
        if (isJoystickActive) {
            handleJoystickInput(e);
        }
    });

    document.addEventListener('touchend', () => {
        isJoystickActive = false;
        // Réinitialiser les inputs
        inputs.up = false;
        inputs.down = false;
        inputs.left = false;
        inputs.right = false;
        joystickThumb.style.transform = 'translate(0, 0)';
    });

    function handleJoystickInput(e) {
        const touch = e.touches[0];
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Limiter le mouvement au rayon
        const limitedDistance = Math.min(distance, joystickRadius);
        const x = Math.cos(angle) * limitedDistance;
        const y = Math.sin(angle) * limitedDistance;

        // Mettre à jour la position du thumb
        joystickThumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

        // Déterminer la direction (avec diagonales)
        inputs.up = false;
        inputs.down = false;
        inputs.left = false;
        inputs.right = false;

        // Seuil plus bas pour les diagonales
        const threshold = joystickRadius * 0.25;

        // Activation indépendante des directions (permet les diagonales)
        if (dy < -threshold) inputs.up = true;
        if (dy > threshold) inputs.down = true;
        if (dx < -threshold) inputs.left = true;
        if (dx > threshold) inputs.right = true;
    }

    // --- BOUTONS ---
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

    // Afficher les contrôles si c'est un mobile
    mobileControls.classList.add('active');

    console.log("📱 Contrôles mobiles activés !");
}

// Initialiser quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
    initMobileControls();
}
