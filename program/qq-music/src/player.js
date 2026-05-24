export const playlist = [
  { id: 1, title: '晴天', artist: '周杰伦', album: '叶惠美', duration: '4:29', cover: '' },
  { id: 2, title: '七里香', artist: '周杰伦', album: '七里香', duration: '4:58', cover: '' },
  { id: 3, title: '起风了', artist: '买辣椒也用券', album: '起风了', duration: '5:25', cover: '' },
  { id: 4, title: '夜曲', artist: '周杰伦', album: '十一月的萧邦', duration: '4:45', cover: '' },
  { id: 5, title: '稻香', artist: '周杰伦', album: '魔杰座', duration: '3:40', cover: '' },
  { id: 6, title: '青花瓷', artist: '周杰伦', album: '我很忙', duration: '3:59', cover: '' },
  { id: 7, title: '年少有为', artist: '李荣浩', album: '年少有为', duration: '4:38', cover: '' },
  { id: 8, title: '喜欢你', artist: 'Beyond', album: '秘密警察', duration: '4:32', cover: '' },
  { id: 9, title: '海阔天空', artist: 'Beyond', album: '乐与怒', duration: '5:24', cover: '' },
  { id: 10, title: '光年之外', artist: '邓紫棋', album: '新的心跳', duration: '4:12', cover: '' }
];

const lyricsData = {
  '晴天': ['故事的小黄花 从出生那年就飘着', '童年的荡秋千 随记忆一直晃到现在', 'Re So So Si Do Si La So La Si Si Si Si La Si La So', '吹着前奏 望着天空 我想起花瓣试着飘落为你翘课的那一天', '花落的那一天 教室的那一间 我怎么看不见', '消失的下雨天 我好想再淋一遍', '没想到失去的勇气我还留着', '好想再问一遍'],
  '七里香': ['窗外的麻雀 在电线杆上多嘴', '你说这一句 很有夏天的感觉', '手中的铅笔 在纸上来来回回', '我用几行字形容你是我的谁', '秋刀鱼的滋味 猫跟你都想了解', '初恋的香味就这样被我们寻回'],
  '起风了': ['我曾将青春翻涌成她', '也曾指尖弹出盛夏', '心之所动 且就随缘去吧', '逆着光行走 任风吹雨打'],
  default: ['暂无歌词']
};

export class QQMusicPlayer {
  constructor() {
    this.playlist = [...playlist];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isRandom = false;
    this.isLoop = false;
    this.volume = 0.7;
    this.currentTime = 0;
    this.duration = 0;
    this._timerInterval = null;
    this.onStateChange = null;
  }

  getCurrentTrack() { return this.playlist[this.currentIndex]; }

  play() {
    this.isPlaying = true;
    this.notifyStateChange();
  }

  pause() {
    this.isPlaying = false;
    this.notifyStateChange();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.notifyStateChange();
  }

  next() {
    const nextIdx = this.currentIndex + 1;
    this.playTrackAt(nextIdx >= this.playlist.length ? 0 : nextIdx);
  }

  prev() {
    const prevIdx = this.currentIndex - 1;
    this.playTrackAt(prevIdx < 0 ? this.playlist.length - 1 : prevIdx);
  }

  playTrackAt(index) {
    if (index >= 0 && index < this.playlist.length) {
      this.currentIndex = index;
      this.isPlaying = true;
      this.currentTime = 0;
      this.notifyStateChange();
    }
  }

  seek(time) { this.currentTime = Math.max(0, Math.min(time, this.duration || 0)); this.notifyStateChange(); }

  setVolume(vol) { this.volume = Math.max(0, Math.min(1, vol)); this.notifyStateChange(); }

  getLyrics() {
    const track = this.getCurrentTrack();
    return lyricsData[track.title] || lyricsData.default;
  }

  getState() {
    return {
      currentIndex: this.currentIndex,
      playlist: this.playlist,
      isPlaying: this.isPlaying,
      isRandom: this.isRandom,
      isLoop: this.isLoop,
      volume: this.volume,
      currentTime: this.currentTime,
      duration: this.duration,
      currentTrack: this.getCurrentTrack(),
      lyrics: this.getLyrics()
    };
  }

  notifyStateChange() {
    if (this.onStateChange) this.onStateChange(this.getState());
  }
}