(function (global) {
  'use strict';

  var SAMPLE_NAMES = ['王小明', '陳小華', '林小美', '張大偉', '李小婷', '黃志豪', '吳雅婷', '劉俊傑'];

  var names = [];
  var allowDuplicates = false;
  var onChangeCallback = null;

  var els = {};

  function parseText(text) {
    return text
      .split('\n')
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line.length > 0; });
  }

  function mergeNames(newNames) {
    var result = names.slice();
    newNames.forEach(function (name) {
      if (!allowDuplicates && result.indexOf(name) !== -1) return;
      result.push(name);
    });
    return result;
  }

  function setNames(newNames, skipSave) {
    names = newNames.slice();
    renderPreview();
    updateCount();
    if (!skipSave) {
      global.LuckySpin.storage.saveNames(names);
    }
    notifyChange();
  }

  function getNames() {
    return names.slice();
  }

  function removeAt(index) {
    names.splice(index, 1);
    renderPreview();
    updateCount();
    global.LuckySpin.storage.saveNames(names);
    notifyChange();
  }

  function clear() {
    setNames([]);
  }

  function setAllowDuplicates(value) {
    allowDuplicates = value;
  }

  function renderPreview() {
    if (!els.preview) return;

    els.preview.innerHTML = '';

    if (names.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'name-list__empty';
      empty.id = 'name-empty';
      empty.textContent = '還沒有參加者名單，先輸入幾位幸運候選人吧！';
      els.preview.appendChild(empty);
      return;
    }

    names.forEach(function (name, index) {
      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.title = name;

      var text = document.createElement('span');
      text.textContent = name.length > 12 ? name.slice(0, 12) + '…' : name;
      tag.appendChild(text);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag__remove';
      btn.setAttribute('aria-label', '移除 ' + name);
      btn.textContent = '×';
      btn.dataset.index = String(index);
      btn.addEventListener('click', function () {
        removeAt(index);
      });
      tag.appendChild(btn);

      els.preview.appendChild(tag);
    });
  }

  function updateCount() {
    if (els.count) {
      els.count.textContent = '目前共有 ' + names.length + ' 位參加者';
    }
  }

  function notifyChange() {
    if (onChangeCallback) onChangeCallback(names);
  }

  function onChange(callback) {
    onChangeCallback = callback;
  }

  function handleAdd() {
    var text = els.input ? els.input.value : '';
    var parsed = parseText(text);
    if (parsed.length === 0) return;
    setNames(mergeNames(parsed));
    if (els.input) els.input.value = '';
  }

  function handleClear() {
    if (names.length === 0) return;
    if (confirm('確定要清除所有名單嗎？')) {
      clear();
      if (els.input) els.input.value = '';
    }
  }

  function handleSample() {
    if (els.input) {
      els.input.value = SAMPLE_NAMES.join('\n');
    }
    setNames(SAMPLE_NAMES.slice());
  }

  function init(options) {
    els.input = document.getElementById('name-input');
    els.preview = document.getElementById('name-preview');
    els.count = document.getElementById('name-count');

    var btnAdd = document.getElementById('btn-add-names');
    var btnClear = document.getElementById('btn-clear-names');
    var btnSample = document.getElementById('btn-sample-names');

    if (btnAdd) btnAdd.addEventListener('click', handleAdd);
    if (btnClear) btnClear.addEventListener('click', handleClear);
    if (btnSample) btnSample.addEventListener('click', handleSample);

    if (options && options.initialNames) {
      setNames(options.initialNames, true);
    } else {
      renderPreview();
      updateCount();
    }

    if (options && typeof options.allowDuplicates === 'boolean') {
      allowDuplicates = options.allowDuplicates;
    }
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.nameList = {
    init: init,
    getNames: getNames,
    setNames: setNames,
    removeAt: removeAt,
    clear: clear,
    onChange: onChange,
    setAllowDuplicates: setAllowDuplicates,
    parseText: parseText
  };
})(window);
