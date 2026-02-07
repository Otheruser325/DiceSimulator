import { UIFactory } from '../utils/UIManager.js';
import { RegularDice, CustomDice, MAX_CUSTOM_DICE } from '../utils/DiceManager.js';
import { showAlert } from '../utils/AlertManager.js';
import SettingsManager from '../utils/SettingsManager.js';

export default class DiceSimScene extends Phaser.Scene {
    constructor() { super({ key: 'DiceSimScene' }); }
    create() {
        this.diceSound = this.sound.add('diceSound');
        this.switchSound = this.sound.add('switchSound');

        const centerX = this.scale.width / 2;

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
        this.resultText = this.add.text(centerX, this.scale.height - 140, '', { fontSize: '24px', fontFamily: 'Verdana', color: '#fff' })
            .setOrigin(0.5)
            .setVisible(false);
        this.tutorialText = this.add.text(centerX, this.scale.height - 90, '', { fontSize: '18px', fontFamily: 'Verdana', color: '#cfcfcf' })
            .setOrigin(0.5)
            .setVisible(false);

        // Normal tab buttons
        this.rollRandomButton = UIFactory.createButton(this, 'Roll Random Dice', centerX, 220, () => this.rollRandomDice());
        this.rollSelectedButton = UIFactory.createButton(this, 'Roll Selected Dice', centerX, 300, () => this.rollSelectedDice());
        this.switchDiceButton = UIFactory.createButton(this, 'Switch Dice Type', centerX, 380, () => this.switchDiceType());

        // Custom tab buttons
        this.customCountText = UIFactory.createText(this, centerX, 170, '', '22px');
        this.rollCustomDiceButton = UIFactory.createButton(this, 'Roll Custom Dice', centerX, 220, () => this.rollCustomDice());
        this.rollRandomCustomDiceButton = UIFactory.createButton(this, 'Roll Random Custom Dice', centerX, 300, () => this.rollRandomCustomDice());
        this.switchCustomDiceButton = UIFactory.createButton(this, 'Switch Custom Dice Type', centerX, 380, () => this.switchCustomDiceType());
        this.deleteCustomDiceButton = UIFactory.createButton(this, 'Remove Selected Custom Dice', centerX, 460, () => this.requestDeleteCustomDice(), '24px', '#7a2d2d');
        this.createDiceButton = UIFactory.createButton(this, 'Build a Dice!', centerX, 540, () => this.scene.start('CreateDiceScene'));

        this.customEmptyText = UIFactory.createText(
            this,
            centerX,
            300,
            "You don't have any custom dice!\n\nTry creating one now!",
            '26px'
        );

        // Calculate tab text
        this.calcText = UIFactory.createText(this, centerX, 320, 'Coming soon...', '28px');
        this.physicsText = UIFactory.createText(this, centerX, 320, 'Coming soon...', '28px');

        // Back button
        this.backButton = UIFactory.createButton(this, 'Back', 60, 20, () => this.requestExitSimulator(), '30px', '#f00').setOrigin(0,0);

        // ESC to back out (with confirmation)
        this.input.keyboard.on('keydown-ESC', (event) => {
            event.stopPropagation();
            if (SettingsManager.get(this).audio) this.switchSound.play();
            if (this.customSwitchContainer) {
                this.closeCustomSwitchModal();
                return;
            }
            if (this.confirmContainer) {
                this.closeConfirmDialog();
                return;
            }
            this.requestExitSimulator();
        });

        this.normalUI = [this.rollRandomButton, this.rollSelectedButton, this.switchDiceButton];
        this.customHeaderUI = [this.customCountText];
        this.customFullUI = [this.rollCustomDiceButton, this.rollRandomCustomDiceButton, this.switchCustomDiceButton, this.deleteCustomDiceButton];
        this.customEmptyUI = [this.customEmptyText];
        this.customBaseUI = [this.createDiceButton];
        this.calcUI = [this.calcText];
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

    setActiveTab(tab) {
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
            this.maybeShowTutorial('diceSimTutNormal', 'Normal tab: roll random, roll selected, or switch dice type.');
        } else if (tab === 'custom') {
            this.updateCustomTab();
            this.resultText.setVisible(true);
            this.maybeShowTutorial('diceSimTutCustom', 'Custom tab: roll custom dice, switch types, or build your own.');
        } else if (tab === 'calc') {
            this.setGroupVisible(this.calcUI, true);
            this.resultText.setVisible(false);
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
        this.setGroupVisible(this.customBaseUI, true);
        this.setGroupVisible(this.customFullUI, hasCustom);
        this.setGroupVisible(this.customEmptyUI, !hasCustom);
        if (arr.length > 10) {
            this.maybeShowTutorial('diceSimTutListicle', 'Switch Custom Dice is now shown as a listicle modal for easier browsing.');
        }
    }

    maybeShowTutorial(flagKey, message) {
        const settings = SettingsManager.get(this);
        const seen = settings.tutorials && settings.tutorials[flagKey];
        if (seen) return;
        const next = { ...(settings.tutorials || {}), [flagKey]: true };
        SettingsManager.set(this, 'tutorials', next);
        this.tutorialText.setText(message).setVisible(true);
        if (this._tutorialTimer) this._tutorialTimer.remove();
        this._tutorialTimer = this.time.delayedCall(6000, () => {
            this.tutorialText.setVisible(false);
        });
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

    // ----- Simulator actions -----
    rollRandomDice() {
        const diceArray = this.registry.get('diceArray') ?? [];
        if (!diceArray || diceArray.length === 0) {
            showAlert(this, 'No dice available!', 'warning');
            return;
        }
        if (SettingsManager.get(this).audio) this.sound.play('diceSound');
        const dice = diceArray[Phaser.Math.Between(0, diceArray.length - 1)];
        const result = RegularDice.roll(dice.sides);
        this.resultText.setText(`Rolled ${dice.type}: ${result}`).setVisible(true);
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
        const result = RegularDice.roll(dice.sides);
        this.resultText.setText(`Rolled ${dice.type}: ${result}`).setVisible(true);
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
        const result = CustomDice.roll(dice.sides, dice.luckFactor);
        this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`).setVisible(true);
    }

    rollRandomCustomDice() {
        const arr = this.getCustomDiceArray();
        if (!arr || arr.length === 0) {
            showAlert(this, 'No custom dice available!', 'warning');
            return;
        }
        if (SettingsManager.get(this).audio) this.sound.play('diceSound');
        const idx = Phaser.Math.Between(0, arr.length - 1);
        const dice = arr[idx];
        const result = CustomDice.roll(dice.sides, dice.luckFactor);
        this.resultText.setText(`Rolled Custom ${dice.type}: ${result}`).setVisible(true);
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
        return !!(this.confirmContainer || this.customSwitchContainer);
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
