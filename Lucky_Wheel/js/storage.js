(function (global) {
  'use strict';

  var KEYS = {
    names: 'luckySpin_names',
    winners: 'luckySpin_winners',
    settings: 'luckySpin_settings'
  };

  var DEFAULT_SETTINGS = {
    drawCount: 1,
    autoRemove: true,
    sound: true,
    confetti: true,
    allowDuplicates: false
  };

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* ignore quota errors */
    }
  }

  function loadNames() {
    return loadJSON(KEYS.names, []);
  }

  function saveNames(names) {
    saveJSON(KEYS.names, names);
  }

  function loadWinners() {
    return loadJSON(KEYS.winners, []);
  }

  function saveWinners(winners) {
    saveJSON(KEYS.winners, winners);
  }

  function loadSettings() {
    var stored = loadJSON(KEYS.settings, {});
    return Object.assign({}, DEFAULT_SETTINGS, stored);
  }

  function saveSettings(settings) {
    saveJSON(KEYS.settings, settings);
  }

  function clearAll() {
    localStorage.removeItem(KEYS.names);
    localStorage.removeItem(KEYS.winners);
    localStorage.removeItem(KEYS.settings);
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.storage = {
    KEYS: KEYS,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    loadNames: loadNames,
    saveNames: saveNames,
    loadWinners: loadWinners,
    saveWinners: saveWinners,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    clearAll: clearAll
  };
})(window);
