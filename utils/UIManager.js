import SettingsManager from './SettingsManager.js';

// -----------------------
// UIManager (exported as UIFactory for compatibility)
// -----------------------
export class UIManager {
  static defaultFont = "Verdana";

  static createButton(scene, text, x, y, callback, fontSize = "28px", bgColor = "#333", textColor = "#fff") {
    const button = scene.add.text(x, y, text, {
      fontFamily: this.defaultFont,
      fontSize,
      color: textColor,
      backgroundColor: bgColor,
      padding: { left: 15, right: 15, top: 10, bottom: 10 }
    }).setOrigin(0.5);

    button.setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (SettingsManager.get(scene).audio) scene.switchSound?.play();
        callback.call(scene);
      })
      .on("pointerover", () => button.setStyle({ backgroundColor: "#555" }))
      .on("pointerout", () => button.setStyle({ backgroundColor: bgColor }));

    return button;
  }

  static createText(scene, x, y, content, fontSize = "24px", align = "center") {
    return scene.add.text(x, y, content, {
      fontFamily: this.defaultFont,
      fontSize,
      color: "#ffffff",
      align,
      wordWrap: { width: scene.scale.width * 0.8 }
    }).setOrigin(0.5);
  }

  static createTitle(scene, x, y, content) {
    return scene.add.text(x, y, content, {
      fontFamily: this.defaultFont,
      fontSize: "72px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);
  }

  static createInputField(scene, x, y, placeholder, style = {}, options = {}) {
    const text = scene.add.text(x, y, placeholder, Object.assign({
      fontFamily: this.defaultFont,
      fontSize: '28px',
      color: '#ccc',
      backgroundColor: '#222',
      padding: { x: 12, y: 8 }
    }, style)).setOrigin(0.5).setInteractive();

    text._placeholder = placeholder;
    text._realValue = "";
    text.inputing = false;
    text._inputType = options.type || 'text';
    text._maxLength = Number.isFinite(options.maxLength) ? options.maxLength : null;

    text.getValue = () => text._realValue || "";

    text.on('pointerdown', () => {
      UIManager.focusInputField(text);
    });

    return text;
  }

  static focusInputField(field) {
    if (!field) return;
    if (field.text === field._placeholder) field._realValue = "";
    field.inputing = true;
    field.setStyle({ color: '#ffffff' });
    field.setText(field._realValue);
  }

  static blurInputField(field) {
    if (!field) return;
    field.inputing = false;
    if (!field._realValue) {
      field.setText(field._placeholder);
      field.setStyle({ color: '#ccc' });
    }
  }

  static bindInputFields(scene, fields, options = {}) {
    if (!scene || !scene.input || !Array.isArray(fields)) return;
    const fieldList = fields.filter(Boolean);
    if (!fieldList.length) return;

    const allowTab = options.allowTab ?? true;
    const loop = options.loop ?? false;

    const handleKey = (event) => {
      const active = fieldList.find(f => f.inputing);
      if (!active) return;

      const key = event.key;
      event.stopPropagation();

      if (key === 'Enter' || (allowTab && key === 'Tab')) {
        event.preventDefault?.();
        const idx = fieldList.indexOf(active);
        UIManager.blurInputField(active);
        const next = fieldList[idx + 1] || (loop ? fieldList[0] : null);
        if (next) {
          UIManager.focusInputField(next);
        }
        return;
      }

      if (key === 'Escape') {
        UIManager.blurInputField(active);
        return;
      }

      if (key === 'Backspace') {
        active._realValue = active._realValue.slice(0, -1);
        active.setText(active._realValue || '');
        return;
      }

      if (key.length !== 1) return;

      if (active._maxLength && active._realValue.length >= active._maxLength) return;

      const isDigit = /^[0-9]$/.test(key);
      if (active._inputType === 'int') {
        if (isDigit) active._realValue += key;
      } else if (active._inputType === 'float') {
        if (isDigit) active._realValue += key;
        else if (key === '.' && !active._realValue.includes('.')) active._realValue += '.';
      } else {
        active._realValue += key;
      }

      active.setText(active._realValue || '');
    };

    const handlePointerDown = (_pointer, gameObjects) => {
      const clickedField = fieldList.find(f => gameObjects.includes(f));
      if (clickedField) return;
      fieldList.forEach(f => UIManager.blurInputField(f));
    };

    scene.input.keyboard.on('keydown', handleKey);
    scene.input.on('pointerdown', handlePointerDown);

    scene.events.once('shutdown', () => {
      scene.input.keyboard.off('keydown', handleKey);
      scene.input.off('pointerdown', handlePointerDown);
    });
    scene.events.once('destroy', () => {
      scene.input.keyboard.off('keydown', handleKey);
      scene.input.off('pointerdown', handlePointerDown);
    });
  }

  static createSlideBar(scene, options = {}) {
    const {
      x,
      y,
      min = 1,
      max = 10,
      step = 1,
      value = min,
      width = 360,
      label = '',
      showTickLabels = true,
      onChange
    } = options;

    const safeStep = Math.max(1, Math.floor(step));
    const steps = Math.floor((max - min) / safeStep) + 1;
    const trackWidth = width;
    const trackHeight = 6;
    const tickColor = 0xaaaaaa;
    const trackColor = 0x555555;
    const knobColor = 0xe0b854;
    const stepSize = steps > 1 ? trackWidth / (steps - 1) : trackWidth;
    const leftX = x - trackWidth / 2;
    const rightX = x + trackWidth / 2;

    const container = scene.add.container(0, 0);

    const labelText = scene.add.text(x, y - 28, label, {
      fontFamily: this.defaultFont,
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const track = scene.add.rectangle(x, y, trackWidth, trackHeight, trackColor).setOrigin(0.5);
    track.setInteractive({ useHandCursor: true });

    const ticks = [];
    const tickLabels = [];
    for (let i = 0; i < steps; i += 1) {
      const tx = leftX + i * stepSize;
      const height = (i === 0 || i === steps - 1) ? 14 : 8;
      const tick = scene.add.rectangle(tx, y, 2, height, tickColor).setOrigin(0.5);
      ticks.push(tick);
      if (showTickLabels) {
        const valueLabel = min + i * safeStep;
        const tLabel = scene.add.text(tx, y + 18, `${valueLabel}`, {
          fontFamily: this.defaultFont,
          fontSize: '12px',
          color: '#cfcfcf'
        }).setOrigin(0.5, 0);
        tickLabels.push(tLabel);
      }
    }

    const knob = scene.add.circle(x, y, 10, knobColor).setStrokeStyle(2, 0x222222);
    knob.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(knob);

    container.add([labelText, track, ...ticks, ...tickLabels, knob]);

    const updateValue = (nextValue, emit = true) => {
      const clamped = Phaser.Math.Clamp(nextValue, min, max);
      const index = Math.round((clamped - min) / safeStep);
      const finalValue = min + index * safeStep;
      const nextX = leftX + index * stepSize;
      knob.x = nextX;
      if (label) labelText.setText(`${label} x${finalValue}`);
      if (emit && finalValue !== container._value) {
        if (SettingsManager.get(scene).audio) scene.switchSound?.play();
        onChange?.(finalValue);
      }
      container._value = finalValue;
    };

    const updateByX = (posX) => {
      const clamped = Phaser.Math.Clamp(posX, leftX, rightX);
      const index = Math.round((clamped - leftX) / stepSize);
      updateValue(min + index * safeStep, true);
    };

    track.on('pointerdown', (pointer) => updateByX(pointer.x));
    knob.on('drag', (_pointer, dragX) => updateByX(dragX));

    container.setValue = (nextValue) => updateValue(nextValue, false);
    container.getValue = () => container._value ?? min;

    updateValue(value, false);

    return container;
  }
}

export const UIFactory = UIManager;

// -----------------------
// Color utilities
// -----------------------
function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return getRelativeLuminance(r, g, b);
}

function hexToRgb(hex) {
  let safe = (hex || '#000000').replace('#', '');
  if (safe.length === 3) safe = safe.split('').map(c => c + c).join('');
  const r = parseInt(safe.substring(0, 2), 16);
  const g = parseInt(safe.substring(2, 4), 16);
  const b = parseInt(safe.substring(4, 6), 16);
  return { r, g, b };
}

function getRelativeLuminance(r, g, b) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(l1, l2) {
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

export function getOptimalTextColor(bgHex) {
  const lum = getLuminance(bgHex);
  const light = { r: 246, g: 243, b: 236, hex: '#F6F3EC' };
  const dark = { r: 28, g: 28, b: 28, hex: '#1C1C1C' };
  const contrastLight = contrastRatio(lum, getRelativeLuminance(light.r, light.g, light.b));
  const contrastDark = contrastRatio(lum, getRelativeLuminance(dark.r, dark.g, dark.b));
  return contrastLight >= contrastDark ? light.hex : dark.hex;
}
