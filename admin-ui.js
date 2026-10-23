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
      return `<div class="row" data-oview="1"><div class="i"><b>#${esc(o.order_number || o.id)}</b><small>${esc(o.customer_name || "")} · ${rs(o.total)}</small></div><span class="bd b-${c}">${esc(t)}</span></div>`;
    }).join("") || '<p class="muted">Abhi koi order nahi.</p>';

    $("dash-products").innerHTML = P.slice(0, 5).map(p => {
      const s = stockBy[p.id] || 0, img = Array.isArray(p.images) && p.images[0];
      const b = s === 0 ? '<span class="bd b-bad">Sold out</span>' : s <= 3 ? '<span class="bd b-warn">Low Stock</span>' : '<span class="bd b-ok">In Stock</span>';
      return `<div class="pc" data-pedit="${esc(p.id)}"><div class="im">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : "No photo"}</div><b>${esc(p.name)}</b><small>${rs(p.price)}</small>${b}</div>`;
    }).join("") || '<p class="muted">Abhi koi product nahi.</p>';
  }

  let timer;
  const later = () => { clearTimeout(timer); timer = setTimeout(build, 250); };
  const obs = new MutationObserver(later);
  ["stat-products", "stat-orders", "stat-reviews", "stat-stock"].forEach(id => obs.observe($(id), { childList: true, characterData: true, subtree: true }));
  new MutationObserver(later).observe($("dashboard"), { attributes: true, attributeFilter: ["class"] });
  later();
})();
