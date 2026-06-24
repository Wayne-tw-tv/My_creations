(function (global) {
  'use strict';

  var audioCtx = null;

  function ensureContext() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function isEnabled() {
    return global.LuckySpin.settings &&
      global.LuckySpin.settings.getSettings().sound;
  }

  function playTone(frequency, duration, type, volume) {
    if (!isEnabled()) return;
    var ctx = ensureContext();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = type || 'square';
    osc.frequency.value = frequency;
    gain.gain.value = volume || 0.08;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }

  function tick() {
    playTone(800 + Math.random() * 200, 0.04, 'square', 0.06);
  }

  function win() {
    if (!isEnabled()) return;
    var ctx = ensureContext();
    if (!ctx) return;

    var notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach(function (freq, i) {
      setTimeout(function () {
        playTone(freq, 0.25, 'sine', 0.12);
      }, i * 120);
    });
  }

  function playClap(ctx, time, volume) {
    var length = Math.floor(ctx.sampleRate * 0.045);
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    var j;

    for (j = 0; j < length; j++) {
      data[j] = (Math.random() * 2 - 1) * (1 - j / length);
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 900;

    var gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(time);
    source.stop(time + 0.05);
  }

  function playCelebrationNote(ctx, time, frequency, duration, volume, type) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = type || 'triangle';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.035);
    gain.gain.setValueAtTime(volume * 0.9, time + duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  function celebrate() {
    if (!isEnabled()) return;
    var ctx = ensureContext();
    if (!ctx) return;

    var now = ctx.currentTime;
    var fanfare = [
      { freq: 783.99, start: 0, dur: 0.16, vol: 0.09 },
      { freq: 783.99, start: 0.14, dur: 0.16, vol: 0.09 },
      { freq: 783.99, start: 0.28, dur: 0.18, vol: 0.1 },
      { freq: 1046.5, start: 0.48, dur: 0.28, vol: 0.11 },
      { freq: 1318.51, start: 0.72, dur: 0.34, vol: 0.12 },
      { freq: 1567.98, start: 1.02, dur: 2.8, vol: 0.1 }
    ];
    var i;

    fanfare.forEach(function (note) {
      playCelebrationNote(ctx, now + note.start, note.freq, note.dur, note.vol, 'triangle');
    });

    [523.25, 659.25, 783.99].forEach(function (freq) {
      playCelebrationNote(ctx, now + 1.02, freq, 2.6, 0.045, 'sine');
    });

    for (i = 0; i < 22; i++) {
      playClap(ctx, now + 0.55 + i * 0.155 + Math.random() * 0.05, 0.07 + Math.random() * 0.03);
    }

    var cheerLength = Math.floor(ctx.sampleRate * 3.6);
    var cheerBuffer = ctx.createBuffer(1, cheerLength, ctx.sampleRate);
    var cheerData = cheerBuffer.getChannelData(0);

    for (i = 0; i < cheerLength; i++) {
      var t = i / ctx.sampleRate;
      var envelope = 1;
      if (t < 0.35) {
        envelope = t / 0.35;
      } else if (t > 2.6) {
        envelope = Math.max(0, 1 - (t - 2.6) / 1.0);
      }
      cheerData[i] = (Math.random() * 2 - 1) * envelope;
    }

    var cheer = ctx.createBufferSource();
    cheer.buffer = cheerBuffer;

    var cheerFilter = ctx.createBiquadFilter();
    cheerFilter.type = 'bandpass';
    cheerFilter.frequency.setValueAtTime(600, now);
    cheerFilter.frequency.linearRampToValueAtTime(1800, now + 1.2);
    cheerFilter.frequency.linearRampToValueAtTime(900, now + 3.6);
    cheerFilter.Q.value = 0.6;

    var cheerGain = ctx.createGain();
    cheerGain.gain.setValueAtTime(0, now);
    cheerGain.gain.linearRampToValueAtTime(0.14, now + 0.35);
    cheerGain.gain.setValueAtTime(0.11, now + 2.2);
    cheerGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

    cheer.connect(cheerFilter);
    cheerFilter.connect(cheerGain);
    cheerGain.connect(ctx.destination);
    cheer.start(now);
    cheer.stop(now + 3.8);

    [1174.66, 1567.98, 1975.53].forEach(function (freq, index) {
      playCelebrationNote(ctx, now + 2.55 + index * 0.22, freq, 0.55, 0.08, 'sine');
    });
  }

  global.LuckySpin = global.LuckySpin || {};
  global.LuckySpin.audio = {
    ensureContext: ensureContext,
    tick: tick,
    win: win,
    celebrate: celebrate
  };
})(window);
