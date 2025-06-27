// archive.js – Handles archive filters, search, and playlist creation

let masterSongs = [];
let filteredSongs = [];
const masterJSON = "master_songs.json";

// Load and initialize
fetch(masterJSON)
  .then(res => res.json())
  .then(data => {
    console.log("✅ Loaded master_songs.json with", data.length, "songs");
    masterSongs = data;
    filteredSongs = [...masterSongs];
    populateAllFilters(masterSongs);
    renderTable(filteredSongs);
  })
  .catch(err => console.error("❌ Failed to load master_songs.json:", err));

function populateAllFilters(data) {
  populateFilter("seasonFilter", [...new Set(data.map(s => s.season))], "All Seasons");
  populateFilter("submitterFilter", [...new Set(data.map(s => s.submitter))], "All Submitters");
  populateFilter("rankFilter", [...new Set(data.map(s => s.rank))].sort((a, b) => a - b), "All Ranks");
}

function populateFilter(id, items, label) {
  const select = document.getElementById(id);
  if (!select) return;
  select.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = label;
  select.appendChild(allOpt);

  items.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });
}

function getSelectedValues(id) {
  const select = document.getElementById(id);
  const values = select ? Array.from(select.selectedOptions).map(opt => opt.value).filter(Boolean) : [];
  console.log(`🧮 Filter [${id}] →`, values);
  return values;
}

function getSearchTerm() {
  const val = document.getElementById("searchBox")?.value?.trim().toLowerCase() || "";
  console.log("🔍 Search term:", val);
  return val;
}

// Filtering
function applyFilters() {
  const seasons = getSelectedValues("seasonFilter");
  const submitters = getSelectedValues("submitterFilter");
  const ranks = getSelectedValues("rankFilter");
  const searchTerm = getSearchTerm();

  filteredSongs = masterSongs.filter(song => {
    const matchesFilters =
      (seasons.length === 0 || seasons.includes(song.season)) &&
      (submitters.length === 0 || submitters.includes(song.submitter)) &&
      (ranks.length === 0 || ranks.includes(song.rank?.toString()));

    const matchesSearch =
      !searchTerm || Object.values(song).some(val => String(val).toLowerCase().includes(searchTerm));

    return matchesFilters && matchesSearch;
  });

  console.log("🎯 Matched", filteredSongs.length, "songs");
  renderTable(filteredSongs);
}

// Reset
function resetFilters() {
  document.querySelectorAll("select").forEach(sel => sel.selectedIndex = 0);
  document.getElementById("searchBox").value = "";
  filteredSongs = [...masterSongs];
  populateAllFilters(masterSongs);
  renderTable(filteredSongs);
}

// Render
function renderTable(songs) {
  const tbody = document.getElementById("songTableBody");
  tbody.innerHTML = "";
  songs.forEach(song => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${song.season}</td>
      <td>${song.round_name}</td>
      <td>${song.song_title}</td>
      <td>${song.artist}</td>
      <td>${song.submitter}</td>
      <td>${song.score}</td>
      <td>${song.rank}</td>
    `;
    tbody.appendChild(row);
  });
  document.getElementById("resultCount").textContent = `${songs.length} song(s) displayed`;
}

// Playlist
function promptCreatePlaylist() {
  const modal = document.getElementById("playlistModal");
  const summary = [
    { key: "Season", val: getSelectedValues("seasonFilter") },
    { key: "Submitter", val: getSelectedValues("submitterFilter") },
    { key: "Rank", val: getSelectedValues("rankFilter") }
  ]
    .filter(item => item.val.length)
    .map(item => `${item.key}: ${item.val.join(", ")}`)
    .join(" | ");

  document.getElementById("filterSummary").textContent = summary || "None (all songs)";
  document.getElementById("playlistName").value = "";
  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("playlistModal").style.display = "none";
}

function createPlaylist() {
  const name = document.getElementById("playlistName").value.trim();

  try {
    localStorage.setItem("filteredPlaylist", JSON.stringify(filteredSongs));
    console.log("💾 Saved", filteredSongs.length, "songs to localStorage");
  } catch (e) {
    console.error("❌ Failed to save to localStorage", e);
  }

  const params = new URLSearchParams();
  if (name) params.set("name", name);
  params.set("fromFilter", "1");
  window.location.href = `player.html?${params.toString()}`;
}

// Wire up buttons
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ archive.js DOM ready");
  document.getElementById("applyBtn")?.addEventListener("click", applyFilters);
  document.getElementById("resetBtn")?.addEventListener("click", resetFilters);
  document.getElementById("createBtn")?.addEventListener("click", promptCreatePlaylist);
});
