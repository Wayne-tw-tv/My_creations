(function (global) {
  'use strict';

  var winners = [];
  var els = {};

  function normalizeRecord(record) {
    if (record.names && Array.isArray(record.names)) {
      return {
        rank: record.rank,
        names: record.names.slice(),
        timestamp: record.timestamp
      };
    }
    return {
      rank: record.rank,
      names: [record.name],
      timestamp: record.timestamp
    };
  }

  function normalizeWinners(list) {
    return list.map(normalizeRecord);
  }

  function getWinners() {
    return winners.map(function (record) {
      return {
        rank: record.rank,
        names: record.names.slice(),
        timestamp: record.timestamp
      };
    });
  }

  function getNextRank() {
    if (winners.length === 0) return 1;
    return winners[winners.length - 1].rank + 1;
  }

  function addDrawRound(names) {
    if (!names || names.length === 0) return null;

    var record = {
      rank: getNextRank(),
      names: names.slice(),
      timestamp: new Date().toISOString()
    };
    winners.push(record);
    global.LuckySpin.storage.saveWinners(winners);
    render();
    return record;
  }

  function addWinner(name) {
    return addDrawRound([name]);
  }

  function clearWinners() {
    if (winners.length === 0) return;
    if (!confirm('確定要清除所有中獎紀錄嗎？')) return;
    winners = [];
    global.LuckySpin.storage.saveWinners(winners);
    render();
  }

  function formatRecordNames(record) {
    return record.names.join('、');
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

      var title = document.createElement('h3');
      title.className = 'winner-card__title';
      title.textContent = '第 ' + record.rank + ' 輪幸運得主';

      card.appendChild(icon);
      card.appendChild(title);

      if (record.names.length === 1) {
        var name = document.createElement('p');
        name.className = 'winner-card__name';
        name.textContent = record.names[0];
        card.appendChild(name);
      } else {
        var list = document.createElement('ol');
        list.className = 'winner-card__list';
        record.names.forEach(function (name, index) {
          var item = document.createElement('li');
          item.textContent = name;
          list.appendChild(item);
        });
        card.appendChild(list);
      }

      var meta = document.createElement('p');
      meta.className = 'winner-card__meta';
      meta.textContent = global.LuckySpin.utils.formatTimestamp(new Date(record.timestamp));
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
        '第 ' + record.rank + ' 輪｜' + formatRecordNames(record) + '｜' +
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
      winners = normalizeWinners(options.initialWinners);
      global.LuckySpin.storage.saveWinners(winners);
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
    addDrawRound: addDrawRound,
    addWinner: addWinner,
    clearWinners: clearWinners,
    exportWinners: exportWinners,
    reset: reset
  };
})(window);
