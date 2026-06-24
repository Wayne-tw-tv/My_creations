(function (global) {
  'use strict';

  var winners = [];
  var els = {};

  function getWinners() {
    return winners.slice();
  }

  function getNextRank() {
    if (winners.length === 0) return 1;
    return winners[winners.length - 1].rank + 1;
  }

  function addWinner(name) {
    var record = {
      rank: getNextRank(),
      name: name,
      timestamp: new Date().toISOString()
    };
    winners.push(record);
    global.LuckySpin.storage.saveWinners(winners);
    render();
    return record;
  }

  function addWinners(names) {
    var records = [];
    names.forEach(function (name) {
      records.push(addWinner(name));
    });
    return records;
  }

  function clearWinners() {
    if (winners.length === 0) return;
    if (!confirm('確定要清除所有中獎紀錄嗎？')) return;
    winners = [];
    global.LuckySpin.storage.saveWinners(winners);
    render();
  }

  function render() {
    if (!els.list) return;

    els.list.innerHTML = '';

    if (winners.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'winners__empty';
      empty.textContent = '尚無中獎紀錄，轉動轉盤試試手氣吧！';
      els.list.appendChild(empty);
      return;
    }

    winners.slice().reverse().forEach(function (record) {
      var card = document.createElement('article');
      card.className = 'winner-card';

      var icon = document.createElement('span');
      icon.className = 'winner-card__icon';
      icon.textContent = '🏆';

      var name = document.createElement('h3');
      name.className = 'winner-card__name';
      name.textContent = record.name;

      var meta = document.createElement('p');
      meta.className = 'winner-card__meta';
      meta.textContent = '第 ' + record.rank + ' 位幸運得主｜' +
        global.LuckySpin.utils.formatTimestamp(new Date(record.timestamp));

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(meta);
      els.list.appendChild(card);
    });
  }

  function exportWinners() {
    if (winners.length === 0) {
      global.LuckySpin.utils.showToast('尚無中獎紀錄可匯出');
      return;
    }

    var lines = ['幸運轉盤 - 中獎名單', '匯出時間：' + global.LuckySpin.utils.formatTimestamp(), ''];
    winners.forEach(function (record) {
      lines.push(
        '第 ' + record.rank + ' 位｜' + record.name + '｜' +
        global.LuckySpin.utils.formatTimestamp(new Date(record.timestamp))
      );
    });

    global.LuckySpin.utils.downloadFile(
      lines.join('\n'),
      'lucky-spin-winners.txt',
      'text/plain;charset=utf-8'
    );
  }

  function init(options) {
    els.list = document.getElementById('winners-list');

    var btnClear = document.getElementById('btn-clear-winners');
    var btnExport = document.getElementById('btn-export-winners');

    if (btnClear) btnClear.addEventListener('click', clearWinners);
    if (btnExport) btnExport.addEventListener('click', exportWinners);

    if (options && options.initialWinners) {
      winners = options.initialWinners.slice();
    }
    render();
  }

  function reset() {
    winners = [];
    global.LuckySpin.storage.saveWinners(winners);
    render();
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.winners = {
    init: init,
    getWinners: getWinners,
    addWinner: addWinner,
    addWinners: addWinners,
    clearWinners: clearWinners,
    exportWinners: exportWinners,
    reset: reset
  };
})(window);
