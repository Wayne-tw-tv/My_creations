(function (global) {
  'use strict';

  function debounce(fn, delay) {
    var timer;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  function formatTimestamp(date) {
    var d = date || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return y + '/' + m + '/' + day + ' ' + h + ':' + min;
  }

  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function getCrypto() {
    return global.crypto || global.msCrypto || null;
  }

  function randomFloat() {
    var crypto = getCrypto();
    if (!crypto || !crypto.getRandomValues) {
      return Math.random();
    }
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 0x100000000;
  }

  function randomInt(max) {
    if (max <= 0) return 0;

    var crypto = getCrypto();
    if (!crypto || !crypto.getRandomValues) {
      return Math.floor(Math.random() * max);
    }

    var arr = new Uint32Array(1);
    var maxUint32 = 0x100000000;
    var limit = maxUint32 - (maxUint32 % max);
    var value;

    do {
      crypto.getRandomValues(arr);
      value = arr[0];
    } while (value >= limit);

    return value % max;
  }

  function pickRandomIndex(length) {
    return randomInt(length);
  }

  function showToast(message, duration) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.remove();
    }, duration || 3000);
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.utils = {
    debounce: debounce,
    formatTimestamp: formatTimestamp,
    downloadFile: downloadFile,
    sleep: sleep,
    randomFloat: randomFloat,
    randomInt: randomInt,
    pickRandomIndex: pickRandomIndex,
    showToast: showToast
  };
})(window);
