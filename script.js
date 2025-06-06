let songs = [];
let currentIndex = 0;
let isPaused = false;
let commentIndex = 0;
let commentInterval;
let ytPlayer;

const fallbackVideoId = "dQw4w9WgXcQ";
console.log("script.js loaded!");

// Dynamically load YouTube IFrame API
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.body.appendChild(tag);

// Get playlist file name from URL
const urlParams = new URLSearchParams(window.location.search);
const playlistFile = urlParams.get("playlist");
const filePath = playlistFile ? `playlists/${playlistFile}` : null;

if (filePath) {
  loadPlaylist(filePath);
} else {
  document.getElementById('songInfo').innerText = 'No playlist selected.';
}

function loadPlaylist(path) {
  fetch(path)
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

  const iframe = document.getElementById('ytplayer');
  if (videoId) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
  } else if (spotifyUrl) {
    iframe.src = `https://open.spotify.com/embed/track/${spotifyUrl.split('/track/')[1]}`;
  } else {
    iframe.src = `https://www.youtube.com/embed/${fallbackVideoId}?autoplay=1&enablejsapi=1`;
  }

  document.getElementById('songInfo').innerHTML = `
    <h2>${song.season || 'Unknown Season'} - ${song.round_name || 'Unknown Round'}</h2>
    <p><strong>Artist:</strong> ${song.artist || 'Unknown Artist'}</p>
    <p><strong>Song:</strong> <span class="highlight">${song.song_title || 'Unknown Title'}</span></p>
    <p><strong>Submitter:</strong> ${song.submitter || 'Unknown'}</p>
    <p><strong>Score:</strong> ${song.score || 0}</p>
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
  } else {
    goToNextPlaylist();
  }
}

function togglePlayPause() {
  const iframe = document.getElementById('ytplayer');
  const func = isPaused ? 'playVideo' : 'pauseVideo';
  iframe.contentWindow.postMessage(`{"event":"command","func":"${func}","args":""}`, "*");
  isPaused = !isPaused;
  document.getElementById('playPauseBtn').innerText = isPaused ? 'Play' : 'Pause';
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

function getCurrentPlaylistFilename() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("playlist");
}

function goToNextPlaylist() {
  const allPlaylists = [
    "Fall2024_Top3.json",
    "Spring2025_Top3.json"
  ];
  const current = getCurrentPlaylistFilename();
  const currentIndex = allPlaylists.indexOf(current);
  const next = allPlaylists[currentIndex + 1];

  if (next) {
    window.location.href = `player.html?playlist=${next}`;
  } else {
    alert("End of all playlists.");
  }
}
