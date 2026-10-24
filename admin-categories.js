(() => {
  const D = window.maaziSupabase, g = id => document.getElementById(id);
  if (!D || !g("cp-list")) return;
  let CI = {}, cats = [], pend = {};
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const note = (t, bad) => { try { message(t, bad); } catch { } };

  function toImage(src) {
    return new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error("Photo khul nahi saki. Koi JPG ya PNG photo chunein.")); im.src = src; });
  }
  async function shrink(file) {
    let im, url;
    try { url = URL.createObjectURL(file); im = await toImage(url); }
    catch (e) {
      const data = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error("Photo parh nahi saka.")); r.readAsDataURL(file); });
      im = await toImage(data);
    } finally { if (url) URL.revokeObjectURL(url); }
    const s = Math.min(1, 700 / Math.max(im.width, im.height)), c = document.createElement("canvas");
    c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", .8);
  }

  function draw() {
    g("cp-list").innerHTML = cats.length ? cats.map((c, i) => `
      <article class="card" style="margin:0;background:var(--card2)">
        <h3>${esc(c)}</h3>
        ${CI[c] ? `<img class="cp-img" id="cp-pv${i}" src="${esc(CI[c])}" alt="">` : `<div class="cp-img cp-no" id="cp-pv${i}">No picture yet</div>`}
        <input type="file" accept="image/*" data-cf="${i}">
        <div class="btn-row" style="margin:10px 0 0">
          <button class="btn" type="button" data-cs="${i}">Save picture</button>
          <button class="btn btn-danger" type="button" data-cr="${i}">Remove</button>
        </div>
      </article>`).join("") : '<p class="empty">Pehle products mein category daalein.</p>';
  }

  async function load() {
    try {
      const a = await D.from("products").select("category");
      if (a.error) throw a.error;
      const fromProducts = (a.data || []).map(p => String(p.category || "").trim()).filter(Boolean);
      cats = [...new Set([...fromProducts, "New Arrivals", "Sale"])];
      const r = await D.from("settings").select("key,value").like("key", "cat_img:%");
      if (r.error) throw r.error;
      CI = {}; (r.data || []).forEach(x => CI[x.key.slice(8)] = x.value);
      pend = {}; draw();
    } catch (e) { note("Category pictures load nahi hui: " + e.message, true); }
  }

  function openTab() {
    document.querySelectorAll(".nv").forEach(n => n.classList.toggle("on", n.dataset.view === "catpics"));
    document.querySelectorAll("section.view").forEach(v => v.classList.toggle("on", v.dataset.view === "catpics"));
    const s = g("side"), sc = g("scrim"); if (s) s.classList.remove("show"); if (sc) sc.classList.remove("show");
    load();
  }

  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-view]:not(section)");
    if (t) {
      if (t.dataset.view === "catpics") openTab();
      else { const v = document.querySelector('section.view[data-view="catpics"]'); if (v) v.classList.remove("on"); }
      return;
    }
    const s = e.target.closest("[data-cs]"), r = e.target.closest("[data-cr]");
    if (s) {
      const i = s.dataset.cs, c = cats[i];
      if (!pend[i]) return note("Pehle photo chunein.", true);
      s.disabled = true;
      const { error } = await D.from("settings").upsert({ key: "cat_img:" + c, value: pend[i] }, { onConflict: "key" });
      s.disabled = false;
      if (error) return note("Save nahi hua: " + error.message, true);
      CI[c] = pend[i]; delete pend[i]; note("Picture save ho gayi: " + c);
    }
    if (r) {
      const c = cats[r.dataset.cr];
      const { error } = await D.from("settings").delete().eq("key", "cat_img:" + c);
      if (error) return note("Remove nahi hua: " + error.message, true);
      delete CI[c]; draw(); note("Picture hata di: " + c);
    }
  });

  async function onPick(e) {
    const f = e.target.closest ? e.target.closest("[data-cf]") : null;
    if (!f) return;
    const file = f.files && f.files[0];
    if (!file) { note("Photo input tak nahi pohnchi. Dobara chunein.", true); return; }
    if (f._busy === file) return;
    f._busy = file;
    note("Photo mil gayi (" + Math.round(file.size / 1024) + " KB), tayyar ho rahi hai...");
    try {
      const d = await shrink(file), i = f.dataset.cf; pend[i] = d;
      g("cp-pv" + i).outerHTML = `<img class="cp-img" id="cp-pv${i}" src="${d}" alt="">`;
      note("Preview dekh lein, phir Save picture dabayein.");
    } catch (x) { note("Photo error: " + (x.message || x), true); }
  }
  document.addEventListener("change", onPick);
  document.addEventListener("input", onPick);

  setTimeout(load, 1500);
})();
