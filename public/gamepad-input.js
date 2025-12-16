// gamepad-input.js - Support manette (activation via menu pause)

const GAMEPAD_DEADZONE = 0.2;
let activeGamepadIndex = null;
let lastButtonState = {};

function applyDeadzone(value, deadzone = GAMEPAD_DEADZONE) {
    return Math.abs(value) < deadzone ? 0 : value;
}

function setAxisInput(value, positiveKey, negativeKey) {
    const isPositive = value > 0;
    const isNegative = value < 0;
    inputs[positiveKey] = isPositive;
    inputs[negativeKey] = isNegative;
    inputsMomentum[positiveKey] = isPositive ? 1 : inputsMomentum[positiveKey] * MOMENTUM_DECAY;
    inputsMomentum[negativeKey] = isNegative ? 1 : inputsMomentum[negativeKey] * MOMENTUM_DECAY;
}

function setButtonAxis(negativeButton, positiveButton, negativeKey, positiveKey) {
    const negPressed = negativeButton && negativeButton.pressed;
    const posPressed = positiveButton && positiveButton.pressed;
    inputs[negativeKey] = negPressed;
    inputs[positiveKey] = posPressed;
    inputsMomentum[negativeKey] = negPressed ? 1 : inputsMomentum[negativeKey] * MOMENTUM_DECAY;
    inputsMomentum[positiveKey] = posPressed ? 1 : inputsMomentum[positiveKey] * MOMENTUM_DECAY;
}

function handleButtonPress(gamepad, index, onPress) {
    const current = gamepad.buttons[index] && gamepad.buttons[index].pressed;
    const previous = lastButtonState[index] || false;
    lastButtonState[index] = current;
    if (current && !previous && typeof onPress === 'function') {
        onPress();
    }
}

function pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gamepad = null;

    if (activeGamepadIndex !== null && pads[activeGamepadIndex]) {
        gamepad = pads[activeGamepadIndex];
    } else {
        for (const pad of pads) {
            if (pad) {
                gamepad = pad;
                break;
            }
        }
    }

    if (!gamepad) {
        isGamepadConnected = false;
        requestAnimationFrame(pollGamepad);
        return;
    }

    isGamepadConnected = true;
    activeGamepadIndex = gamepad.index;
    activeGamepadName = gamepad.id || 'Manette';

    // Pause accessible même si la manette est désactivée côté inputs
    handleButtonPress(gamepad, 9, () => togglePause('gamepad-start'));
    if (pauseMenuVisible) {
        handleButtonPress(gamepad, 0, () => toggleGamepadSupport('gamepad-a'));
    }

    if (!gamepadEnabled) {
        requestAnimationFrame(pollGamepad);
        return;
    }

    // Mouvement via sticks ou D-Pad
    const axisX = applyDeadzone(gamepad.axes[0] || 0);
    const axisY = applyDeadzone(gamepad.axes[1] || 0);
    setAxisInput(axisX, 'right', 'left');
    setAxisInput(axisY, 'down', 'up');

    // D-Pad en secours
    setButtonAxis(gamepad.buttons[14], gamepad.buttons[15], 'left', 'right');
    setButtonAxis(gamepad.buttons[12], gamepad.buttons[13], 'up', 'down');

    if (isPaused) {
        inputsMomentum = { up: 0, down: 0, left: 0, right: 0 };
        inputs = { up: false, down: false, left: false, right: false };
    }

    // Actions (maintenues)
    actions.dash = gamepad.buttons[0] && gamepad.buttons[0].pressed;
    actions.setCheckpoint = gamepad.buttons[2] && gamepad.buttons[2].pressed;
    actions.teleportCheckpoint = gamepad.buttons[1] && gamepad.buttons[1].pressed;

    requestAnimationFrame(pollGamepad);
}

window.addEventListener('gamepadconnected', (event) => {
    activeGamepadIndex = event.gamepad.index;
    activeGamepadName = event.gamepad.id || 'Manette';
    isGamepadConnected = true;
    if (!gamepadEnabled) {
        showGamepadStatusMessage('Manette détectée : ouvre le menu pause (Esc/Start)');
    }
});

window.addEventListener('gamepaddisconnected', () => {
    isGamepadConnected = false;
    activeGamepadName = '';
    activeGamepadIndex = null;
    if (gamepadEnabled) {
        toggleGamepadSupport('disconnect');
    }
});

requestAnimationFrame(pollGamepad);
