import { UIFactory, getOptimalTextColor } from '../utils/UIManager.js';
import { RegularDice, CustomDice, MAX_CUSTOM_DICE, getProbabilityTable } from '../utils/DiceManager.js';
import { showAlert } from '../utils/AlertManager.js';
import SettingsManager from '../utils/SettingsManager.js';

export default class DiceSimScene extends Phaser.Scene {
    constructor() { super({ key: 'DiceSimScene' }); }
    create() {
        this.diceSound = this.sound.add('diceSound');
        this.switchSound = this.sound.add('switchSound');

        const centerX = this.scale.width / 2;
        this.multiRollNormalCount = this.clampMultiRollCount(this.registry.get('multiRollNormalCount'));
        this.multiRollCustomCount = this.clampMultiRollCount(this.registry.get('multiRollCustomCount'));
        this.calcSelection = null;
        this._tutorialSteps = null;
        this._tutorialStepIndex = 0;
        this._tutorialActive = false;
        this._tutorialOverlay = null;
        this._tutorialLock = false;

        // Tabs
        const tabSpacing = 170;
        const tabStart = centerX - tabSpacing * 1.5;
        this.tabNormal = UIFactory.createButton(this, 'Normal', tabStart, 70, () => this.setActiveTab('normal'), '24px', '#333');
        this.tabCustom = UIFactory.createButton(this, 'Custom', tabStart + tabSpacing, 70, () => this.setActiveTab('custom'), '24px', '#333');
        this.tabCalc = UIFactory.createButton(this, 'Calculate', tabStart + tabSpacing * 2, 70, () => this.setActiveTab('calc'), '24px', '#333');
        this.tabPhysics = UIFactory.createButton(this, 'Physics', tabStart + tabSpacing * 3, 70, () => this.setActiveTab('physics'), '24px', '#333');

        this.initTabButton(this.tabNormal);
        this.initTabButton(this.tabCustom);
        this.initTabButton(this.tabCalc);
        this.initTabButton(this.tabPhysics);

        // Result text
        this.resultText = this.add.text(centerX, this.scale.height - 140, '', {
            fontSize: '24px',
            fontFamily: 'Verdana',
            color: '#fff',
            align: 'center',
            wordWrap: { width: this.scale.width * 0.85 }
        })
            .setOrigin(0.5)
            .setVisible(false);
        this.tutorialText = this.add.text(centerX, this.scale.height - 90, '', { fontSize: '18px', fontFamily: 'Verdana', color: '#cfcfcf' })
            .setOrigin(0.5)
            .setVisible(false);

        // Normal tab buttons
        this.multiRollNormalSlider = UIFactory.createSlideBar(this, {
            x: centerX,
            y: 165,
            min: 1,
            max: 10,
            step: 1,
            value: this.multiRollNormalCount,
            label: 'Multi-roll',
            showTickLabels: true,
            onChange: (value) => {
                this.multiRollNormalCount = value;
                this.registry.set('multiRollNormalCount', value);
            }
        });
        this.rollRandomButton = UIFactory.createButton(this, 'Roll Random Dice', centerX, 235, () => this.rollRandomDice());
        this.rollSelectedButton = UIFactory.createButton(this, 'Roll Selected Dice', centerX, 315, () => this.rollSelectedDice());
        this.switchDiceButton = UIFactory.createButton(this, 'Switch Dice Type', centerX, 395, () => this.switchDiceType());

        // Custom tab buttons
        this.multiRollCustomSlider = UIFactory.createSlideBar(this, {
            x: centerX,
            y: 150,
            min: 1,
            max: 10,
            step: 1,
            value: this.multiRollCustomCount,
            label: 'Multi-roll',
            showTickLabels: true,
            onChange: (value) => {
                this.multiRollCustomCount = value;
                this.registry.set('multiRollCustomCount', value);
            }
        });
        this.customCountText = UIFactory.createText(this, centerX, 205, '', '22px');
        this.rollCustomDiceButton = UIFactory.createButton(this, 'Roll Custom Dice', centerX, 265, () => this.rollCustomDice());
        this.rollRandomCustomDiceButton = UIFactory.createButton(this, 'Roll Random Custom Dice', centerX, 345, () => this.rollRandomCustomDice());
        this.switchCustomDiceButton = UIFactory.createButton(this, 'Switch Custom Dice Type', centerX, 425, () => this.switchCustomDiceType());
        this.deleteCustomDiceButton = UIFactory.createButton(this, 'Remove Selected Custom Dice', centerX, 505, () => this.requestDeleteCustomDice(), '24px', '#7a2d2d');
        this.createDiceButton = UIFactory.createButton(this, 'Build a Dice!', centerX, 585, () => this.scene.start('CreateDiceScene'));

        this.customEmptyText = UIFactory.createText(
            this,
            centerX,
            330,
            "You don't have any custom dice!\n\nTry creating one now!",
            '26px'
        );

        // Calculate tab UI
        this.calcTitleText = UIFactory.createText(this, centerX, 140, 'Probability Calculator', '30px');
        this.calcSelectedText = UIFactory.createText(this, centerX, 185, 'Select a die to get started.', '22px');
        this.calcSelectButton = UIFactory.createButton(this, 'Choose Dice', centerX, 240, () => this.showCalcSelectModal(), '24px', '#333');
        this.calcShowButton = UIFactory.createButton(this, 'Show Probability!', centerX, 300, () => this.showCalcResults(), '24px', '#2d7a2d');

        this.calcResultViewTop = 350;
        this.calcResultViewBottom = this.scale.height - 70;
        this.calcResultViewHeight = this.calcResultViewBottom - this.calcResultViewTop;

        this.calcResultText = this.add.text(centerX, this.calcResultViewTop, 'No results yet.', {
            fontSize: '18px',
            fontFamily: 'Verdana',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: this.scale.width * 0.85 }
        }).setOrigin(0.5, 0);

        this.calcResultMaskRect = this.add.rectangle(
            centerX,
            this.calcResultViewTop,
            this.scale.width * 0.85,
            this.calcResultViewHeight,
            0x000000,
            0
        ).setOrigin(0.5, 0);
        this.calcResultMask = this.calcResultMaskRect.createGeometryMask();
        this.calcResultText.setMask(this.calcResultMask);
        this.updateCalcResultScroll();

        this.physicsText = UIFactory.createText(this, centerX, 320, 'Coming soon...', '28px');

        // Back button
        this.backButton = UIFactory.createButton(this, 'Back', 60, 20, () => this.requestExitSimulator(), '30px', '#f00').setOrigin(0,0);

        // ESC to back out (with confirmation)
        this.input.keyboard.on('keydown-ESC', (event) => {
            event.stopPropagation();
            if (SettingsManager.get(this).audio) this.switchSound.play();
            if (this._tutorialOverlay) {
                return;
            }
            if (this.customSwitchContainer) {
                this.closeCustomSwitchModal();
                return;
            }
            if (this.calcSelectContainer) {
                this.closeCalcSelectModal();
                return;
            }
            if (this.confirmContainer) {
                this.closeConfirmDialog();
                return;
            }
            this.requestExitSimulator();
        });

        this.normalUI = [this.multiRollNormalSlider, this.rollRandomButton, this.rollSelectedButton, this.switchDiceButton];
        this.customHeaderUI = [this.multiRollCustomSlider, this.customCountText];
        this.customFullUI = [this.rollCustomDiceButton, this.rollRandomCustomDiceButton, this.switchCustomDiceButton, this.deleteCustomDiceButton];
        this.customEmptyUI = [this.customEmptyText];
        this.customBaseUI = [this.createDiceButton];
        this.calcUI = [
            this.calcTitleText,
            this.calcSelectedText,
            this.calcSelectButton,
            this.calcShowButton,
            this.calcResultText,
            this.calcResultMaskRect
        ];
        this.physicsUI = [this.physicsText];
        this.commonUI = [this.tabNormal, this.tabCustom, this.tabCalc, this.tabPhysics, this.resultText, this.tutorialText, this.backButton];

        this.uiElements = [
            ...this.commonUI,
            ...this.normalUI,
            ...this.customHeaderUI,
            ...this.customFullUI,
            ...this.customEmptyUI,
            ...this.customBaseUI,
            ...this.calcUI,
            ...this.physicsUI
        ];

        // Apply current background
        this.game.bgManager.applyBackground(this);

        const desiredTab = this.registry.get('diceSimActiveTab') || 'normal';
        this.setActiveTab(desiredTab);

        this.bindKeyControls();
        this.updateCalcSelectionText();
        this.startGuidedTutorial();
        this.events.once('shutdown', () => this.closeTutorialOverlay());

        this._calcWheel = (_pointer, _objects, _dx, dy) => {
            if (this.activeTab !== 'calc') return;
            if (this.isModalOpen()) return;
            if (!this.calcResultScrollable) return;
            const nextY = this.calcResultText.y - dy * 0.5;
            this.calcResultText.y = Phaser.Math.Clamp(nextY, this.calcResultMinY, this.calcResultMaxY);
        };
        this.input.on('wheel', this._calcWheel);

        if (this.registry.get('diceSimShowSuccess')) {
            this.registry.set('diceSimShowSuccess', false);
            this.updateCustomTab();
            showAlert(this, 'Success! Dice created.', 'success');
        }
    }

    initTabButton(btn) {
        btn.off('pointerover');
        btn.off('pointerout');
        btn.on('pointerover', () => {
            if (!btn._isActive) btn.setStyle({ backgroundColor: '#555' });
        });
        btn.on('pointerout', () => {
            btn.setStyle({ backgroundColor: btn._baseBg || '#333' });
        });
    }

    setActiveTab(tab, options = {}) {
        if (this._tutorialLock && !options.force) return;

        this.activeTab = tab;
        this.registry.set('diceSimActiveTab', tab);

        this.setGroupVisible(this.normalUI, false);
        this.setGroupVisible(this.customHeaderUI, false);
        this.setGroupVisible(this.customFullUI, false);
        this.setGroupVisible(this.customEmptyUI, false);
        this.setGroupVisible(this.customBaseUI, false);
        this.setGroupVisible(this.calcUI, false);
        this.setGroupVisible(this.physicsUI, false);

        if (tab === 'normal') {
            this.setGroupVisible(this.normalUI, true);
            this.resultText.setVisible(true);
        } else if (tab === 'custom') {
            this.updateCustomTab();
            this.resultText.setVisible(true);
        } else if (tab === 'calc') {
            this.setGroupVisible(this.calcUI, true);
            this.resultText.setVisible(false);
            this.updateCalcSelectionText();
            this.updateCalcResultScroll();
        } else if (tab === 'physics') {
            this.setGroupVisible(this.physicsUI, true);
            this.resultText.setVisible(false);
        }

        this.updateTabStyles();
    }

    updateTabStyles() {
        const activeBg = '#e0b854';
        const inactiveBg = '#333';
        const activeText = '#1b1b1b';
        const inactiveText = '#ffffff';

        this.setTabStyle(this.tabNormal, this.activeTab === 'normal', activeBg, inactiveBg, activeText, inactiveText);
        this.setTabStyle(this.tabCustom, this.activeTab === 'custom', activeBg, inactiveBg, activeText, inactiveText);
        this.setTabStyle(this.tabCalc, this.activeTab === 'calc', activeBg, inactiveBg, activeText, inactiveText);
        this.setTabStyle(this.tabPhysics, this.activeTab === 'physics', activeBg, inactiveBg, activeText, inactiveText);
    }

    setTabStyle(btn, isActive, activeBg, inactiveBg, activeText, inactiveText) {
        btn._isActive = isActive;
        btn._baseBg = isActive ? activeBg : inactiveBg;
        btn.setStyle({
            backgroundColor: btn._baseBg,
            color: isActive ? activeText : inactiveText
        });
    }

    updateCustomTab() {
        const arr = this.getCustomDiceArray();
        const hasCustom = arr.length > 0;

        this.customCountText.setText(`Custom dice: ${arr.length}/${MAX_CUSTOM_DICE}`);
        this.setGroupVisible(this.customHeaderUI, true);
        this.multiRollCustomSlider.setVisible(hasCustom);
        this.setGroupVisible(this.customBaseUI, true);
        this.setGroupVisible(this.customFullUI, hasCustom);
        this.setGroupVisible(this.customEmptyUI, !hasCustom);
        if (arr.length > 10) {
            this.maybeShowTutorial('diceSimTutListicle', 'Switch Custom Dice is now shown as a listicle modal for easier browsing.');
        }
    }

    hasSeenTutorial(flagKey) {
        const settings = SettingsManager.get(this);
        return !!(settings.tutorials && settings.tutorials[flagKey]);
    }

    maybeShowTutorial(flagKey, message, options = {}) {
        if (this._tutorialActive) return;
        const settings = SettingsManager.get(this);
        const seen = settings.tutorials && settings.tutorials[flagKey];
        if (seen) return;
        const next = { ...(settings.tutorials || {}), [flagKey]: true };
        SettingsManager.set(this, 'tutorials', next);
        this.tutorialText.setText(message).setVisible(true);
        if (this._tutorialTimer) this._tutorialTimer.remove();
        if (options.lock) this._tutorialLock = true;
        const duration = Number.isFinite(options.duration) ? options.duration : 6000;
        this._tutorialTimer = this.time.delayedCall(duration, () => {
            this.tutorialText.setVisible(false);
            if (options.lock) this._tutorialLock = false;
        });
    }

    startGuidedTutorial() {
        if (this.hasSeenTutorial('diceSimGuideV2')) return;
        this._tutorialSteps = this.getGuidedTutorialSteps();
        if (!this._tutorialSteps.length) return;
        this._tutorialStepIndex = 0;
        this._tutorialActive = true;
        this._tutorialLock = true;
        this.tutorialText.setVisible(false);
        this.showTutorialStep(0);
    }

    finishGuidedTutorial() {
        this.closeTutorialOverlay();
        this._tutorialActive = false;
        this._tutorialLock = false;
        const settings = SettingsManager.get(this);
        const next = { ...(settings.tutorials || {}), diceSimGuideV2: true };
        SettingsManager.set(this, 'tutorials', next);
    }

    advanceGuidedTutorial() {
        if (!this._tutorialSteps) return;
        const nextIndex = this._tutorialStepIndex + 1;
        if (nextIndex >= this._tutorialSteps.length) {
            this.finishGuidedTutorial();
            return;
        }
        this.showTutorialStep(nextIndex);
    }

    showTutorialStep(index) {
        if (!this._tutorialSteps || !this._tutorialSteps[index]) {
            this.finishGuidedTutorial();
            return;
        }
        this._tutorialStepIndex = index;
        const step = this._tutorialSteps[index];
        this.setActiveTab(step.tab, { force: true });
        this.buildTutorialOverlay(step);
    }

    getGuidedTutorialSteps() {
        const normalTargets = [
            { ref: this.tabNormal, direction: 'down' },
            { ref: this.multiRollNormalSlider, direction: 'down' },
            { ref: this.rollRandomButton, direction: 'down' },
            { ref: this.switchDiceButton, direction: 'down' }
        ];

        const customTargets = [
            { ref: this.tabCustom, direction: 'down' },
            { ref: this.createDiceButton, direction: 'down' }
        ];
        if (this.hasCustomDice()) {
            customTargets.push({ ref: this.rollCustomDiceButton, direction: 'down' });
        } else {
            customTargets.push({ ref: this.customEmptyText, direction: 'down' });
        }

        const calcTargets = [
            { ref: this.tabCalc, direction: 'down' },
            { ref: this.calcSelectButton, direction: 'down' },
            { ref: this.calcShowButton, direction: 'down' }
        ];

        const physicsTargets = [
            { ref: this.tabPhysics, direction: 'down' },
            { ref: this.physicsText, direction: 'down' }
        ];

        return [
            {
                tab: 'normal',
                title: 'Normal Tab',
                body: 'Start here. Roll random or selected dice, switch types, and set multi-roll with the ruler.',
                targets: normalTargets
            },
            {
                tab: 'custom',
                title: 'Custom Tab',
                body: 'Build your own dice, then roll, switch, or remove them when needed.',
                targets: customTargets
            },
            {
                tab: 'calc',
                title: 'Calculate Tab',
                body: 'Choose a die and show its probability table. Press C to choose dice and P to show results.',
                targets: calcTargets
            },
            {
                tab: 'physics',
                title: 'Physics Tab',
                body: 'Physics simulation features will live here (WIP).',
                targets: physicsTargets
            }
        ];
    }

    getCurrentTextColor() {
        const settings = SettingsManager.get(this);
        const backgrounds = this.registry.get('backgroundsArray') ?? [];
        const bg = backgrounds[settings.bgIndex] || { colorCode: '#000000' };
        return getOptimalTextColor(bg.colorCode);
    }

    buildTutorialOverlay(step) {
        this.closeTutorialOverlay();

        const cam = this.cameras.main;
        const cx = cam.centerX;
        const cy = cam.centerY;
        const panelWidth = Math.min(720, cam.width - 60);
        const panelHeight = 180;
        const panelY = cam.height - panelHeight / 2 - 20;
        const textColor = this.getCurrentTextColor();

        const blocker = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.55)
            .setInteractive({ swallowPointer: true });

        const panel = this.add.rectangle(cx, panelY, panelWidth, panelHeight, 0x1e1e1e)
            .setStrokeStyle(3, 0xffcc66);

        const title = this.add.text(cx, panelY - 56, step.title, {
            fontFamily: 'Verdana',
            fontSize: '24px',
            color: textColor,
            align: 'center'
        }).setOrigin(0.5);

        const body = this.add.text(cx, panelY - 6, step.body, {
            fontFamily: 'Verdana',
            fontSize: '18px',
            color: textColor,
            align: 'center',
            wordWrap: { width: panelWidth - 40 }
        }).setOrigin(0.5);

        const buttonLabel = 'Got it';
        const gotItBtn = UIFactory.createButton(
            this,
            buttonLabel,
            cx,
            panelY + 60,
            () => this.advanceGuidedTutorial(),
            '22px',
            '#2d7a2d',
            textColor
        );

        const arrows = [];
        (step.targets || []).forEach((target) => {
            const arrow = this.createTutorialArrow(target.ref, target.direction);
            if (arrow) arrows.push(arrow);
        });
        this._tutorialArrows = arrows;

        this._tutorialOverlay = this.add.container(0, 0, [
            blocker,
            ...arrows,
            panel,
            title,
            body,
            gotItBtn
        ]);
        this._tutorialOverlay.setDepth(12000);
    }

    createTutorialArrow(target, direction = 'down', offset = 28) {
        if (!target || typeof target.getBounds !== 'function') return null;
        if (target.visible === false) return null;
        const bounds = target.getBounds();
        const size = 12;
        let x = bounds.centerX;
        let y = bounds.centerY;
        let rotation = 0;

        if (direction === 'down') {
            x = bounds.centerX;
            y = bounds.top - offset;
            rotation = 0;
        } else if (direction === 'up') {
            x = bounds.centerX;
            y = bounds.bottom + offset;
            rotation = Math.PI;
        } else if (direction === 'left') {
            x = bounds.right + offset;
            y = bounds.centerY;
            rotation = -Math.PI / 2;
        } else if (direction === 'right') {
            x = bounds.left - offset;
            y = bounds.centerY;
            rotation = Math.PI / 2;
        }

        const arrow = this.add.triangle(x, y, 0, size, -size, -size, size, -size, 0xffcc66);
        arrow.setRotation(rotation);

        const distance = 8;
        let tweenConfig = null;
        if (direction === 'down') {
            tweenConfig = { y: y + distance };
        } else if (direction === 'up') {
            tweenConfig = { y: y - distance };
        } else if (direction === 'left') {
            tweenConfig = { x: x - distance };
        } else if (direction === 'right') {
            tweenConfig = { x: x + distance };
        }
        if (tweenConfig) {
            arrow._tutorialTween = this.tweens.add({
                targets: arrow,
                ...tweenConfig,
                duration: 650,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        return arrow;
    }

    closeTutorialOverlay() {
        if (this._tutorialArrows) {
            this._tutorialArrows.forEach((arrow) => {
                if (arrow) this.tweens.killTweensOf(arrow);
            });
            this._tutorialArrows = null;
        }
        if (this._tutorialOverlay) {
            this._tutorialOverlay.destroy(true);
            this._tutorialOverlay = null;
        }
    }

    setGroupVisible(group, visible) {
        group.forEach(el => el.setVisible(visible));
    }

    getCustomDiceArray() {
        return this.registry.get('customDiceArray') ?? [];
    }

    hasCustomDice() {
        return this.getCustomDiceArray().length > 0;
    }

    clampMultiRollCount(value) {
        const num = Number(value);
        if (!isFinite(num)) return 1;
        return Phaser.Math.Clamp(Math.round(num), 1, 10);
    }

    setCalcSelection(kind, dice) {
        this.calcSelection = { kind, dice };
        this.updateCalcSelectionText();
        this.clearCalcResults();
    }

    updateCalcSelectionText() {
        if (!this.calcSelectedText) return;
        if (!this.calcSelection || !this.calcSelection.dice) {
            this.calcSelectedText.setText('Select a die to get started.');
            return;
        }
        const { kind, dice } = this.calcSelection;
        if (kind === 'custom') {
            this.calcSelectedText.setText(`Selected: Custom ${dice.type} (sides: ${dice.sides}, luck: ${dice.luckFactor})`);
        } else {
            this.calcSelectedText.setText(`Selected: Normal ${dice.type} (sides: ${dice.sides})`);
        }
    }

    clearCalcResults() {
        if (!this.calcResultText) return;
        this.calcResultText.setText('No results yet.');
        this.calcResultText.y = this.calcResultViewTop;
        this.updateCalcResultScroll();
    }

    updateCalcResultScroll() {
        if (!this.calcResultText) return;
        this.calcResultScrollable = Math.max(0, this.calcResultText.height - this.calcResultViewHeight);
        this.calcResultMinY = this.calcResultViewTop - this.calcResultScrollable;
        this.calcResultMaxY = this.calcResultViewTop;
        this.calcResultText.y = Phaser.Math.Clamp(this.calcResultText.y, this.calcResultMinY, this.calcResultMaxY);
    }

    getLuckDescription(mode, rolls) {
        if (mode === 'neutral') return 'Luck: neutral (single roll)';
        if (mode === 'high') return `Luck: high (best of ${rolls} rolls)`;
        return `Luck: low (worst of ${rolls} rolls)`;
    }

    formatFraction(numerator, denominator) {
        const reduced = this.reduceFraction(numerator, denominator);
        return `${reduced.numerator}/${reduced.denominator}`;
    }

    reduceFraction(numerator, denominator) {
        if (denominator === 0n) return { numerator, denominator };
        const g = this.gcdBigInt(numerator < 0n ? -numerator : numerator, denominator < 0n ? -denominator : denominator);
        return { numerator: numerator / g, denominator: denominator / g };
    }

    gcdBigInt(a, b) {
        let x = a;
        let y = b;
        while (y !== 0n) {
            const t = x % y;
            x = y;
            y = t;
        }
        return x === 0n ? 1n : x;
    }

    showCalcResults() {
        if (!this.calcSelection || !this.calcSelection.dice) {
            showAlert(this, 'Select a die first!', 'warning');
            return;
        }

        const { kind, dice } = this.calcSelection;
        const table = getProbabilityTable(dice.sides, kind === 'custom' ? dice.luckFactor : 1);
        if (!table) {
            showAlert(this, 'Invalid dice data.', 'error');
            return;
        }

        let expectedValue = 0;
        let expectedNumerator = 0n;
        table.outcomes.forEach((outcome) => {
            expectedValue += outcome.value * outcome.probability;
            expectedNumerator += BigInt(outcome.value) * outcome.numerator;
        });

        const header = kind === 'custom'
            ? `Custom ${dice.type} (sides: ${dice.sides}, luck: ${dice.luckFactor})`
            : `Normal ${dice.type} (sides: ${dice.sides})`;

        const lines = [
            header,
            this.getLuckDescription(table.mode, table.rolls),
            `Average roll: ${expectedValue.toFixed(3)} (${this.formatFraction(expectedNumerator, table.denominator)})`,
            '',
            'Outcome: fraction (percent)'
        ];

        table.outcomes.forEach((outcome) => {
            const fraction = this.formatFraction(outcome.numerator, outcome.denominator);
            const percent = (outcome.probability * 100).toFixed(2);
            lines.push(`${outcome.value}: ${fraction} (${percent}%)`);
        });

        this.calcResultText.setText(lines.join('\n'));
        this.calcResultText.y = this.calcResultViewTop;
        this.updateCalcResultScroll();
    }

    // ----- Simulator actions -----
    rollRandomDice() {
        const diceArray = this.registry.get('diceArray') ?? [];
        if (!diceArray || diceArray.length === 0) {
            showAlert(this, 'No dice available!', 'warning');
            return;
        }
        if (SettingsManager.get(this).audio) this.sound.play('diceSound');
        const count = this.multiRollNormalCount || 1;
        if (count <= 1) {
            const dice = diceArray[Phaser.Math.Between(0, diceArray.length - 1)];
            const result = RegularDice.roll(dice.sides);
            this.resultText.setText(`Rolled ${dice.type}: ${result}`).setVisible(true);
            return;
        }
        const rolls = [];
        let total = 0;
        for (let i = 0; i < count; i += 1) {
            const dice = diceArray[Phaser.Math.Between(0, diceArray.length - 1)];
            const result = RegularDice.roll(dice.sides);
            total += result;
            rolls.push(`${dice.type}:${result}`);
        }
        this.resultText.setText(`Rolled ${count} random dice: ${rolls.join(', ')} (Total: ${total})`).setVisible(true);
    }

    rollSelectedDice() {
        const diceArray = this.registry.get('diceArray') ?? [];
        if (!diceArray || diceArray.length === 0) {
            showAlert(this, 'No dice available!', 'warning');
            return;
        }
        if (SettingsManager.get(this).audio) this.sound.play('diceSound');
        const diceIndex = this.registry.get('selectedDiceIndex') || 0;
        const dice = diceArray[diceIndex];
        const count = this.multiRollNormalCount || 1;
        if (count <= 1) {
            const result = RegularDice.roll(dice.sides);
            this.resultText.setText(`Rolled ${dice.type}: ${result}`).setVisible(true);
            return;
        }
        const rolls = [];
        let total = 0;
        for (let i = 0; i < count; i += 1) {
            const result = RegularDice.roll(dice.sides);
            total += result;
            rolls.push(result);
        }
        this.resultText.setText(`Rolled ${count}x ${dice.type}: ${rolls.join(', ')} (Total: ${total})`).setVisible(true);
    }

    switchDiceType() {
        const diceArray = this.registry.get('diceArray') ?? [];
        if (!diceArray || diceArray.length === 0) {
            showAlert(this, 'No dice available!', 'warning');
            return;
        }
        if (SettingsManager.get(this).audio) this.sound.play('switchSound');
        const nextIndex = ((this.registry.get('selectedDiceIndex') || 0) + 1) % diceArray.length;
        this.registry.set('selectedDiceIndex', nextIndex);
        this.resultText.setText(`Selected ${diceArray[nextIndex].type}`).setVisible(true);
    }

    rollCustomDice() {
        const arr = this.getCustomDiceArray();
        if (!arr || arr.length === 0) {
            showAlert(this, 'No custom dice available!', 'warning');
            return;
        }
        if (SettingsManager.get(this).audio) this.sound.play('diceSound');
        const diceIndex = this.registry.get('selectedCustomDiceIndex') || 0;
        const dice = arr[diceIndex];
        const count = this.multiRollCustomCount || 1;
        if (count <= 1) {
            const result = CustomDice.roll(dice.sides, dice.luckFactor);
            this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`).setVisible(true);
            return;
        }
        const rolls = [];
        let total = 0;
        for (let i = 0; i < count; i += 1) {
            const result = CustomDice.roll(dice.sides, dice.luckFactor);
            total += result;
            rolls.push(result);
        }
        this.resultText.setText(`Rolled ${count}x Custom ${dice.type}: ${rolls.join(', ')} (Total: ${total})`).setVisible(true);
    }

    rollRandomCustomDice() {
        const arr = this.getCustomDiceArray();
        if (!arr || arr.length === 0) {
            showAlert(this, 'No custom dice available!', 'warning');
            return;
        }
        if (SettingsManager.get(this).audio) this.sound.play('diceSound');
        const count = this.multiRollCustomCount || 1;
        if (count <= 1) {
            const idx = Phaser.Math.Between(0, arr.length - 1);
            const dice = arr[idx];
            const result = CustomDice.roll(dice.sides, dice.luckFactor);
            this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`).setVisible(true);
            return;
        }
        const rolls = [];
        let total = 0;
        for (let i = 0; i < count; i += 1) {
            const idx = Phaser.Math.Between(0, arr.length - 1);
            const dice = arr[idx];
            const result = CustomDice.roll(dice.sides, dice.luckFactor);
            total += result;
            rolls.push(`${dice.type}:${result}`);
        }
        this.resultText.setText(`Rolled ${count} random custom dice: ${rolls.join(', ')} (Total: ${total})`).setVisible(true);
    }

    switchCustomDiceType() {
        const arr = this.getCustomDiceArray();
        if (!arr || arr.length === 0) {
            showAlert(this, 'No custom dice available!', 'warning');
            return;
        }
        if (arr.length > 10) {
            this.showCustomSwitchModal();
            return;
        }
        if (SettingsManager.get(this).audio) this.sound.play('switchSound');
        const nextIndex = ((this.registry.get('selectedCustomDiceIndex') || 0) + 1) % arr.length;
        this.registry.set('selectedCustomDiceIndex', nextIndex);
        this.resultText.setText(`Selected ${arr[nextIndex].type}`).setVisible(true);
    }

    requestDeleteCustomDice() {
        const arr = this.getCustomDiceArray();
        if (!arr || arr.length === 0) {
            showAlert(this, 'No custom dice to remove!', 'warning');
            return;
        }

        this.showConfirmDialog(
            'Remove selected custom dice?',
            () => this.deleteSelectedCustomDice()
        );
    }

    deleteSelectedCustomDice() {
        const arr = this.getCustomDiceArray();
        if (!arr || arr.length === 0) {
            showAlert(this, 'No custom dice to remove!', 'warning');
            return;
        }
        const idx = this.registry.get('selectedCustomDiceIndex') || 0;
        arr.splice(idx, 1);
        const saved = CustomDice.save(arr);
        this.registry.set('customDiceArray', saved);
        const nextIndex = saved.length ? Math.min(idx, saved.length - 1) : 0;
        this.registry.set('selectedCustomDiceIndex', nextIndex);
        this.updateCustomTab();
        this.resultText.setText(saved.length ? `Selected ${saved[nextIndex].type}` : '');
        if (SettingsManager.get(this).audio) this.sound.play('switchSound');
    }

    requestExitSimulator() {
        this.showConfirmDialog(
            'Leave the simulator?',
            () => this.scene.start('MainMenuScene')
        );
    }

    bindKeyControls() {
        this.input.keyboard.on('keydown-ONE', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            this.setActiveTab('normal');
        });
        this.input.keyboard.on('keydown-TWO', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            this.setActiveTab('custom');
        });
        this.input.keyboard.on('keydown-THREE', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            this.setActiveTab('calc');
        });
        this.input.keyboard.on('keydown-FOUR', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            this.setActiveTab('physics');
        });
        this.input.keyboard.on('keydown-ENTER', (event) => {
            if (!this._tutorialOverlay) return;
            event.stopPropagation();
            this.advanceGuidedTutorial();
        });
        this.input.keyboard.on('keydown-P', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            if (this.activeTab === 'calc') {
                this.showCalcResults();
            }
        });
        this.input.keyboard.on('keydown-C', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            if (this.activeTab === 'calc') {
                this.showCalcSelectModal();
            }
        });
        this.input.keyboard.on('keydown-R', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            if (this.activeTab === 'custom') {
                if (!this.hasCustomDice()) return;
                this.rollRandomCustomDice();
            }
            else if (this.activeTab === 'normal') this.rollRandomDice();
        });
        this.input.keyboard.on('keydown-S', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            if (this.activeTab === 'custom') {
                if (!this.hasCustomDice()) return;
                this.rollCustomDice();
            }
            else if (this.activeTab === 'normal') this.rollSelectedDice();
        });
        this.input.keyboard.on('keydown-T', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            if (this.activeTab === 'custom') {
                if (!this.hasCustomDice()) return;
                this.switchCustomDiceType();
            }
            else if (this.activeTab === 'normal') this.switchDiceType();
        });
        this.input.keyboard.on('keydown-B', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            if (this.activeTab === 'custom') this.scene.start('CreateDiceScene');
        });
        this.input.keyboard.on('keydown-DELETE', (event) => {
            event.stopPropagation();
            if (this.isModalOpen()) return;
            if (this.activeTab === 'custom') {
                if (!this.hasCustomDice()) return;
                this.requestDeleteCustomDice();
            }
        });
    }

    isModalOpen() {
        return !!(this.confirmContainer || this.customSwitchContainer || this.calcSelectContainer || this._tutorialOverlay);
    }

    showCalcSelectModal() {
        if (this.calcSelectContainer) return;

        const normalDice = this.registry.get('diceArray') ?? [];
        const customDice = this.getCustomDiceArray();
        if ((!normalDice || normalDice.length === 0) && (!customDice || customDice.length === 0)) {
            showAlert(this, 'No dice available to calculate.', 'warning');
            return;
        }

        const cam = this.cameras.main;
        const cx = cam.centerX;
        const cy = cam.centerY;
        const panelWidth = 780;
        const panelHeight = 520;

        const blocker = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.55)
            .setDepth(10000)
            .setInteractive({ swallowPointer: true });

        const panel = this.add.rectangle(cx, cy, panelWidth, panelHeight, 0x1e1e1e)
            .setStrokeStyle(3, 0x66aaff)
            .setDepth(10001);

        const title = this.add.text(cx, cy - panelHeight / 2 + 24, 'Probability Calculator', {
            fontFamily: 'Verdana',
            fontSize: '24px',
            color: '#66aaff'
        }).setOrigin(0.5).setDepth(10001);

        const subtitle = this.add.text(cx, cy - panelHeight / 2 + 52, 'Choose a normal or custom die:', {
            fontFamily: 'Verdana',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(10001);

        const tabNormal = UIFactory.createButton(this, 'Normal', cx - 110, cy - panelHeight / 2 + 88, () => renderMode('normal'), '18px', '#333');
        const tabCustom = UIFactory.createButton(this, 'Custom', cx + 110, cy - panelHeight / 2 + 88, () => renderMode('custom'), '18px', '#333');
        tabNormal.setDepth(10002);
        tabCustom.setDepth(10002);

        const listTop = cy - panelHeight / 2 + 130;
        const listHeight = 330;
        const listWidth = panelWidth - 200;
        const tabsX = cx - panelWidth / 2 + 70;
        const listX = cx + 40;

        const maskRect = this.add.rectangle(listX, listTop, listWidth, listHeight, 0x000000, 0)
            .setOrigin(0.5, 0)
            .setDepth(10001);
        const mask = maskRect.createGeometryMask();

        const listContainer = this.add.container(0, 0).setDepth(10002);
        listContainer.setMask(mask);

        const pageButtons = [];
        const perPage = 10;

        const buildButton = (dice, index, y, mode) => {
            const label = mode === 'custom'
                ? `${dice.type}  (sides: ${dice.sides}, luck: ${dice.luckFactor})`
                : `${dice.type}  (sides: ${dice.sides})`;
            const btn = UIFactory.createButton(this, label, listX, y, () => {
                this.setCalcSelection(mode, dice);
                this.closeCalcSelectModal();
            }, '20px', '#333');
            btn.setDepth(10002);
            return btn;
        };

        const renderPage = (mode, pageIndex) => {
            listContainer.removeAll(true);
            const list = mode === 'custom' ? customDice : normalDice;
            if (!list || list.length === 0) {
                const emptyLabel = mode === 'custom' ? 'No custom dice available.' : 'No normal dice available.';
                const emptyText = this.add.text(listX, listTop + 40, emptyLabel, {
                    fontFamily: 'Verdana',
                    fontSize: '20px',
                    color: '#ffffff',
                    align: 'center',
                    wordWrap: { width: listWidth - 20 }
                }).setOrigin(0.5, 0).setDepth(10002);
                listContainer.add(emptyText);
                return;
            }
            const start = pageIndex * perPage;
            const end = Math.min(list.length, start + perPage);
            const buttonHeight = 32;
            const gap = 4;
            const startY = listTop + 8;
            for (let i = start; i < end; i += 1) {
                const y = startY + (i - start) * (buttonHeight + gap);
                listContainer.add(buildButton(list[i], i, y, mode));
            }
            pageButtons.forEach((btn, idx) => {
                btn.setStyle({ backgroundColor: idx === pageIndex ? '#2d7a2d' : '#333' });
            });
        };

        const buildPages = (mode) => {
            pageButtons.forEach(btn => btn.destroy());
            pageButtons.length = 0;
            const list = mode === 'custom' ? customDice : normalDice;
            const totalPages = Math.min(10, Math.ceil(list.length / perPage));
            if (totalPages <= 1) return;
            const tabStartY = listTop + 6;
            const tabGap = 6;
            const tabHeight = Math.floor((listHeight - (totalPages - 1) * tabGap) / Math.max(1, totalPages));
            for (let i = 0; i < totalPages; i += 1) {
                const y = tabStartY + i * (tabHeight + tabGap);
                const rangeStart = i * perPage + 1;
                const rangeEnd = Math.min(list.length, (i + 1) * perPage);
                const label = `No. ${i + 1} (${rangeStart}-${rangeEnd})`;
                const btn = UIFactory.createButton(this, label, tabsX, y, () => renderPage(mode, i), '16px', '#333');
                btn.setOrigin(0.5, 0);
                btn.setDepth(10002);
                pageButtons.push(btn);
            }
            pageButtons.forEach(btn => this.calcSelectContainer.add(btn));
        };

        const renderMode = (mode) => {
            tabNormal.setStyle({ backgroundColor: mode === 'normal' ? '#2d7a2d' : '#333' });
            tabCustom.setStyle({ backgroundColor: mode === 'custom' ? '#2d7a2d' : '#333' });
            buildPages(mode);
            renderPage(mode, 0);
        };

        const closeBtn = UIFactory.createButton(this, 'Close', cx, cy + panelHeight / 2 - 28, () => this.closeCalcSelectModal(), '20px', '#7a2d2d');
        closeBtn.setDepth(10002);

        this.calcSelectContainer = this.add.container(0, 0, [
            blocker,
            panel,
            title,
            subtitle,
            tabNormal,
            tabCustom,
            maskRect,
            listContainer,
            closeBtn
        ]);
        this.calcSelectContainer.setDepth(10000);

        const initialMode = this.calcSelection?.kind === 'custom' ? 'custom' : 'normal';
        renderMode(initialMode);
    }

    closeCalcSelectModal() {
        if (this.calcSelectContainer) {
            this.calcSelectContainer.destroy(true);
            this.calcSelectContainer = null;
        }
    }

    showCustomSwitchModal() {
        if (this.customSwitchContainer) return;

        const arr = this.getCustomDiceArray();
        if (!arr || arr.length <= 10) return;

        const cam = this.cameras.main;
        const cx = cam.centerX;
        const cy = cam.centerY;
        const panelWidth = 780;
        const panelHeight = 520;

        const blocker = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.55)
            .setDepth(10000)
            .setInteractive({ swallowPointer: true });

        const panel = this.add.rectangle(cx, cy, panelWidth, panelHeight, 0x1e1e1e)
            .setStrokeStyle(3, 0x66aaff)
            .setDepth(10001);

        const title = this.add.text(cx, cy - panelHeight / 2 + 24, 'Improved Switch', {
            fontFamily: 'Verdana',
            fontSize: '24px',
            color: '#66aaff'
        }).setOrigin(0.5).setDepth(10001);

        const subtitle = this.add.text(cx, cy - panelHeight / 2 + 52, 'Choose the custom dice you want to switch to:', {
            fontFamily: 'Verdana',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(10001);

        const listTop = cy - panelHeight / 2 + 120;
        const listHeight = 360;
        const listWidth = panelWidth - 200;
        const tabsX = cx - panelWidth / 2 + 70;
        const listX = cx + 40;

        const maskRect = this.add.rectangle(listX, listTop, listWidth, listHeight, 0x000000, 0)
            .setOrigin(0.5, 0)
            .setDepth(10001);
        const mask = maskRect.createGeometryMask();

        const listContainer = this.add.container(0, 0).setDepth(10002);
        listContainer.setMask(mask);

        const buildButton = (dice, index, y) => {
            const label = `${dice.type}  (sides: ${dice.sides}, luck: ${dice.luckFactor})`;
            const btn = UIFactory.createButton(this, label, listX, y, () => {
                this.registry.set('selectedCustomDiceIndex', index);
                this.resultText.setText(`Selected ${dice.type}`).setVisible(true);
                if (SettingsManager.get(this).audio) this.sound.play('switchSound');
                this.closeCustomSwitchModal();
            }, '20px', '#333');
            btn.setDepth(10002);
            return btn;
        };

        const perPage = 10;
        const totalPages = Math.min(10, Math.ceil(arr.length / perPage));
        const tabStartY = listTop + 6;
        const tabGap = 6;
        const tabHeight = Math.floor((listHeight - (totalPages - 1) * tabGap) / Math.max(1, totalPages));
        const tabButtons = [];

        const renderPage = (pageIndex) => {
            listContainer.removeAll(true);
            const start = pageIndex * perPage;
            const end = Math.min(arr.length, start + perPage);
            const buttonHeight = 32;
            const gap = 4;
            const startY = listTop + 8;
            for (let i = start; i < end; i += 1) {
                const y = startY + (i - start) * (buttonHeight + gap);
                listContainer.add(buildButton(arr[i], i, y));
            }
            tabButtons.forEach((btn, idx) => {
                btn.setStyle({ backgroundColor: idx === pageIndex ? '#2d7a2d' : '#333' });
            });
        };

        for (let i = 0; i < totalPages; i += 1) {
            const y = tabStartY + i * (tabHeight + tabGap);
            const rangeStart = i * perPage + 1;
            const rangeEnd = Math.min(arr.length, (i + 1) * perPage);
            const label = `No. ${i + 1} (${rangeStart}-${rangeEnd})`;
            const btn = UIFactory.createButton(this, label, tabsX, y, () => renderPage(i), '16px', '#333');
            btn.setOrigin(0.5, 0);
            btn.setDepth(10002);
            tabButtons.push(btn);
        }

        renderPage(0);

        const closeBtn = UIFactory.createButton(this, 'Close', cx, cy + panelHeight / 2 - 28, () => this.closeCustomSwitchModal(), '20px', '#7a2d2d');
        closeBtn.setDepth(10002);

        this.customSwitchContainer = this.add.container(0, 0, [
            blocker,
            panel,
            title,
            subtitle,
            maskRect,
            listContainer,
            ...tabButtons,
            closeBtn
        ]);
        this.customSwitchContainer.setDepth(10000);
    }

    closeCustomSwitchModal() {
        if (this.customSwitchContainer) {
            this.customSwitchContainer.destroy(true);
            this.customSwitchContainer = null;
        }
        if (this._customSwitchWheel) {
            this.input.off('wheel', this._customSwitchWheel);
            this._customSwitchWheel = null;
        }
    }

    showConfirmDialog(message, onConfirm) {
        if (this.confirmContainer) return;

        const cam = this.cameras.main;
        const cx = cam.centerX;
        const cy = cam.centerY;

        const blocker = this.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.55)
            .setDepth(10000)
            .setInteractive({ swallowPointer: true });

        const panel = this.add.rectangle(cx, cy, 520, 200, 0x1e1e1e)
            .setStrokeStyle(3, 0xffcc66)
            .setDepth(10001);

        const title = this.add.text(cx, cy - 60, 'Confirm', {
            fontFamily: 'Verdana',
            fontSize: '26px',
            color: '#ffcc66'
        }).setOrigin(0.5).setDepth(10001);

        const body = this.add.text(cx, cy - 5, message, {
            fontFamily: 'Verdana',
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 460 }
        }).setOrigin(0.5).setDepth(10001);

        const yesBtn = UIFactory.createButton(this, 'Yes', cx - 90, cy + 60, () => {
            this.closeConfirmDialog();
            onConfirm();
        }, '22px', '#2d7a2d');

        const noBtn = UIFactory.createButton(this, 'No', cx + 90, cy + 60, () => this.closeConfirmDialog(), '22px', '#7a2d2d');

        yesBtn.setDepth(10001);
        noBtn.setDepth(10001);

        this.confirmContainer = this.add.container(0, 0, [blocker, panel, title, body, yesBtn, noBtn]);
        this.confirmContainer.setDepth(10000);
    }

    closeConfirmDialog() {
        if (this.confirmContainer) {
            this.confirmContainer.destroy(true);
            this.confirmContainer = null;
        }
    }
}
