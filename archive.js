// archive.js – Handles archive filters and playlist creation

let masterSongs = [];
let filteredSongs = [];
const masterJSON = "master_songs.json";

// Load and initialize
fetch(masterJSON)
  .then(res => res.json())
  .then(data => {
    masterSongs = data;
    filteredSongs = [...masterSongs];
    populateAllFilters(masterSongs);
    renderTable(filteredSongs);
  })
  .catch(err => console.error("Failed to load master_songs.json:", err));

// Filter setup
function populateAllFilters(data) {
  populateFilter("seasonFilter", [...new Set(data.map(s => s.season))]);
  populateFilter("submitterFilter", [...new Set(data.map(s => s.submitter))]);
  populateFilter("rankFilter", [...new Set(data.map(s => s.rank))].sort((a, b) => a - b));
}

function populateFilter(id, values) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = "";
  values.forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    select.appendChild(opt);
  });
}

function getSelectedValues(id) {
  const select = document.getElementById(id);
  return select ? Array.from(select.selectedOptions).map(opt => opt.value) : [];
}

// Filtering
function applyFilters() {
  const selectedSeasons = getSelectedValues("seasonFilter");
  const selectedSubmitters = getSelectedValues("submitterFilter");
  const selectedRanks = getSelectedValues("rankFilter");

  filteredSongs = masterSongs.filter(song => {
    return (
      (selectedSeasons.length === 0 || selectedSeasons.includes(song.season)) &&
      (selectedSubmitters.length === 0 || selectedSubmitters.includes(song.submitter)) &&
      (selectedRanks.length === 0 || selectedRanks.includes(song.rank?.toString()))
    );
  });

  updateAvailableOptions();
  renderTable(filteredSongs);
}

function updateAvailableOptions() {
  populateFilter("submitterFilter", [...new Set(filteredSongs.map(s => s.submitter))]);
  populateFilter("rankFilter", [...new Set(filteredSongs.map(s => s.rank))].sort((a, b) => a - b));
}

// Reset
function resetFilters() {
  document.querySelectorAll("select").forEach(select => select.selectedIndex = -1);
  filteredSongs = [...masterSongs];
  populateAllFilters(masterSongs);
  renderTable(filteredSongs);
}

// Render
function renderTable(data) {
  const tbody = document.getElementById("songTableBody");
  tbody.innerHTML = "";
  data.forEach(song => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${song.season || ''}</td>
      <td>${song.round_name || ''}</td>
      <td>${song.song_title || ''}</td>
      <td>${song.artist || ''}</td>
      <td>${song.submitter || ''}</td>
      <td>${song.score || ''}</td>
      <td>${song.rank || ''}</td>
    `;
    tbody.appendChild(row);
  });
  document.getElementById("resultCount").textContent = data.length;
}

// Playlist
function promptCreatePlaylist() {
  const modal = document.getElementById("playlistModal");
  const summary = [
    { key: "Season", val: getSelectedValues("seasonFilter") },
    { key: "Submitter", val: getSelectedValues("submitterFilter") },
    { key: "Rank", val: getSelectedValues("rankFilter") }
  ]
    .filter(item => item.val.length > 0)
    .map(item => `${item.key}: ${item.val.join(", ")}`)
    .join(" | ");

  document.getElementById("filterSummary").textContent = summary || "None (all songs)";
  document.getElementById("playlistName").value = "";
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("playlistModal");
  if (modal) modal.style.display = "none";
}

function createPlaylist() {
  const name = document.getElementById("playlistName").value.trim();
  localStorage.setItem("filteredPlaylist", JSON.stringify(filteredSongs));
  window.location.href = `player.html?fromFilter=1`;
}

// Wire up buttons
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("applyBtn")?.addEventListener("click", applyFilters);
  document.getElementById("resetBtn")?.addEventListener("click", resetFilters);
  document.getElementById("createBtn")?.addEventListener("click", promptCreatePlaylist);
});
