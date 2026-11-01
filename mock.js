(() => {
  const palette = [["#e9c3bb", "#d78c83"], ["#d9d0e8", "#8b7b9b"], ["#d3e0cc", "#758b6c"], ["#f2e3b8", "#bd9853"]];
  const svg = (index, label) => {
    const [light, dark] = palette[index % palette.length];
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><rect width="480" height="480" fill="${light}"/><circle cx="330" cy="150" r="90" fill="${dark}" opacity=".35"/><path d="M0 400 Q120 300 240 380 T480 340 V480 H0Z" fill="${dark}" opacity=".5"/><text x="30" y="60" font-family="Georgia,serif" font-size="26" fill="#4a4540">${label}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  };
  const day = 86400000;
  const iso = (daysAgo) => new Date(Date.now() - daysAgo * day).toISOString();
  let signedIn = false;
  let entries = [
    { id: "e1", kind: "memory", title: "That perfect rainy afternoon", body: "Sample text: tea, a long walk, and no plans at all.", createdAt: iso(3), photos: ["demo-photo-0"] },
    { id: "e2", kind: "letter", title: "Open when you miss me", body: null, createdAt: iso(2), unlockAt: new Date(Date.now() + 30 * day).toISOString(), photos: [] },
    { id: "e3", kind: "checkin", title: "Sunday check-in", body: "Sample text: feeling calm and a little sleepy. Pancakes?", createdAt: iso(1), photos: [] },
    { id: "e4", kind: "date", title: "Sunset picnic", body: "Sample text: blanket, snacks, and a playlist we both pick.", createdAt: iso(0), photos: [] },
  ];
  let gallery = ["A little moment", "Sample caption", "Another sample", "Placeholder photo"].map((caption, index) => ({
    id: `demo-gallery-${index}`, caption, createdAt: iso(index + 1),
  }));
  const uploads = new Map();

  window.demoPhotoUrl = (id) => uploads.get(id) || svg(Number(id.match(/\d+$/)?.[0] || 0), "sample photo");

  const reply = (status, value) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
  const toPublic = (entry) => (entry.kind === "letter" && entry.unlockAt && Date.parse(entry.unlockAt) > Date.now() ? { ...entry, body: null, photos: [] } : entry);

  window.fetch = async (url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};
    if (url === "/api/login") { signedIn = true; return reply(200, { ok: true }); }
    if (url === "/api/logout") { signedIn = false; return reply(200, { ok: true }); }
    if (!signedIn) return reply(401, { error: "Please sign in first." });

    if (url === "/api/entries" && method === "GET") return reply(200, entries.map(toPublic));
    if (url === "/api/entries" && method === "POST") {
      const photoIds = (body.photos || []).map((photo) => {
        const id = `upload-${crypto.randomUUID()}`;
        uploads.set(id, photo.data);
        return id;
      });
      entries = [{ id: crypto.randomUUID(), kind: body.kind, title: body.title, body: body.body, createdAt: new Date().toISOString(), photos: photoIds, ...(body.unlockAt ? { unlockAt: body.unlockAt } : {}) }, ...entries];
      return reply(201, entries.map(toPublic));
    }
    if (url.startsWith("/api/entries/") && method === "DELETE") {
      entries = entries.filter((entry) => entry.id !== url.split("/").pop());
      return reply(200, entries.map(toPublic));
    }
    if (url === "/api/gallery" && method === "GET") return reply(200, gallery);
    if (url === "/api/gallery" && method === "POST") {
      const id = `upload-${crypto.randomUUID()}`;
      uploads.set(id, body.photo);
      gallery = [{ id, caption: body.caption || "", createdAt: new Date().toISOString() }, ...gallery];
      return reply(201, gallery);
    }
    if (url.startsWith("/api/gallery/") && method === "DELETE") {
      gallery = gallery.filter((photo) => photo.id !== decodeURIComponent(url.split("/").pop()));
      return reply(200, gallery);
    }
    return reply(404, { error: "Not found." });
  };
})();
