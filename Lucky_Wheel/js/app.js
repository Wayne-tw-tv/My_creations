(function (global) {
  'use strict';

  function syncWheelAndValidation() {
    var names = global.LuckySpin.nameList.getNames();
    global.LuckySpin.wheel.setNames(names);
    global.LuckySpin.settings.validateDrawCount(names.length);
  }

  function handleResetAll() {
    if (!confirm('確定要重新開始嗎？這將清除名單、中獎紀錄並重置設定。')) return;

    global.LuckySpin.storage.clearAll();
    global.LuckySpin.nameList.setNames([]);
    global.LuckySpin.winners.reset();
    global.LuckySpin.settings.resetToDefaults();

    var input = document.getElementById('name-input');
    if (input) input.value = '';

    syncWheelAndValidation();
    global.LuckySpin.utils.showToast('已重新開始，祝你好運！');
  }

  function bindNavLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href === '#') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function init() {
    var storedNames = global.LuckySpin.storage.loadNames();
    var storedWinners = global.LuckySpin.storage.loadWinners();
    var storedSettings = global.LuckySpin.storage.loadSettings();

    global.LuckySpin.nameList.init({
      initialNames: storedNames,
      allowDuplicates: storedSettings.allowDuplicates
    });

    global.LuckySpin.settings.init({
      initialSettings: storedSettings
    });

    global.LuckySpin.winners.init({
      initialWinners: storedWinners
    });

    global.LuckySpin.wheel.init();
    global.LuckySpin.modal.init();
    global.LuckySpin.confetti.init();
    global.LuckySpin.lottery.init();

    global.LuckySpin.nameList.onChange(function () {
      syncWheelAndValidation();
    });

    global.LuckySpin.settings.onChange(function () {
      syncWheelAndValidation();
    });

    var btnReset = document.getElementById('btn-reset-all');
    if (btnReset) btnReset.addEventListener('click', handleResetAll);

    bindNavLinks();
    syncWheelAndValidation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
