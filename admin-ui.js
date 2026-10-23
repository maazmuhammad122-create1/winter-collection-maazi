/* Maazi admin look: navigation + dashboard widgets.
   Does not change admin.js; it only reads the data admin.js already loads. */
(() => {
  const $ = id => document.getElementById(id);
  const rs = n => "PKR " + Number(n || 0).toLocaleString("en-US");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ST = { pending_payment: ["Pending", "warn"], payment_submitted: ["Pending", "warn"], pending: ["Pending", "warn"], confirmed: ["Paid", "ok"], processing: ["Processing", "proc"], shipped: ["Shipped", "proc"], delivered: ["Delivered", "ok"], cancelled: ["Cancelled", "bad"] };
  const lab = o => ST[String(o.status || "pending").toLowerCase()] || [String(o.status || "pending"), "warn"];
  const stockBy = {};
  let view = "dash";

  function show(v) {
    view = v;
    document.querySelectorAll(".view").forEach(s => s.classList.toggle("on", s.dataset.view === v));
    document.querySelectorAll(".nv[data-view]").forEach(b => b.classList.toggle("on", b.dataset.view === v));
    $("side").classList.remove("show");
    $("scrim").classList.remove("show");
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-view]");
    if (t) return show(t.dataset.view);
    const p = e.target.closest("[data-pedit]");
    if (p) {
      show("products");
      const b = document.querySelector('#product-list [data-edit="' + p.dataset.pedit + '"]');
      if (b) b.click();
      return;
    }
    if (e.target.closest("[data-oview]")) show("orders");
    if (e.target.closest("#qa-add")) {
      show("products");
      $("product-name").focus();
    }
  });

  $("burger").onclick = () => { $("side").classList.add("show"); $("scrim").classList.add("show"); };
  $("scrim").onclick = () => { $("side").classList.remove("show"); $("scrim").classList.remove("show"); };
  document.addEventListener("keydown", e => { if (e.key === "Escape") $("scrim").onclick(); });

  $("gsearch").addEventListener("input", e => {
    const v = e.target.value;
    $("product-search").value = v;
    $("order-search").value = v;
    $("product-search").dispatchEvent(new Event("input"));
    $("order-search").dispatchEvent(new Event("input"));
    if (view !== "products" && view !== "orders") show("products");
  });

  async function loadStock() {
    const db = window.maaziSupabase;
    if (!db) return;
    try {
      const { data } = await db.from("product_variants").select("product_id,stock");
      Object.keys(stockBy).forEach(k => delete stockBy[k]);
      (data || []).forEach(v => { stockBy[v.product_id] = (stockBy[v.product_id] || 0) + (Number(v.stock) || 0); });
    } catch (e) { console.warn(e); }
  }

  async function build() {
    if ($("dashboard").classList.contains("hidden")) return;
    await loadStock();
    await loadThumbs();
    const P = typeof products !== "undefined" ? products : [];
    const O = typeof orders !== "undefined" ? orders : [];
    const R = typeof reviews !== "undefined" ? reviews : [];
    const live = O.filter(o => String(o.status).toLowerCase() !== "cancelled");
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
    const vals = days.map(d => live.filter(o => new Date(o.created_at).toDateString() === d.toDateString()).reduce((t, o) => t + Number(o.total || 0), 0));
    const mx = Math.max(1000, ...vals), W = 560, H = 210;
    const pts = vals.map((v, i) => [40 + i * (W - 60) / 6, H - 30 - (v / mx) * (H - 60)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    $("dash-chart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;stroke:none"><defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4af6a" stop-opacity=".35"/><stop offset="1" stop-color="#d4af6a" stop-opacity="0"/></linearGradient></defs>${[0, .5, 1].map(t => `<line x1="40" x2="${W - 20}" y1="${H - 30 - t * (H - 60)}" y2="${H - 30 - t * (H - 60)}" stroke="#33291a"/><text x="34" y="${H - 26 - t * (H - 60)}" fill="#a79b82" font-size="11" text-anchor="end">${Math.round(mx * t / 100) / 10}K</text>`).join("")}<path d="${line} L${pts[6][0]} ${H - 30} L${pts[0][0]} ${H - 30}Z" fill="url(#gg)"/><path d="${line}" fill="none" stroke="#e6c887" stroke-width="2.2"/>${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#e6c887"/>`).join("")}${days.map((d, i) => `<text x="${pts[i][0]}" y="${H - 8}" fill="#a79b82" font-size="11" text-anchor="middle">${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</text>`).join("")}</svg>`;

    const pend = O.filter(o => lab(o)[0] === "Pending").length;
    const lowN = P.filter(p => (stockBy[p.id] || 0) <= 3).length;
    const newR = R.filter(r => !r.is_approved).length;
    const todayN = O.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;
    $("d-rev").textContent = rs(live.reduce((t, o) => t + Number(o.total || 0), 0));
    $("d-pend").textContent = pend;
    $("d-low").textContent = lowN;
    $("sub-orders").textContent = todayN ? "↑ " + todayN + " today" : "";
    $("sub-reviews").textContent = newR ? "↑ " + newR + " new" : "";
    $("nb-orders").textContent = pend || "";
    $("nb-reviews").textContent = newR || "";
    $("today").textContent = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

    $("dash-orders").innerHTML = O.slice(0, 5).map(o => {
      const [t, c] = lab(o);
      return `<div class="row" data-oview="1">${thumbHTML(o.id)}<div class="i"><b>#${esc(o.order_number || o.id)}</b><small>${esc(o.customer_name || "")}</small><small>${rs(o.total)}</small></div><div class="rt"><span class="bd b-${c}">${esc(t)}</span><small>${fmtD(o.created_at)}</small></div></div>`;
    }).join("") || '<p class="muted">Abhi koi order nahi.</p>';

    $("dash-products").innerHTML = P.slice(0, 5).map(p => {
      const s = stockBy[p.id] || 0, img = Array.isArray(p.images) && p.images[0];
      const b = s === 0 ? '<span class="bd b-bad">Sold out</span>' : s <= 3 ? '<span class="bd b-warn">Low Stock</span>' : '<span class="bd b-ok">In Stock</span>';
      return `<div class="pc" data-pedit="${esc(p.id)}"><div class="im">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : "No photo"}</div><b>${esc(p.name)}</b><small>${rs(p.price)}</small>${b}</div>`;
    }).join("") || '<p class="muted">Abhi koi product nahi.</p>';
    fillThumbs();
  }

  /* ---- Orders: thumbnails, card header, delete ---- */
  const css = document.createElement("style");
  css.textContent = ".th{width:48px;height:56px;border-radius:8px;overflow:hidden;background:#0e0c08;border:1px solid #33291a;flex:none}.th img{width:100%;height:100%;object-fit:cover;display:block}.ohead{display:flex;gap:12px;align-items:center;padding-bottom:10px;border-bottom:1px solid #33291a;margin-bottom:4px}.ohead .i{flex:1;min-width:0}.ohead b{display:block;font-size:14px}.ohead small,.row .i small{display:block;color:#a79b82;font-size:12px}.rt{text-align:right}.rt small{display:block;color:#a79b82;font-size:11px;margin-top:4px}#order-list .card h3{display:none}#order-list .card button[data-odel]{background:none;border:1px solid #5a2a28;color:#f09a96;border-radius:10px;padding:10px;font-weight:600;margin-top:4px;cursor:pointer}#order-list .card button[data-odel]:disabled{opacity:.5}";
  document.head.appendChild(css);

  const fmtD = d => { try { return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
  const thumbBy = {};

  async function loadThumbs() {
    const db = window.maaziSupabase;
    if (!db) return;
    try {
      const [it, vr] = await Promise.all([db.from("order_items").select("*"), db.from("product_variants").select("id,product_id")]);
      if (it.error) return;
      const v2p = {};
      (vr.data || []).forEach(v => { v2p[v.id] = v.product_id; });
      const P = typeof products !== "undefined" ? products : [];
      (it.data || []).forEach(i => {
        if (thumbBy[i.order_id]) return;
        const pid = i.product_id || v2p[i.variant_id];
        const p = P.find(x => String(x.id) === String(pid));
        const img = p && Array.isArray(p.images) && p.images[0];
        if (img) thumbBy[i.order_id] = img;
      });
    } catch (e) { console.warn(e); }
  }

  const thumbHTML = id => `<div class="th" data-oth="${esc(id)}">${thumbBy[id] ? `<img src="${esc(thumbBy[id])}" alt="" loading="lazy">` : ""}</div>`;

  function fillThumbs() {
    document.querySelectorAll("[data-oth]").forEach(el => {
      const u = thumbBy[el.dataset.oth];
      if (u && !el.firstChild) el.innerHTML = `<img src="${esc(u)}" alt="" loading="lazy">`;
    });
  }

  function decorate() {
    const O = typeof orders !== "undefined" ? orders : [];
    document.querySelectorAll("#order-list article.card").forEach(card => {
      if (card.dataset.dec) return;
      const id = card.querySelector("[data-order-save]")?.dataset.orderSave;
      if (!id) return;
      card.dataset.dec = "1";
      const o = O.find(x => String(x.id) === String(id));
      const [t, c] = o ? lab(o) : ["", "warn"];
      const head = document.createElement("div");
      head.className = "ohead";
      head.innerHTML = thumbHTML(id) + `<div class="i"><b>#${esc(o?.order_number || id)}</b><small>${esc(o?.customer_name || "")} · ${rs(o?.total)}</small></div><span class="bd b-${c}">${esc(t)}</span>`;
      card.prepend(head);
      const del = document.createElement("button");
      del.type = "button";
      del.dataset.odel = id;
      del.textContent = "DELETE ORDER";
      card.appendChild(del);
    });
    fillThumbs();
  }
  new MutationObserver(decorate).observe($("order-list"), { childList: true });

  $("order-list").addEventListener("click", async e => {
    const b = e.target.closest("[data-odel]");
    if (!b) return;
    if (!confirm("Is order ko hamesha ke liye delete karna hai? Ye wapas nahi ho sakta.")) return;
    const db = window.maaziSupabase, id = b.dataset.odel, msg = $("message");
    b.disabled = true;
    try {
      let r = await db.from("order_items").delete().eq("order_id", id);
      if (r.error && !/does not exist|schema cache/i.test(r.error.message)) throw r.error;
      r = await db.from("orders").delete().eq("id", id).select("id");
      if (r.error) throw r.error;
      if (!r.data || !r.data.length) throw new Error("Supabase ne delete allow nahi kiya (delete policy chahiye).");
      msg.textContent = "Order deleted.";
      $("refresh-btn").click();
    } catch (err) {
      msg.textContent = "Order delete error: " + (err.message || err);
      b.disabled = false;
    }
  });
  decorate();

  let timer;
  const later = () => { clearTimeout(timer); timer = setTimeout(build, 250); };
  const obs = new MutationObserver(later);
  ["stat-products", "stat-orders", "stat-reviews", "stat-stock"].forEach(id => obs.observe($(id), { childList: true, characterData: true, subtree: true }));
  new MutationObserver(later).observe($("dashboard"), { attributes: true, attributeFilter: ["class"] });
  later();
})();
