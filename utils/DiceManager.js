// Weighted distribution: weight(face v) = lerp(1, L, t) where t=(v-1)/(sides-1)
// L > 1: higher faces more likely (e.g. L=3 means max face is 3x more likely than min)
// L < 1: lower faces more likely (e.g. L=0.4 means min face is 2.5x more likely than max)
// L = 1: all faces equal (neutral)
export function getWeightedDistribution(sides, luckFactor) {
    const S = Math.max(2, Math.floor(Number(sides)));
    const L = Number(luckFactor);
    if (!isFinite(L) || !isFinite(S)) return null;
    const weights = [];
    for (let v = 1; v <= S; v++) {
        const t = S > 1 ? (v - 1) / (S - 1) : 0;
        weights.push(Math.max(0.0001, 1 + (L - 1) * t));
    }
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map((w, i) => ({
        value: i + 1,
        weight: w,
        probability: w / total
    }));
}

export class RegularDice {
    static roll(sides) {
        return Phaser.Math.Between(1, sides);
    }
}

const CUSTOM_STORAGE_KEY = 'diceSimulator_customDice';
export const MAX_CUSTOM_DICE = 100;

function sanitizeCustomDice(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, MAX_CUSTOM_DICE).filter(d => d && typeof d.sides === 'number');
}

export class CustomDice {
    static roll(sides, luckFactor) {
        const S = Math.floor(Number(sides));
        const L = Number(luckFactor);
        if (!isFinite(L) || L === 1 || S <= 1) {
            return Phaser.Math.Between(1, S);
        }
        const dist = getWeightedDistribution(S, L);
        if (!dist) return Phaser.Math.Between(1, S);
        const r = Math.random();
        let cum = 0;
        for (const { value, probability } of dist) {
            cum += probability;
            if (r < cum) return value;
        }
        return S;
    }

    static load(fallback = []) {
        try {
            const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
            if (!raw) return sanitizeCustomDice(fallback);
            const parsed = JSON.parse(raw);
            return sanitizeCustomDice(parsed);
        } catch (e) {
            console.warn('[CustomDice] failed to load custom dice', e);
            return sanitizeCustomDice(fallback);
        }
    }

    static save(arr) {
        const cleaned = sanitizeCustomDice(arr);
        try {
            localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(cleaned));
        } catch (e) {
            console.warn('[CustomDice] failed to save custom dice', e);
        }
        return cleaned;
    }
}

export function getProbabilityTable(sides, luckFactor) {
    const S = Math.max(2, Math.floor(Number(sides)));
    const L = Number(luckFactor);
    if (!isFinite(S) || !isFinite(L) || L <= 0) return null;

    const dist = getWeightedDistribution(S, L);
    if (!dist) return null;

    const SCALE = 1000000;
    const weightInts = dist.map(d => BigInt(Math.round(d.weight * SCALE)));
    const denominator = weightInts.reduce((a, b) => a + b, 0n);

    const outcomes = dist.map((d, i) => ({
        value: d.value,
        numerator: weightInts[i],
        denominator,
        probability: d.probability
    }));

    const luckMode = L === 1 ? 'neutral' : L > 1 ? 'high' : 'low';
    return { sides: S, luckFactor: L, luckMode, outcomes, denominator };
}
