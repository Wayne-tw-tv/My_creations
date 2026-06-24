(function (global) {
  'use strict';

  var isRunning = false;

  function pickRandomFromPool(pool, excludeNames) {
    var available = pool.map(function (name, index) {
      return { name: name, index: index };
    }).filter(function (item) {
      return !excludeNames || excludeNames.indexOf(item.name) === -1;
    });

    if (available.length === 0) {
      return null;
    }

    var pick = available[global.LuckySpin.utils.pickRandomIndex(available.length)];
    return { index: pick.index, name: pick.name };
  }

  function setSpinningUI(spinning, message) {
    var btn = document.getElementById('btn-spin');
    var status = document.getElementById('spin-status');

    if (btn) btn.disabled = spinning;
    if (status) {
      status.textContent = message || '';
      status.classList.toggle('is-spinning', spinning);
    }
  }

  function updateAllState() {
    var names = global.LuckySpin.nameList.getNames();
    global.LuckySpin.wheel.setNames(names);
    global.LuckySpin.settings.validateDrawCount(names.length);
  }

  async function startDraw() {
    if (isRunning) return;

    var settings = global.LuckySpin.settings.getSettings();
    var pool = global.LuckySpin.nameList.getNames();

    if (pool.length < 1) {
      global.LuckySpin.utils.showToast('目前參加者不足，請先加入更多名單。');
      return;
    }

    if (settings.drawCount > pool.length) {
      global.LuckySpin.utils.showToast(
        '目前名單只有 ' + pool.length + ' 人，無法抽出 ' + settings.drawCount + ' 位得獎者。'
      );
      return;
    }

    isRunning = true;
    setSpinningUI(true, '正在轉動幸運...');

    var sessionWinners = [];
    var workingPool = pool.slice();

    for (var i = 0; i < settings.drawCount; i++) {
      var pick = settings.autoRemove
        ? pickRandomFromPool(workingPool, null)
        : pickRandomFromPool(workingPool, sessionWinners);

      if (!pick) break;

      var winnerName = pick.name;
      var winnerIndex = pick.index;

      await global.LuckySpin.wheel.spinToIndex(winnerIndex);
      sessionWinners.push(winnerName);

      if (i < settings.drawCount - 1) {
        await global.LuckySpin.utils.sleep(800);
      }

      if (settings.autoRemove) {
        workingPool.splice(winnerIndex, 1);
        global.LuckySpin.wheel.setNames(workingPool);
        await global.LuckySpin.utils.sleep(300);
      }
    }

    if (settings.autoRemove) {
      global.LuckySpin.nameList.setNames(workingPool);
    }

    sessionWinners.forEach(function (name) {
      global.LuckySpin.winners.addWinner(name);
    });

    setSpinningUI(false, '');
    isRunning = false;

    global.LuckySpin.modal.show(sessionWinners);
    updateAllState();

    if (global.LuckySpin.nameList.getNames().length === 0) {
      global.LuckySpin.utils.showToast('所有參加者都已抽完！幸運女神今天的工作已結束。', 4000);
    } else {
      global.LuckySpin.settings.validateDrawCount(global.LuckySpin.nameList.getNames().length);
    }
  }

  function getIsRunning() {
    return isRunning;
  }

  function init() {
    var btn = document.getElementById('btn-spin');
    if (btn) {
      btn.addEventListener('click', function () {
        if (global.LuckySpin.audio) {
          global.LuckySpin.audio.ensureContext();
        }
        startDraw();
      });
    }
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.lottery = {
    init: init,
    startDraw: startDraw,
    getIsRunning: getIsRunning
  };
})(window);
