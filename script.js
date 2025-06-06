let songs = [];
let currentIndex = 0;
let isPaused = false;
let commentIndex = 0;
let commentInterval;

const fallbackVideoId = "dQw4w9WgXcQ";
console.log("script.js loaded!");

function loadPlaylist(filePath) {
  fetch(filePath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      songs = data;
      loadSong(currentIndex);
    })
    .catch(err => {
      document.getElementById('songInfo').innerText = 'Unable to load song data';
      console.error('JSON load error:', err);
    });
}

function extractYouTubeID(url) {
  if (!url) return '';
  const match = url.match(/(?:[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function loadSong(index) {
  clearInterval(commentInterval);
  const song = songs[index];

  const videoId = extractYouTubeID(song.youtube_url) || '';
  const spotifyUrl = song.spotify_url;

  if (videoId) {
    document.getElementById('ytplayer').src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
  } else if (spotifyUrl) {
    document.getElementById('ytplayer').src = `https://open.spotify.com/embed/track/${spotifyUrl.split('/track/')[1]}`;
  } else {
    document.getElementById('ytplayer').src = `https://www.youtube.com/embed/${fallbackVideoId}?autoplay=1&enablejsapi=1`;
  }

  document.getElementById('songInfo').innerHTML = `
    <div class="song-meta">
      <div class="season-round">${song.season_name || 'Unknown Season'} • ${song.round_name || 'Unknown Round'}</div>
      <div class="artist-title">${song.artist || 'Unknown Artist'} – <span class="highlight">${song.song_title || 'Unknown Title'}</span></div>
      <div class="submit-score">Submitted by ${song.submitter || 'Unknown'} • Score: ${song.score || 0}</div>
    </div>
  `;


  const commentBox = document.getElementById("commentBox");
  const comments = song.comments ? song.comments.split('\n') : ['No comments available'];
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
  }
}

function togglePlayPause() {
  const iframe = document.getElementById('ytplayer');
  const func = isPaused ? 'playVideo' : 'pauseVideo';
  iframe.contentWindow.postMessage(`{"event":"command","func":"${func}","args":""}`, "*");
  isPaused = !isPaused;
  document.getElementById('playPauseBtn').innerText = isPaused ? 'Play' : 'Pause';
}

// --- Extract query param and load playlist ---
const params = new URLSearchParams(window.location.search);
const playlistFile = params.get("playlist");

if (playlistFile) {
  loadPlaylist(`./playlists/${playlistFile}`);
} else {
  document.getElementById('songInfo').innerText = 'No playlist selected';
}
