import './styles.css';
import { QQMusicPlayer } from './player';

function init() {
  const player = new QQMusicPlayer();
  const app = document.getElementById('app');

  app.innerHTML = `<div class="player">
    <div class="player-header">
      <div class="title"><span class="logo">Q</span>QQ音乐</div>
      <div class="window-controls"><span class="win-btn close"></span><span class="win-btn min"></span><span class="win-btn max"></span></div>
    </div>
    <div class="album-section">
      <div class="album-cover" id="album-cover">🎵</div>
      <div class="track-title" id="track-title"></div>
      <div class="track-artist" id="track-artist"></div>
    </div>
    <div class="lyrics-section" id="lyrics"></div>
    <div class="controls-section">
      <div class="progress-bar">
        <span class="time" id="time-current">00:00</span>
        <div class="progress" id="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
        <span class="time right" id="time-duration">00:00</span>
      </div>
      <div class="control-buttons">
        <button class="ctrl-btn" id="btn-prev" title="上一首">⏮</button>
        <button class="ctrl-btn play-btn" id="btn-play" title="播放/暂停">▶</button>
        <button class="ctrl-btn" id="btn-next" title="下一首">⏭</button>
      </div>
      <div class="volume-section">
        <span class="vol-icon">🔊</span>
        <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="70">
      </div>
    </div>
    <div class="playlist" id="playlist"></div>
  </div>`;

  let timeInterval;
  let lyricIndex = 0;

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function render(state) {
    const track = state.currentTrack;
    document.getElementById('track-title').textContent = track.title;
    document.getElementById('track-artist').textContent = `${track.artist} - ${track.album}`;

    const cover = document.getElementById('album-cover');
    if (state.isPlaying && !cover.classList.contains('spinning')) {
      cover.classList.add('spinning');
    } else if (!state.isPlaying && cover.classList.contains('spinning')) {
      cover.classList.remove('spinning');
    }

    const btnPlay = document.getElementById('btn-play');
    btnPlay.textContent = state.isPlaying ? '⏸' : '▶';

    document.getElementById('time-current').textContent = formatTime(state.currentTime);
    document.getElementById('time-duration').textContent = track.duration;
    document.getElementById('volume-slider').value = Math.floor(state.volume * 100);

    const durationSec = parseTime(track.duration);
    document.getElementById('progress-fill').style.width =
      durationSec > 0 ? `${(state.currentTime / durationSec) * 100}%` : '0%';

    const lyrics = state.lyrics;
    if (lyrics.length > 0 && state.isPlaying) {
      const idx = Math.floor((state.currentTime / Math.max(durationSec, 1)) * lyrics.length);
      const safeIdx = Math.min(idx, lyrics.length - 1);
      document.getElementById('lyrics').textContent = lyrics[safeIdx];
    } else if (!state.isPlaying) {
      document.getElementById('lyrics').textContent = '🎶 暂停中...';
    }

    const playlist = document.getElementById('playlist');
    playlist.innerHTML = state.playlist.map((t, i) =>
      `<div class="playlist-item${i === state.currentIndex ? ' active' : ''}" data-index="${i}">
        <span class="idx">${String(i + 1).padStart(2, '0')}</span>
        <span class="info"><div class="name">${t.title}</div><div class="artist">${t.artist}</div></span>
        <span class="dur">${t.duration}</span>
      </div>`
    ).join('');

    playlist.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', () => player.playTrackAt(parseInt(item.dataset.index)));
    });
  }

  function parseTime(durStr) {
    const parts = durStr.split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return parseInt(parts[0]) || 0;
  }

  function startTimer() {
    if (timeInterval) clearInterval(timeInterval);
    timeInterval = setInterval(() => {
      if (player.isPlaying) {
        const dur = parseTime(player.getCurrentTrack().duration);
        if (player.currentTime < dur) {
          player.currentTime += 0.5;
          player.notifyStateChange();
        } else {
          player.pause();
        }
      }
    }, 500);
  }

  player.onStateChange = render;
  render(player.getState());
  startTimer();

  document.getElementById('btn-play').addEventListener('click', () => player.togglePlay());
  document.getElementById('btn-prev').addEventListener('click', () => player.prev());
  document.getElementById('btn-next').addEventListener('click', () => player.next());
  document.getElementById('volume-slider').addEventListener('input', (e) => player.setVolume(e.target.value / 100));
  document.getElementById('progress-bar').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    player.seek(pct * parseTime(player.getCurrentTrack().duration));
  });
}

document.addEventListener('DOMContentLoaded', init);