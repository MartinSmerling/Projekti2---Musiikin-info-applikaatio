const API_ROOT = "https://ws.audioscrobbler.com/2.0/";
const API_KEY = "ce4f93baf229be04a509abe144f52e54"; 

const PRESET_ARTISTS = [
  "Taylor Swift",
  "Coldplay",
  "Metallica",
  "Adele",
  "Rammstein",
  "Aurora"
];

document.addEventListener("DOMContentLoaded", () => {
  const artistListEl = document.getElementById("artist-list");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const albumsContainer = document.getElementById("albums");
  const currentArtistTitle = document.getElementById("current-artist-title");

  PRESET_ARTISTS.forEach((artistName) => {
    const btn = document.createElement("button");
    btn.className = "artist-btn";
    btn.textContent = artistName;

    btn.addEventListener("click", () => {
      setActiveArtistButton(artistName);
      loadArtistAlbums(artistName);
    });

    artistListEl.appendChild(btn);
  });

  function setActiveArtistButton(artistName) {
    const buttons = artistListEl.querySelectorAll(".artist-btn");
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.textContent === artistName);
    });
  }

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault(); 
    const artistName = searchInput.value.trim();
    if (!artistName) return;

    setActiveArtistButton(""); 
    loadArtistAlbums(artistName);
  });

  if (PRESET_ARTISTS.length > 0) {
    const firstArtist = PRESET_ARTISTS[0];
    setActiveArtistButton(firstArtist);
    loadArtistAlbums(firstArtist);
  }


  async function loadArtistAlbums(artistName) {
    currentArtistTitle.textContent = `Albumit – ${artistName}`;
    albumsContainer.innerHTML = `<p class="status">Ladataan albumeita haulle <strong>${artistName}</strong>...</p>`;

    const url =
      `${API_ROOT}?method=artist.gettopalbums` +
      `&artist=${encodeURIComponent(artistName)}` +
      `&limit=6` + 
      `&api_key=${API_KEY}` +
      `&format=json`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.error) {
        albumsContainer.innerHTML = `<p class="status error">API virhe: ${data.message}</p>`;
        return;
      }

      if (!data.topalbums || !data.topalbums.album || data.topalbums.album.length === 0) {
        albumsContainer.innerHTML = `<p class="status">Ei löytynyt albumeita haulle "${artistName}".</p>`;
        return;
      }

      const albums = Array.isArray(data.topalbums.album)
        ? data.topalbums.album
        : [data.topalbums.album];

      albumsContainer.innerHTML = "";
      for (const album of albums) {
        renderAlbumCard(album);
      }
    } catch (error) {
      console.error("Virhe kappaleita ladattaessa:", error);
      albumsContainer.innerHTML = `<p class="status error">Jotain meni pieleen. Ole hyvä ja yritä uudelleen.</p>`;
    }
  }


  async function renderAlbumCard(album) {
    const images = album.image || [];
    let imgUrl = "";
    if (images.length > 0) {
      const extraLarge = images.find((img) => img.size === "extralarge");
      const large = images.find((img) => img.size === "large");
      const chosen = extraLarge || large || images[images.length - 1];
      imgUrl = chosen["#text"] || "";
    }

    const artistName =
      typeof album.artist === "string" ? album.artist : album.artist.name;

    const card = document.createElement("article");
    card.className = "album-card";

    card.innerHTML = `
      <img
        class="album-cover"
        src="${imgUrl || "https://via.placeholder.com/300?text=No+Image"}"
        alt="Cover of ${album.name}"
      />
      <div class="album-info">
        <h3 title="${album.name}">${album.name}</h3>
        <p class="album-artist">${artistName}</p>
        <ul class="track-list">
          <li>Ladataan kappaleita...</li>
        </ul>
      </div>
    `;

    albumsContainer.appendChild(card);

    const trackListEl = card.querySelector(".track-list");
    await loadAlbumTracks(artistName, album.name, trackListEl);
  }


  async function loadAlbumTracks(artistName, albumName, trackListEl) {
    const url =
      `${API_ROOT}?method=album.getinfo` +
      `&artist=${encodeURIComponent(artistName)}` +
      `&album=${encodeURIComponent(albumName)}` +
      `&api_key=${API_KEY}` +
      `&format=json`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Verkkovirhe kappaleita ladattaessa");
      }

      const data = await response.json();

      if (data.error || !data.album || !data.album.tracks) {
        trackListEl.innerHTML = `<li>No track data available.</li>`;
        return;
      }

      let tracks = data.album.tracks.track;
      if (!tracks) {
        trackListEl.innerHTML = `<li>No track data available.</li>`;
        return;
      }
      if (!Array.isArray(tracks)) {
        tracks = [tracks];
      }

      trackListEl.innerHTML = "";
      tracks.slice(0, 5).forEach((track, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${track.name}`;
        trackListEl.appendChild(li);
      });
    } catch (error) {
      console.error("Virhe kappaleiden latauksessa:", error);
      trackListEl.innerHTML = `<li>Could not load tracks.</li>`;
    }
  }
});
