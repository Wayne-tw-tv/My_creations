(function (global) {
  'use strict';

  var modal = null;
  var backdrop = null;
  var body = null;
  var title = null;

  function show(winnerNames) {
    if (!modal || !body || !title) return;

    var names = winnerNames.slice();
    body.innerHTML = '';

    if (names.length === 1) {
      title.textContent = '🎉 恭喜中獎！';
      var nameEl = document.createElement('p');
      nameEl.className = 'modal__winner-name';
      nameEl.textContent = names[0];
      body.appendChild(nameEl);

      var subtitle = document.createElement('p');
      subtitle.className = 'modal__subtitle';
      subtitle.textContent = '你就是今天的幸運之星！';
      body.appendChild(subtitle);
    } else {
      title.textContent = '🎉 本次幸運得主';
      var list = document.createElement('ol');
      list.className = 'modal__list';
      names.forEach(function (name, i) {
        var li = document.createElement('li');
        li.textContent = (i + 1) + '. ' + name;
        list.appendChild(li);
      });
      body.appendChild(list);
    }

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    var settings = global.LuckySpin.settings.getSettings();
    if (settings.confetti && global.LuckySpin.confetti) {
      global.LuckySpin.confetti.launch();
      if (global.LuckySpin.audio) {
        global.LuckySpin.audio.celebrate();
      }
    }
  }

  function hide() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function init() {
    modal = document.getElementById('result-modal');
    backdrop = document.getElementById('modal-backdrop');
    body = document.getElementById('modal-body');
    title = document.getElementById('modal-title');

    var btnAgain = document.getElementById('btn-spin-again');
    var btnView = document.getElementById('btn-view-winners');

    if (backdrop) backdrop.addEventListener('click', hide);
    if (btnAgain) btnAgain.addEventListener('click', hide);
    if (btnView) {
      btnView.addEventListener('click', function () {
        hide();
        var section = document.getElementById('winners');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.modal = {
    init: init,
    show: show,
    hide: hide
  };
})(window);
