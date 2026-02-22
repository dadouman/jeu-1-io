// server/validation/schemas.js
// Schémas JSON pour valider les données entrantes des socket events

const schemas = {
    // --- GAME MODE SELECTION ---
    selectGameMode: {
        type: 'object',
        properties: {
            mode: {
                type: 'string',
                enum: ['classic', 'infinite', 'solo', 'custom', 'classicPrim', 'classicAuction', 'infiniteAuction', 'soloAuction', 'classicPrimAuction']
            },
            customConfig: {
                type: 'object',
                properties: {
                    maxLevels: { type: 'number', minimum: 1, maximum: 50 },
                    levelConfig: {
                        type: 'object',
                        properties: {
                            sizes: { type: 'array', items: { type: 'number', minimum: 10, maximum: 50 } }
                        }
                    },
                    shopItems: { type: 'array' },
                    endType: { type: 'string', enum: ['multi', 'solo', 'custom'] },
                    mazeGeneration: {
                        type: 'object',
                        properties: {
                            algorithm: { type: 'string', enum: ['backtracker', 'prim', 'kruskal'] },
                            density: { type: 'number', minimum: 0, maximum: 1 }
                        }
                    }
                }
            }
        },
        required: ['mode'],
        additionalProperties: false
    },

    // --- MOVEMENT ---
    movement: {
        type: 'object',
        properties: {
            left: { type: 'boolean' },
            right: { type: 'boolean' },
            up: { type: 'boolean' },
            down: { type: 'boolean' }
        },
        additionalProperties: false
    },

    // --- CHECKPOINT ---
    checkpoint: {
        type: 'object',
        properties: {
            setCheckpoint: { type: 'boolean' },
            teleportCheckpoint: { type: 'boolean' },
            dash: { type: 'boolean' }
        },
        additionalProperties: false
    },

    // --- SHOP PURCHASE ---
    shopPurchase: {
        type: 'object',
        properties: {
            itemId: { type: 'string', minLength: 1, maxLength: 50 }
        },
        required: ['itemId'],
        additionalProperties: false
    },

    // --- DUTCH AUCTION PURCHASE ---
    dutchAuctionPurchase: {
        type: 'object',
        properties: {
            lotId: { type: 'string', minLength: 1, maxLength: 50 }
        },
        required: ['lotId'],
        additionalProperties: false
    },

    // --- VOTING ---
    proposeRestart: {
        type: 'object',
        additionalProperties: false
    },

    voteRestart: {
        type: 'object',
        properties: {
            vote: { type: 'boolean' }
        },
        required: ['vote'],
        additionalProperties: false
    },

    proposeReturnToMode: {
        type: 'object',
        additionalProperties: false
    },

    voteReturnToMode: {
        type: 'object',
        properties: {
            vote: { type: 'boolean' }
        },
        required: ['vote'],
        additionalProperties: false
    },

    // --- SOLO RESULTS ---
    saveSoloResults: {
        type: 'object',
        properties: {
            totalTime: { type: 'number', minimum: 0, maximum: 3600 },
            splitTimes: {
                type: 'array',
                items: { type: 'number', minimum: 0.5, maximum: 600 },
                maxItems: 20
            },
            playerSkin: { type: 'string', maxLength: 10 },
            mode: { type: 'string', enum: ['solo'] },
            finalLevel: { type: 'number', minimum: 1, maximum: 20 }
        },
        required: ['totalTime', 'playerSkin', 'mode', 'finalLevel'],
        additionalProperties: false
    }
};

module.exports = schemas;
