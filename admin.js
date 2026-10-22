const db = window.maaziSupabase;
const $ = (id) => document.getElementById(id);

let products = [];
let orders = [];
let reviews = [];
let photoFiles = [];

function message(text, error = false) {
  const loginPanel = $("login-panel");
  const loggedOut = loginPanel && loginPanel.style.display !== "none";
  const el = loggedOut ? $("login-message") : $("message");
  if (!el) return;
  el.textContent = text;
  el.style.color = error ? "#ff8b8b" : "#e4c477";
}

function money(value) {
  return "PKR " + Number(value || 0).toLocaleString("en-PK");
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function showLogin() {
  $("login-panel").style.display = "block";
  $("dashboard").classList.add("hidden");
}

function showDashboard() {
  $("login-panel").style.display = "none";
  $("dashboard").classList.remove("hidden");
}

async function verifyAdmin() {
  const { data: { user }, error } = await db.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("User login verify nahi hua.");

  const { data: admin, error: adminError } = await db
    .from("admins").select("user_id").eq("user_id", user.id).maybeSingle();

  if (adminError) throw new Error("Admin verification failed: " + adminError.message);

  if (!admin) {
    await db.auth.signOut();
    showLogin();
    throw new Error("Yeh account admins table mein authorized nahi hai.");
  }
  return user;
}

/* PRODUCTS */

async function loadProducts() {
  const { data, error } = await db.from("products")
    .select("*").order("created_at", { ascending: false });
  if (error) throw error;

  products = data || [];
  renderProducts();
  $("stat-products").textContent = products.length;

  const { data: variants, error: variantError } = await db
    .from("product_variants").select("stock");
  if (variantError) throw variantError;

  $("stat-stock").textContent = (variants || []).reduce(
    (sum, v) => sum + Number(v.stock || 0), 0
  );
}

function renderProducts() {
  const term = ($("product-search").value || "").toLowerCase().trim();
  const filtered = products.filter(p => (p.name || "").toLowerCase().includes(term));

  $("product-list").innerHTML = filtered.map(p => `
    <article class="card" style="padding:14px;margin-bottom:12px">
      ${(Array.isArray(p.images) ? p.images : []).map(url => `
        <img src="${escapeHTML(url)}" alt="${escapeHTML(p.name || "Product")}"
          loading="lazy" style="width:65px;height:65px;object-fit:cover;margin:4px;border-radius:6px">
      `).join("")}
      <h3>${escapeHTML(p.name || "")}</h3>
      <p class="price">${money(p.price)}${Number(p.old_price) > Number(p.price) ? ` <s style="opacity:.6">${money(p.old_price)}</s> · Sale` : ""}</p>
      <p>Category: ${escapeHTML(p.category || "— (not set)")}</p>
      <p>${p.is_active ? "Active" : "Hidden"}</p>
      <button type="button" data-edit="${escapeHTML(p.id)}">EDIT</button>
      <button type="button" data-delete="${escapeHTML(p.id)}">DELETE</button>
    </article>
  `).join("") || '<p class="empty">No products found.</p>';
}

function setSizeRows(rows = []) {
  const box = $("size-rows");
  if (!box) return;

  box.replaceChildren();
  (rows.length ? rows : [{ size: "", stock: "" }]).forEach(v => {
    const row = document.createElement("div");
    row.className = "size-row";
    row.innerHTML = `
      <input class="sz-name" maxlength="40" placeholder="Size e.g. M, L, XL">
      <input class="sz-stock" type="number" min="0" step="1" placeholder="Stock">
      <button type="button" class="btn btn-danger sz-del">Remove</button>
    `;
    row.querySelector(".sz-name").value = v.size || "";
    row.querySelector(".sz-stock").value = v.stock ?? "";
    box.appendChild(row);
  });
}

function readSizeRows() {
  const box = $("size-rows");
  if (!box) throw new Error("HTML mein size-rows element nahi mila.");

  const result = [];
  const seen = new Set();

  box.querySelectorAll(".size-row").forEach(row => {
    const size = row.querySelector(".sz-name").value.trim();
    const raw = row.querySelector(".sz-stock").value.trim();
    if (!size && !raw) return;
    if (!size) throw new Error("Stock ke saath size ka naam bhi likhein.");

    const stock = Number(raw === "" ? 0 : raw);
    if (!Number.isInteger(stock) || stock < 0)
      throw new Error(size + " ka stock valid whole number hona chahiye.");

    if (seen.has(size.toLowerCase())) throw new Error(size + " do dafa likha hai.");
    seen.add(size.toLowerCase());
    result.push({ size, stock });
  });

  if (!result.length) throw new Error("Kam az kam ek size aur stock enter karein.");
  return result;
}

function setEditing(name = "") {
  const banner = $("edit-banner");
  if (banner) {
    banner.textContent = name
      ? "Editing: " + name + ". Tabdeeli karke Update product dabayein."
      : "";
    banner.classList.toggle("hidden", !name);
  }
  $("save-product-btn").textContent = name ? "Update product" : "Save product";
}

async function saveProduct(event) {
  event.preventDefault();
  const button = $("save-product-btn");
  button.disabled = true;

  try {
    message("Saving product...");
    const id = $("product-id").value;
    const name = $("product-name").value.trim();
    const price = Number($("product-price").value);
    const description = $("product-description").value.trim();
    const category = $("product-category").value.trim();
    const oldRaw = $("product-old-price").value.trim();
    const old_price = oldRaw === "" ? null : Number(oldRaw);

    if (!name) throw new Error("Product name enter karo.");
    if (!Number.isFinite(price) || price < 0) throw new Error("Valid product price enter karo.");
    if (old_price !== null && (!Number.isFinite(old_price) || old_price <= price))
      throw new Error("Old price, current price se zyada honi chahiye (ya khali chhodein).");

    const sizes = readSizeRows();
    const old = products.find(p => String(p.id) === String(id));
    const images = [...(Array.isArray(old?.images) ? old.images : [])];

    for (const file of photoFiles) {
      if (!file.type.startsWith("image/")) throw new Error("Sirf image files upload kar sakte ho.");
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`;

      const { error } = await db.storage.from("product-photos")
        .upload(filename, file, { upsert: false });
      if (error) throw error;

      const { data } = db.storage.from("product-photos").getPublicUrl(filename);
      if (data?.publicUrl) images.push(data.publicUrl);
    }

    const payload = { name, price, description, images, category: category || null, old_price, is_active: true };
    let productId = id;

    if (id) {
      const { error } = await db.from("products").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await db.from("products").insert(payload).select().single();
      if (error) throw error;
      productId = data.id;
    }

    const { data: existing, error: exError } = await db
      .from("product_variants").select("id, size").eq("product_id", productId);
    if (exError) throw exError;

    for (const s of sizes) {
      const match = (existing || []).find(v => v.size === s.size);
      if (match) {
        const { error } = await db.from("product_variants")
          .update({ stock: s.stock }).eq("id", match.id);
        if (error) throw error;
      } else {
        const { error } = await db.from("product_variants").insert({
          product_id: productId, size: s.size, color: "", stock: s.stock
        });
        if (error) throw error;
      }
    }

    const keep = new Set(sizes.map(s => s.size));
    for (const v of existing || []) {
      if (!v.size || keep.has(v.size)) continue;
      const { error } = await db.from("product_variants").delete().eq("id", v.id);
      if (error) {
        const { error: fallbackError } = await db.from("product_variants")
          .update({ stock: 0 }).eq("id", v.id);
        if (fallbackError) throw fallbackError;
      }
    }

    $("product-form").reset();
    $("product-id").value = "";
    $("photo-preview").replaceChildren();
    photoFiles = [];
    await loadProducts();
    message("Product saved successfully!");
  } catch (error) {
    message("Product save error: " + (error.message || "Product save nahi hua."), true);
  } finally {
    button.disabled = false;
  }
}

/* ORDERS */

async function loadOrders() {
  const { data, error } = await db.from("orders")
    .select("*").order("created_at", { ascending: false });
  if (error) throw error;
  orders = data || [];
  $("stat-orders").textContent = orders.length;
  renderOrders();
}

function renderOrders() {
  const term = ($("order-search").value || "").toLowerCase().trim();
  const status = $("order-status-filter").value.toLowerCase();

  const filtered = orders.filter(o => {
    const text = [o.order_number, o.customer_name, o.phone].join(" ").toLowerCase();
    return (!status || String(o.status || "").toLowerCase() === status) && text.includes(term);
  });

  const statuses = ["payment_submitted", "pending_payment", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  $("order-list").innerHTML = filtered.map(o => {
    const current = String(o.status || "pending").toLowerCase();
    const options = statuses.includes(current) ? statuses : [current, ...statuses];
    return `
      <article class="card" style="padding:14px;margin-bottom:12px">
        <h3>Order ${escapeHTML(o.order_number || o.id)}</h3>
        <p>${escapeHTML(o.customer_name || "")} · ${escapeHTML(o.phone || "")}</p>
        <p>${escapeHTML(o.city || "")} — ${escapeHTML(o.address || "")}</p>
        <p class="price">${money(o.total)}</p>
        <p>Advance: ${money(o.advance_amount)} · Due on delivery: ${money(o.balance_due)}</p>
        <p>Payment: ${escapeHTML(o.payment_status || "")}</p>
        <p>Transaction: ${escapeHTML(o.transaction_id || "")}</p>
        ${o.payment_proof_url ? `<button type="button" data-proof="${escapeHTML(o.payment_proof_url)}">VIEW PAYMENT PROOF</button>` : "<p>No payment proof</p>"}
        <p>Current status: ${escapeHTML(o.status || "pending")}</p>
        <label for="status-${escapeHTML(o.id)}">Update order status</label>
        <select id="status-${escapeHTML(o.id)}">
          ${options.map(s => `<option value="${s}" ${current === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <label for="note-${escapeHTML(o.id)}">Admin note</label>
        <textarea id="note-${escapeHTML(o.id)}" placeholder="Admin note">${escapeHTML(o.admin_note || "")}</textarea>
        <button type="button" data-order-save="${escapeHTML(o.id)}">SAVE ORDER UPDATE</button>
      </article>`;
  }).join("") || '<p class="empty">No orders found.</p>';
}

async function updateOrder(id) {
  const status = $(`status-${id}`);
  const note = $(`note-${id}`);
  if (!status || !note) throw new Error("Order fields nahi milay.");

  const { error } = await db.from("orders").update({
    status: status.value, admin_note: note.value.trim()
  }).eq("id", id);
  if (error) throw error;
  await loadOrders();
  message("Order updated successfully.");
}

/* REVIEWS */

async function loadReviews() {
  const { data, error } = await db.from("reviews")
    .select("*").order("created_at", { ascending: false });
  if (error) throw error;
  reviews = data || [];
  $("stat-reviews").textContent = reviews.length;

  $("review-list").innerHTML = reviews.map(r => `
    <article class="card" style="padding:14px;margin-bottom:12px">
      <h3>${escapeHTML(r.customer_name || "Customer")}</h3>
      <p>Rating: ${Number(r.rating || 0)}/5</p>
      <p>${escapeHTML(r.comment || "")}</p>
      <p>${r.is_approved ? "Approved" : "Pending approval"}</p>
      <button type="button" data-review="${escapeHTML(r.id)}"
        data-approved="${!r.is_approved}">
        ${r.is_approved ? "HIDE REVIEW" : "APPROVE REVIEW"}
      </button>
    </article>
  `).join("") || '<p class="empty">No reviews yet.</p>';
}

async function updateReview(id, approved) {
  const { error } = await db.from("reviews").update({ is_approved: approved }).eq("id", id);
  if (error) throw error;
  await loadReviews();
  message("Review updated successfully.");
}

/* PAYMENT SETTINGS */

async function loadPaymentSettings() {
  const { data, error } = await db.from("settings")
    .select("key, value")
    .in("key", ["easypaisa_title", "easypaisa_number", "advance_instructions"]);
  if (error) throw error;

  const settings = Object.fromEntries((data || []).map(s => [s.key, s.value]));
  $("easypaisa-title").value = settings.easypaisa_title || "";
  $("easypaisa-number").value = settings.easypaisa_number || "";
  $("advance-instructions").value = settings.advance_instructions || "";
}

async function savePaymentSettings() {
  const msg = $("payment-settings-message");
  const button = $("save-payment-settings");
  button.disabled = true;
  msg.textContent = "Saving...";

  try {
    const items = [
      { key: "easypaisa_title", value: $("easypaisa-title").value.trim() },
      { key: "easypaisa_number", value: $("easypaisa-number").value.trim() },
      { key: "advance_instructions", value: $("advance-instructions").value.trim() }
    ];

    for (const item of items) {
      const { error } = await db.from("settings").upsert(item, { onConflict: "key" });
      if (error) throw error;
    }
    msg.textContent = "Settings saved successfully!";
    msg.style.color = "#e4c477";
  } catch (error) {
    msg.textContent = "Error: " + error.message;
    msg.style.color = "#ff8b8b";
  } finally {
    button.disabled = false;
  }
}

/* REFRESH + LOGIN */

async function refreshAll() {
  try {
    message("Loading dashboard...");
    await Promise.all([loadProducts(), loadOrders(), loadReviews(), loadPaymentSettings()]);
    message("Dashboard updated.");
  } catch (error) {
    message("Dashboard error: " + error.message, true);
  }
}

async function initializeDashboard() {
  try {
    await verifyAdmin();
    showDashboard();
    await refreshAll();
  } catch (error) {
    showLogin();
    message(error.message || "Admin verification failed.", true);
  }
}

if (!db) {
  showLogin();
  message("Supabase configured nahi hai. supabase.js mein URL aur key check karo.", true);
} else {
  $("login-form").addEventListener("submit", async event => {
    event.preventDefault();
    const button = event.submitter;
    if (button) button.disabled = true;
    $("login-message").textContent = "Logging in...";

    try {
      const { error } = await db.auth.signInWithPassword({
        email: $("email").value.trim(),
        password: $("password").value
      });
      if (error) throw error;
      await initializeDashboard();
    } catch (error) {
      showLogin();
      message("Login error: " + error.message, true);
    } finally {
      if (button) button.disabled = false;
    }
  });

  // Size controls
  if ($("size-rows") && $("add-size")) {
    setSizeRows();
    $("add-size").addEventListener("click", () => {
      const box = $("size-rows");
      const row = document.createElement("div");
      row.className = "size-row";
      row.innerHTML = `
        <input class="sz-name" maxlength="40" placeholder="Size e.g. M, L, XL">
        <input class="sz-stock" type="number" min="0" step="1" placeholder="Stock">
        <button type="button" class="btn btn-danger sz-del">Remove</button>`;
      box.appendChild(row);
    });

    $("size-rows").addEventListener("click", event => {
      const button = event.target.closest(".sz-del");
      if (!button) return;
      button.closest(".size-row").remove();
      if (!$("size-rows").children.length) setSizeRows();
    });

    $("product-form").addEventListener("reset", () => {
      setTimeout(() => setSizeRows(), 0);
      setEditing("");
    });
  }

  // Product form: only this handler saves products.
  $("product-form").addEventListener("submit", saveProduct);
  $("product-search").addEventListener("input", renderProducts);
  $("order-search").addEventListener("input", renderOrders);
  $("order-status-filter").addEventListener("change", renderOrders);
  $("refresh-btn").addEventListener("click", refreshAll);

  $("logout-btn").addEventListener("click", async () => {
    const { error } = await db.auth.signOut();
    if (error) {
      message("Logout error: " + error.message, true);
      return;
    }
    products = [];
    orders = [];
    reviews = [];
    photoFiles = [];
    showLogin();
    $("login-message").textContent = "You have logged out.";
  });

  $("reset-product-btn").addEventListener("click", () => {
    $("product-form").reset();
    $("product-id").value = "";
    $("photo-preview").replaceChildren();
    photoFiles = [];
    setEditing("");
  });

  $("product-photos").addEventListener("change", event => {
    photoFiles = Array.from(event.target.files || []);
  });

  // Product edit and delete
  $("product-list").addEventListener("click", async event => {
    const button = event.target.closest("button");
    if (!button) return;

    try {
      if (button.dataset.edit) {
        const p = products.find(x => String(x.id) === String(button.dataset.edit));
        if (!p) return;

        $("product-id").value = p.id;
        $("product-name").value = p.name || "";
        $("product-price").value = p.price ?? 0;
        $("product-category").value = p.category || "";
        $("product-old-price").value = p.old_price ?? "";
        $("product-description").value = p.description || "";
        $("product-photos").value = "";
        $("photo-preview").replaceChildren();
        photoFiles = [];

        const { data, error } = await db.from("product_variants")
          .select("size, stock").eq("product_id", p.id);
        if (error) throw error;

        if ($("size-rows")) {
          setSizeRows((data || []).filter(v => v.size)
            .map(v => ({ size: v.size, stock: v.stock })));
        }
        setEditing(p.name || "product");
        $("product-form").scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (button.dataset.delete && confirm("Is product ko delete karna hai?")) {
        const id = button.dataset.delete;
        const { error: variantError } = await db.from("product_variants")
          .delete().eq("product_id", id);
        if (variantError) throw variantError;

        const { error } = await db.from("products").delete().eq("id", id);
        if (error) throw error;
        await loadProducts();
        message("Product deleted successfully.");
      }
    } catch (error) {
      message("Product error: " + error.message, true);
    }
  });

  $("order-list").addEventListener("click", async event => {
    const proofBtn = event.target.closest("button[data-proof]");
    if (proofBtn) {
      const w = window.open("", "_blank");
      const { data, error } = await db.storage
        .from("payment-proofs").createSignedUrl(proofBtn.dataset.proof, 300);
      if (error || !data) {
        if (w) w.close();
        message("Proof error: " + (error?.message || "link nahi ban saka"), true);
        return;
      }
      if (w) w.location.href = data.signedUrl;
      return;
    }

    const button = event.target.closest("button[data-order-save]");
    if (!button) return;
    button.disabled = true;
    try {
      await updateOrder(button.dataset.orderSave);
    } catch (error) {
      message("Order error: " + error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  $("review-list").addEventListener("click", async event => {
    const button = event.target.closest("button[data-review]");
    if (!button) return;
    button.disabled = true;
    try {
      await updateReview(button.dataset.review, button.dataset.approved === "true");
    } catch (error) {
      message("Review error: " + error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  $("save-payment-settings").addEventListener("click", savePaymentSettings);

  db.auth.getSession().then(async ({ data, error }) => {
    if (error) {
      showLogin();
      message("Session error: " + error.message, true);
    } else if (data.session) {
      await initializeDashboard();
    } else {
      showLogin();
    }
  });
}

/* Add stock details to each product card */
const productListElement = $("product-list");
if (productListElement) {
  let stockLoading = false;

  async function showStockLines() {
    if (stockLoading) return;
    const cards = [...productListElement.querySelectorAll("article.card")]
      .filter(card => !card.dataset.sz);
    if (!cards.length) return;

    stockLoading = true;
    try {
      const { data, error } = await db.from("product_variants")
        .select("product_id, size, stock");
      if (error) throw error;

      cards.forEach(card => {
        card.dataset.sz = "1";
        const id = card.querySelector("[data-edit]")?.dataset.edit;
        const variants = (data || []).filter(v =>
          String(v.product_id) === String(id) && v.size
        );
        const p = document.createElement("p");
        p.className = "sizes-line";
        p.textContent = variants.length
          ? variants.map(v => `${v.size} — stock ${v.stock}`).join(" | ")
          : "Sizes abhi add nahi huay";
        (card.querySelector(".price") || card.querySelector("h3"))?.after(p);
      });
    } catch (error) {
      console.error("Stock display error:", error);
    } finally {
      stockLoading = false;
    }
  }

  new MutationObserver(showStockLines).observe(productListElement, {
    childList: true, subtree: true
  });
}
