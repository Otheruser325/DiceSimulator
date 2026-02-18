import { getOptimalTextColor } from './UIManager.js';

export class GlobalBackground {
  static init(backgroundsArray, settingsManager) {
    this._backgroundsArray = backgroundsArray || [];
    this._settingsManager = settingsManager;
  }

  static applyBackground(scene) {
    if (!scene) return;

    const selected = this._getSelected(scene);
    const bg = (this._backgroundsArray || [])[selected] || { colorCode: "#000000" };
    const textColor = getOptimalTextColor(bg.colorCode);

    scene.cameras.main.setBackgroundColor(bg.colorCode);

    if (scene.uiElements) {
      const applyColor = (el) => {
        if (!el) return;
        if (el?.setStyle) el.setStyle({ color: textColor });
        if (el?.list && Array.isArray(el.list)) {
          el.list.forEach(child => applyColor(child));
        }
      };
      scene.uiElements.forEach(el => applyColor(el));
    }
  }

  static select(index, scene) {
    if (this._settingsManager && scene) {
      this._settingsManager.set(scene, 'bgIndex', index);
    }
    this.applyBackground(scene);
  }

  static getBackgroundOptions() {
    return this._backgroundsArray || [];
  }

  static _getSelected(scene) {
    if (this._settingsManager && scene) {
      const settings = this._settingsManager.get(scene);
      if (typeof settings.bgIndex === 'number') return settings.bgIndex;
    }
    return 0;
  }
}
