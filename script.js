console.log("✅ script.js loaded");

let songs = [];
let currentIndex = 0;
let isPaused = false;
let commentIndex = 0;
let commentInterval;
let ytPlayer;

const fallbackVideoId = "dQw4w9WgXcQ";
console.log("✅ script.js loaded");

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

// Wait for DOM to be ready
window.addEventListener("DOMContentLoaded", () => {
  console.log("🌸 DOM ready");

  const urlParams = new URLSearchParams(window.location.search);
  const base64Data = urlParams.get("data");
  const playlistFile = urlParams.get("playlist");
  const fromFilter = urlParams.get("fromFilter") === "1";

  console.log("🔍 URL Params:", {
    base64Data,
    playlistFile,
    fromFilter
  });

  if (fromFilter && localStorage.getItem("filteredPlaylist")) {
    console.log("🎯 Loading from localStorage (filteredPlaylist)");
    try {
      const raw = localStorage.getItem("filteredPlaylist");
      const parsed = JSON.parse(raw);
      console.log("📦 Loaded filteredPlaylist with", parsed.length, "songs");
      if (Array.isArray(parsed) && parsed.length > 0) {
        songs = parsed;
        currentIndex = 0;
        loadSong(currentIndex);
      } else {
        throw new Error("Invalid playlist data");
      }
    } catch (e) {
      console.error("❌ Failed to parse filtered playlist:", e);
      fallbackToRickAstley("Invalid playlist data.");
    }
  } else if (base64Data) {
    console.log("🎯 Loading from base64 encoded data");
    try {
      const jsonStr = decodeURIComponent(escape(atob(base64Data)));
      const data = JSON.parse(jsonStr);
      console.log("📦 Decoded base64 with", data.length, "songs");
      songs = data.filter(song => song && song.song_title);
      if (songs.length === 0) throw new Error("Filtered song list is empty.");
      currentIndex = 0;
      loadSong(currentIndex);
    } catch (err) {
      console.error("❌ Error decoding base64 song data:", err);
      fallbackToRickAstley("Invalid song data.");
    }
  } else if (playlistFile) {
    console.log("🎯 Loading from static playlist file:", playlistFile);
    fetch(`playlists/${playlistFile}`)
      .then(res => res.json())
      .then(data => {
        console.log("📦 Loaded playlist file with", data.length, "songs");
        songs = data.filter(song => song && song.song_title);
        if (songs.length === 0) throw new Error("No valid songs");
        currentIndex = 0;
        loadSong(currentIndex);
      })
      .catch(err => {
        console.error("❌ Failed to load playlist file:", err);
        fallbackToRickAstley("Unable to load song data.");
      });
  } else {
    console.warn("⚠️ No playlist data found. Falling back.");
    fallbackToRickAstley("No playlist selected.");
  }
});

function fallbackToRickAstley(message = '') {
  const fallbackSong = {
    song_title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    submitter: "Fallback Bot",
    score: "∞",
    rank: "1",
    comments: "You tried to break it, but Rick rolled you instead.",
    round_name: "Classic Internet Moments",
    season: "Bonus",
    spotify_url: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
    youtube_url: `https://www.youtube.com/watch?v=${fallbackVideoId}`
  };

  songs = [fallbackSong];
  currentIndex = 0;
  const songInfoEl = document.getElementById('songInfo');
  if (songInfoEl && message) songInfoEl.innerText = message;
  loadSong(currentIndex);
}

function extractYouTubeID(url) {
  if (!url) return '';
  const match = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function loadSong(index) {
  clearInterval(commentInterval);
  const song = songs[index];
  if (!song) return console.warn("🚫 No song to load at index", index);

  const videoId = extractYouTubeID(song.youtube_url) || fallbackVideoId;
  const spotifyUrl = song.spotify_url;
  const iframe = document.getElementById('ytplayer');

  iframe.src = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`
    : spotifyUrl
      ? `https://open.spotify.com/embed/track/${spotifyUrl.split('/track/')[1]}`
      : `https://www.youtube.com/embed/${fallbackVideoId}?autoplay=1&enablejsapi=1`;

  document.getElementById('categoryTitle').textContent = `${song.season || 'Unknown Season'} - ${song.round_name || 'Unknown Round'}`;
  document.getElementById('artistName').textContent = song.artist || 'Unknown Artist';
  document.getElementById('songTitle').textContent = song.song_title || 'Unknown Title';
  document.getElementById('submitter').textContent = song.submitter || 'Unknown';
  document.getElementById('score').textContent = song.score || 0;
  document.getElementById('rank').textContent = song.rank || 0;

  const commentBox = document.getElementById("commentBox");
  let comments = ['No comments available'];
if (song.comments) {
  if (song.comments.includes('|')) {
    comments = song.comments.split('|').map(c => c.trim()).filter(Boolean);
  } else {
    comments = song.comments.split('\n').map(c => c.trim()).filter(Boolean);
  }
}

  commentIndex = 0;

  function showNextComment() {
    commentBox.style.opacity = 0;
    setTimeout(() => {
      commentBox.innerText = comments[commentIndex] || '';
      commentBox.style.opacity = 1;
      commentIndex = (commentIndex + 1) % comments.length;
    }, 700);
  }

  showNextComment();
  commentInterval = setInterval(showNextComment, 6000);
  console.log(`🎬 Now playing: ${song.song_title} by ${song.artist} [${index + 1}/${songs.length}]`);
}

function prevSong() {
  if (currentIndex > 0) {
    currentIndex--;
    loadSong(currentIndex);
  }
}

function nextSong() {
  if (currentIndex < songs.length - 1) {
    currentIndex++;
    loadSong(currentIndex);
  } else {
    alert("End of playlist");
  }
}

function togglePlayPause() {
  const iframe = document.getElementById('ytplayer');
  const func = isPaused ? 'playVideo' : 'pauseVideo';
  iframe.contentWindow.postMessage(`{"event":"command","func":"${func}","args":""}`, "*");
  isPaused = !isPaused;
  document.getElementById('playPauseBtn').innerText = isPaused ? '▶️ Play' : '⏯️ Pause';
}

function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytplayer', {
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    nextSong();
  }
}
