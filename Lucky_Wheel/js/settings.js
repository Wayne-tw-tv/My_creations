(function (global) {
  'use strict';

  var settings = {
    drawCount: 1,
    autoRemove: true,
    sound: true,
    confetti: true,
    allowDuplicates: false
  };

  var onChangeCallback = null;
  var els = {};

  function getSettings() {
    return Object.assign({}, settings);
  }

  function setSettings(partial, skipSave) {
    Object.assign(settings, partial);
    syncUI();
    if (!skipSave) {
      global.LuckySpin.storage.saveSettings(settings);
    }
    notifyChange();
  }

  function syncUI() {
    if (els.drawCount) els.drawCount.value = String(settings.drawCount);
    if (els.autoRemove) els.autoRemove.checked = settings.autoRemove;
    if (els.sound) els.sound.checked = settings.sound;
    if (els.confetti) els.confetti.checked = settings.confetti;
    if (els.allowDuplicates) els.allowDuplicates.checked = settings.allowDuplicates;

    if (global.LuckySpin.nameList) {
      global.LuckySpin.nameList.setAllowDuplicates(settings.allowDuplicates);
    }
  }

  function validateDrawCount(nameCount) {
    var errorEl = els.drawError;
    var spinBtn = document.getElementById('btn-spin');

    if (nameCount < 1) {
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = '';
      }
      if (spinBtn) spinBtn.disabled = true;
      return false;
    }

    if (settings.drawCount > nameCount) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = '目前名單只有 ' + nameCount + ' 人，無法抽出 ' + settings.drawCount + ' 位得獎者。';
      }
      if (spinBtn) spinBtn.disabled = true;
      return false;
    }

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    if (spinBtn) spinBtn.disabled = false;
    return true;
  }

  function notifyChange() {
    if (onChangeCallback) onChangeCallback(settings);
  }

  function onChange(callback) {
    onChangeCallback = callback;
  }

  function bindEvents() {
    if (els.drawCount) {
      els.drawCount.addEventListener('change', function () {
        setSettings({ drawCount: parseInt(els.drawCount.value, 10) });
      });
    }

    if (els.autoRemove) {
      els.autoRemove.addEventListener('change', function () {
        setSettings({ autoRemove: els.autoRemove.checked });
      });
    }

    if (els.sound) {
      els.sound.addEventListener('change', function () {
        setSettings({ sound: els.sound.checked });
      });
    }

    if (els.confetti) {
      els.confetti.addEventListener('change', function () {
        setSettings({ confetti: els.confetti.checked });
      });
    }

    if (els.allowDuplicates) {
      els.allowDuplicates.addEventListener('change', function () {
        setSettings({ allowDuplicates: els.allowDuplicates.checked });
      });
    }
  }

  function init(options) {
    els.drawCount = document.getElementById('draw-count');
    els.autoRemove = document.getElementById('auto-remove');
    els.sound = document.getElementById('sound-enabled');
    els.confetti = document.getElementById('confetti-enabled');
    els.allowDuplicates = document.getElementById('allow-duplicates');
    els.drawError = document.getElementById('draw-error');

    if (options && options.initialSettings) {
      setSettings(options.initialSettings, true);
    }

    bindEvents();
    syncUI();
  }

  function resetToDefaults() {
    setSettings(global.LuckySpin.storage.DEFAULT_SETTINGS);
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.settings = {
    init: init,
    getSettings: getSettings,
    setSettings: setSettings,
    validateDrawCount: validateDrawCount,
    onChange: onChange,
    resetToDefaults: resetToDefaults
  };
})(window);
