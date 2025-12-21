// utils/dutchAuctionShop.js - Système d'enchères dégressives (shop cadran)

function normalizeGridSize(gridSize) {
    if (!gridSize) return 3;
    const n = Number(gridSize);
    if (!Number.isFinite(n)) return 3;
    return Math.max(1, Math.min(6, Math.floor(n)));
}

function clampInt(value, min, max) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
}

function buildLotId(index) {
    return `lot_${index + 1}`;
}

function pickItemIdsForLots(itemIds, count) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) return [];
    const out = [];
    for (let i = 0; i < count; i++) {
        out.push(itemIds[i % itemIds.length]);
    }
    return out;
}

function getDefaultDutchAuctionConfig() {
    return {
        gridSize: 3,
        tickMs: 2000,
        decrement: 1,
        startPriceMultiplier: 2,
        minPriceMultiplier: 0.5
    };
}

function getLotPricing(item, config) {
    const base = clampInt(item?.price ?? 1, 1, 9999);
    const startPrice = clampInt(Math.ceil(base * (Number(config.startPriceMultiplier) || 2)), 1, 9999);
    // Autoriser un plancher à 0 pour supporter une fermeture automatique quand le prix passe sous 1 gem.
    const minPrice = clampInt(Math.floor(base * (Number(config.minPriceMultiplier) || 0.5)), 0, 9999);
    return {
        startPrice: Math.max(startPrice, minPrice),
        minPrice
    };
}

function computeCurrentPrice({ startPrice, minPrice }, ticksElapsed, decrement) {
    const dec = clampInt(decrement ?? 1, 1, 9999);
    const raw = startPrice - (ticksElapsed * dec);
    return Math.max(minPrice, raw);
}

function createDutchAuctionState(itemsById, options = {}) {
    const defaults = getDefaultDutchAuctionConfig();
    const config = {
        gridSize: normalizeGridSize(options.gridSize ?? defaults.gridSize),
        tickMs: clampInt(options.tickMs ?? defaults.tickMs, 250, 10000),
        decrement: clampInt(options.decrement ?? defaults.decrement, 1, 9999),
        startPriceMultiplier: Number.isFinite(Number(options.startPriceMultiplier)) ? Number(options.startPriceMultiplier) : defaults.startPriceMultiplier,
        minPriceMultiplier: Number.isFinite(Number(options.minPriceMultiplier)) ? Number(options.minPriceMultiplier) : defaults.minPriceMultiplier
    };

    const startedAt = Date.now();
    const lotsCount = config.gridSize * config.gridSize;

    const itemIds = Object.keys(itemsById || {});
    const lotItemIds = pickItemIdsForLots(itemIds, lotsCount);

    const lots = lotItemIds.map((itemId, idx) => {
        const baseItem = itemsById[itemId] || { id: itemId, name: itemId, price: 1 };
        const pricing = getLotPricing(baseItem, config);
        return {
            lotId: buildLotId(idx),
            itemId,
            name: baseItem.name || itemId,
            startPrice: pricing.startPrice,
            minPrice: pricing.minPrice,
            sold: false,
            soldBy: null,
            soldPrice: null,
            currentPrice: pricing.startPrice
        };
    });

    return {
        type: 'dutchAuction',
        startedAt,
        tickMs: config.tickMs,
        decrement: config.decrement,
        gridSize: config.gridSize,
        lots
    };
}

function tickDutchAuctionState(state, now = Date.now()) {
    if (!state || state.type !== 'dutchAuction') return state;
    const ticksElapsed = Math.floor((now - state.startedAt) / state.tickMs);

    for (const lot of state.lots) {
        if (lot.sold) continue;
        lot.currentPrice = computeCurrentPrice(
            { startPrice: lot.startPrice, minPrice: lot.minPrice },
            ticksElapsed,
            state.decrement
        );
    }

    return state;
}

function getLotById(state, lotId) {
    if (!state || !Array.isArray(state.lots)) return null;
    return state.lots.find(l => l.lotId === lotId) || null;
}

function markLotSold(state, lotId, soldByPlayerId, soldPrice) {
    const lot = getLotById(state, lotId);
    if (!lot) return null;
    if (lot.sold) return lot;
    lot.sold = true;
    lot.soldBy = soldByPlayerId;
    lot.soldPrice = soldPrice;
    return lot;
}

function toPublicState(state) {
    if (!state || state.type !== 'dutchAuction') return null;
    return {
        type: state.type,
        startedAt: state.startedAt,
        tickMs: state.tickMs,
        decrement: state.decrement,
        gridSize: state.gridSize,
        lots: state.lots.map(l => ({
            lotId: l.lotId,
            itemId: l.itemId,
            name: l.name,
            startPrice: l.startPrice,
            minPrice: l.minPrice,
            currentPrice: l.currentPrice,
            sold: l.sold
        }))
    };
}

module.exports = {
    createDutchAuctionState,
    tickDutchAuctionState,
    getLotById,
    markLotSold,
    toPublicState,
    computeCurrentPrice
};
