const { QQMusicPlayer, playlist } = require('../src/player');

describe('QQMusicPlayer', () => {
  let player;

  beforeEach(() => { player = new QQMusicPlayer(); });

  test('should initialize with playlist', () => {
    expect(player.playlist.length).toBeGreaterThan(0);
    expect(player.currentIndex).toBe(0);
    expect(player.isPlaying).toBe(false);
  });

  test('should toggle play', () => {
    player.togglePlay();
    expect(player.isPlaying).toBe(true);
    player.togglePlay();
    expect(player.isPlaying).toBe(false);
  });

  test('should navigate tracks', () => {
    const len = player.playlist.length;
    player.next();
    expect(player.currentIndex).toBe(1);
    player.prev();
    expect(player.currentIndex).toBe(0);
    player.currentIndex = len - 1;
    player.next();
    expect(player.currentIndex).toBe(0);
    player.currentIndex = 0;
    player.prev();
    expect(player.currentIndex).toBe(len - 1);
  });

  test('should play specific track', () => {
    player.playTrackAt(3);
    expect(player.currentIndex).toBe(3);
    expect(player.isPlaying).toBe(true);
  });

  test('should set volume', () => {
    player.setVolume(0.5);
    expect(player.volume).toBe(0.5);
    player.setVolume(2);
    expect(player.volume).toBe(1);
    player.setVolume(-1);
    expect(player.volume).toBe(0);
  });

  test('should seek time', () => {
    player.duration = 300;
    player.seek(150);
    expect(player.currentTime).toBe(150);
    player.seek(-10);
    expect(player.currentTime).toBe(0);
    player.seek(500);
    expect(player.currentTime).toBe(300);
  });

  test('should return lyrics', () => {
    const lyrics = player.getLyrics();
    expect(Array.isArray(lyrics)).toBe(true);
  });

  test('should get current state', () => {
    const state = player.getState();
    expect(state.currentIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.currentTrack).toBeDefined();
  });
});