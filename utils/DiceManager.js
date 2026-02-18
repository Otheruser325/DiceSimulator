export function getLuckFactor(luckFactor) {
  const factor = Number(luckFactor);
  if (!isFinite(factor) || factor === 1) {
    return { rolls: 1, mode: 'neutral' };
  }
  if (factor > 1) {
    return { rolls: Math.max(1, Math.round(factor)), mode: 'high' };
  }
  return { rolls: Math.max(1, Math.round(1 / Math.max(0.01, factor))), mode: 'low' };
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
    const baseRoll = () => Phaser.Math.Between(1, sides);
    const { rolls, mode } = getLuckFactor(luckFactor);
    if (mode === 'neutral') return baseRoll();
    if (mode === 'high') {
      let best = 1;
      for (let i = 0; i < rolls; i += 1) {
        const r = baseRoll();
        if (r > best) best = r;
      }
      return best;
    }
    let worst = sides;
    for (let i = 0; i < rolls; i += 1) {
      const r = baseRoll();
      if (r < worst) worst = r;
    }
    return worst;
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

function powBigInt(base, exp) {
  let result = 1n;
  let b = BigInt(base);
  let e = Math.max(0, Number(exp));
  while (e > 0) {
    if (e % 2 === 1) result *= b;
    b *= b;
    e = Math.floor(e / 2);
  }
  return result;
}

export function getProbabilityTable(sides, luckFactor) {
  const sidesNum = Math.max(1, Math.floor(Number(sides)));
  if (!isFinite(sidesNum)) return null;

  const { rolls, mode } = getLuckFactor(luckFactor);
  const outcomes = [];

  if (mode === 'neutral') {
    const denominator = BigInt(sidesNum);
    const probability = 1 / sidesNum;
    for (let value = 1; value <= sidesNum; value += 1) {
      outcomes.push({ value, numerator: 1n, denominator, probability });
    }
    return { sides: sidesNum, rolls, mode, outcomes, denominator };
  }

  const denominator = powBigInt(BigInt(sidesNum), rolls);
  const denomFloat = Math.pow(sidesNum, rolls);

  for (let value = 1; value <= sidesNum; value += 1) {
    let numerator;
    let probability;
    if (mode === 'high') {
      const highA = powBigInt(BigInt(value), rolls);
      const highB = powBigInt(BigInt(value - 1), rolls);
      numerator = highA - highB;
      probability = (Math.pow(value, rolls) - Math.pow(value - 1, rolls)) / denomFloat;
    } else {
      const a = sidesNum - value + 1;
      const lowA = powBigInt(BigInt(a), rolls);
      const lowB = powBigInt(BigInt(a - 1), rolls);
      numerator = lowA - lowB;
      probability = (Math.pow(a, rolls) - Math.pow(a - 1, rolls)) / denomFloat;
    }
    outcomes.push({ value, numerator, denominator, probability });
  }

  return { sides: sidesNum, rolls, mode, outcomes, denominator };
}
