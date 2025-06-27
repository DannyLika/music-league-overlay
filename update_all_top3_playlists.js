// update_all_top3_playlists.js

const fs = require('fs');
const path = require('path');

// Load master songs
const master = JSON.parse(fs.readFileSync('master_songs.json', 'utf8'));

// Build a lookup map by spotify_uri
const masterMap = {};
for (const song of master) {
  if (song.spotify_uri) {
    masterMap[song.spotify_uri] = song;
  }
}

// Get all Top 3 playlist files
const playlistsDir = 'playlists';
const files = fs.readdirSync(playlistsDir).filter(f => f.endsWith('_Top3.json'));

for (const file of files) {
  const filePath = path.join(playlistsDir, file);
  const top3 = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Replace each song with the master version if found
  const updated = top3.map(song => {
    if (song.spotify_uri && masterMap[song.spotify_uri]) {
      return masterMap[song.spotify_uri];
    } else {
      console.warn(`No master match for: ${song.song_title} by ${song.artist} in ${file}`);
      return song;
    }
  });

  // Write back to the same file (overwrite)
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
  console.log(`${file} updated from master_songs.json!`);
}

console.log('All Top 3 playlists updated!');