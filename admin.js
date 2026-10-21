const db = window.maaziSupabase;

const $ = (id) => document.getElementById(id);

let products = [];
let orders = [];
let reviews = [];
let photoFiles = [];

function message(text, error = false) {
  const el = $("message");
  if (!el) return;
  el.textContent = text;
  el.style.color = error ? "#ff8b8b" : "#e4c477";
}

function money(value) {
  return "PKR " + Number(value || 0).toLocaleString("en-PK");
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

function showLogin() {
  $("login-form").style.display = "block";
  $("dashboard").style.display = "none";
}

function showDashboard() {
  $("login-form").style.display = "none";
  $("dashboard").style.display = "block";
}

async function loadProducts() {
  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  products = data || [];
  renderProducts();
  $("stat-products").textContent = products.length;

  const { data: variants, error: variantError } = await db
    .from("product_variants")
    .select("stock");

  if (variantError) throw variantError;

  $("stat-stock").textContent =
    (variants || []).reduce((sum, v) => sum + Number(v.stock || 0), 0);
}

function renderProducts() {
  const term = ($("product-search").value || "").toLowerCase();
  const list = $("product-list");

  list.innerHTML = products
    .filter(p => (p.name || "").toLowerCase().includes(term))
    .map(p => `
      <article class="card" style="padding:14px;margin-bottom:12px">
        ${(p.images || []).map(url =>
          `<img src="${escapeHTML(url)}" alt=""
          style="width:65px;height:65px;object-fit:cover;margin:4px;border-radius:6px">`
        ).join("")}
        <h3>${escapeHTML(p.name)}</h3>
        <p class="price">${money(p.price)}</p>
        <p>${escapeHTML(p.category || "")}</p>
        <p>${p.is_active ? "Active" : "Hidden"}</p>
        <button data-edit="${p.id}">EDIT</button>
        <button data-delete="${p.id}">DELETE</button>
      </article>
    `).join("") || "<p>No products found.</p>";
}

async function saveProduct(event) {
  event.preventDefault();
  message("Saving product...");

  try {
    const id = $("product-id").value;
    const name = $("product-name").value.trim();
    const price = Number($("product-price").value);
    const sizes = $("product-sizes").value
      .split(",").map(s => s.trim()).filter(Boolean);
    const stock = Math.max(0, Number($("product-stock").value) || 0);
    const description = $("product-description").value.trim();

    if (!name || !Number.isFinite(price) || price < 0) {
      throw new Error("Product name aur valid price enter karo.");
    }

    const oldProduct = products.find(p => p.id === id);
    const images = [...(oldProduct?.images || [])];

    for (const file of photoFiles) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      const { error: uploadError } = await db.storage
        .from("product-photos")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = db.storage
        .from("product-photos")
        .getPublicUrl(path);

      images.push(data.publicUrl);
    }

    const payload = {
      name,
      price,
      description,
      images,
      is_active: true
    };

    let productId = id;

    if (id) {
      const { error } = await db.from("products")
        .update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await db.from("products")
        .insert(payload).select().single();
      if (error) throw error;
      productId = data.id;
    }

    // Keep existing variants and update stock for each requested size.
    for (const size of sizes) {
      const { data: existing, error } = await db
        .from("product_variants")
        .select("id")
        .eq("product_id", productId)
        .eq("size", size)
        .limit(1);

      if (error) throw error;

      if (existing?.length) {
        const { error: updateError } = await db
          .from("product_variants")
          .update({ stock })
          .eq("id", existing[0].id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await db
          .from("product_variants")
          .insert({
            product_id: productId,
            size,
            color: "",
            stock
          });
        if (insertError) throw insertError;
      }
    }

    $("product-form").reset();
    $("product-id").value = "";
    photoFiles = [];
    $("photo-preview").innerHTML = "";
    await loadProducts();
    message("Product saved successfully!");
  } catch (error) {
    message(error.message || "Product save nahi hua.", true);
  }
}

async function loadOrders() {
  const { data, error } = await db.from("orders")
    .select("*").order("created_at", { ascending: false });

  if (error) throw error;
  orders = data || [];
  $("stat-orders").textContent = orders.length;
  renderOrders();
}

function renderOrders() {
  const term = ($("order-search").value || "").toLowerCase();
  const status = $("order-status-filter").value;

  $("order-list").innerHTML = orders
    .filter(o =>
      (!status || o.status === status) &&
      `${o.order_number || ""} ${o.customer_name || ""} ${o.phone || ""}`
        .toLowerCase().includes(term)
    )
    .map(o => `
      <article class="card" style="padding:14px;margin-bottom:12px">
        <h3>Order ${escapeHTML(o.order_number || o.id)}</h3>
        <p>${escapeHTML(o.customer_name)} · ${escapeHTML(o.phone)}</p>
        <p>${escapeHTML(o.city || "")} — ${escapeHTML(o.address || "")}</p>
        <p class="price">${money(o.total)}</p>
        <p>Advance: ${money(o.advance_amount)} · Due: ${money(o.balance_due)}</p>
        <p>Payment: ${escapeHTML(o.payment_status || "")}</p>
        <p>Transaction: ${escapeHTML(o.transaction_id || "")}</p>
        <p>Current status: ${escapeHTML(o.status || "")}</p>
        <select id="status-${o.id}">
          ${["pending","confirmed","processing","shipped","delivered","cancelled"]
            .map(s => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
        <textarea id="note-${o.id}" placeholder="Admin note">${escapeHTML(o.admin_note || "")}</textarea>
        <button data-order-save="${o.id}">SAVE ORDER UPDATE</button>
      </article>
    `).join("") || "<p>No orders found.</p>";
}

async function updateOrder(id) {
  const status = $(`status-${id}`).value;
  const admin_note = $(`note-${id}`).value;

  const { error } = await db.from("orders")
    .update({ status, admin_note }).eq("id", id);

  if (error) throw error;
  message("Order updated.");
  await loadOrders();
}

async function loadReviews() {
  const { data, error } = await db.from("reviews")
    .select("*").order("created_at", { ascending: false });

  if (error) throw error;
  reviews = data || [];
  $("stat-reviews").textContent = reviews.length;

  $("review-list").innerHTML = reviews.map(r => `
    <article class="card" style="padding:14px;margin-bottom:12px">
      <h3>${escapeHTML(r.customer_name)}</h3>
      <p>Rating: ${Number(r.rating)}/5</p>
      <p>${escapeHTML(r.comment || "")}</p>
      <p>${r.is_approved ? "Approved" : "Pending approval"}</p>
      <button data-review="${r.id}" data-approved="${!r.is_approved}">
        ${r.is_approved ? "HIDE REVIEW" : "APPROVE REVIEW"}
      </button>
    </article>
  `).join("") || "<p>No reviews yet.</p>";
}

async function refreshAll() {
  try {
    message("Loading dashboard...");
    await Promise.all([loadProducts(), loadOrders(), loadReviews()]);
    await loadPaymentSettings();
    message("Dashboard updated.");
  } catch (error) {
    message(error.message || "Dashboard load failed.", true);
  }
}

if (!db) {
  message("Supabase configured nahi hai. supabase.js mein URL aur publishable key check karo.", true);
} else {
  $("login-form").addEventListener("submit", async event => {
    event.preventDefault();
    message("Logging in...");

    const { error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });

    if (error) {
      message(error.message, true);
      return;
    }

    const { data: { user } } = await db.auth.getUser();
    const { data: admin, error: adminError } = await db
      .from("admins").select("user_id").eq("user_id", user.id).maybeSingle();

    if (adminError || !admin) {
      await db.auth.signOut();
      message("Yeh account admins table mein authorized nahi hai.", true);
      return;
    }

    showDashboard();
    await refreshAll();
  });

  $("product-form").addEventListener("submit", saveProduct);
  $("product-search").addEventListener("input", renderProducts);
  $("order-search").addEventListener("input", renderOrders);
  $("order-status-filter").addEventListener("change", renderOrders);
  $("refresh-btn").addEventListener("click", refreshAll);

  $("logout-btn").addEventListener("click", async () => {
    await db.auth.signOut();
    showLogin();
  });

  $("reset-product-btn").addEventListener("click", () => {
    $("product-form").reset();
    $("product-id").value = "";
    photoFiles = [];
    $("photo-preview").innerHTML = "";
  });

  $("product-photos").addEventListener("change", event => {
    photoFiles = Array.from(event.target.files || []);
  });

  $("product-list").addEventListener("click", async event => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;

    try {
      if (editId) {
        const p = products.find(item => item.id === editId);
        if (!p) return;

        $("product-id").value = p.id;
        $("product-name").value = p.name || "";
        $("product-price").value = p.price || 0;
        $("product-description").value = p.description || "";

        const { data: variants, error } = await db
          .from("product_variants").select("size,stock")
          .eq("product_id", p.id);
        if (error) throw error;

        $("product-sizes").value = (variants || []).map(v => v.size).join(", ");
        $("product-stock").value = variants?.[0]?.stock || 0;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (deleteId && confirm("Is product ko delete karna hai?")) {
        const { error: variantError } = await db
          .from("product_variants").delete().eq("product_id", deleteId);
        if (variantError) throw variantError;

        const { error } = await db.from("products")
          .delete().eq("id", deleteId);
        if (error) throw error;

        await loadProducts();
        message("Product deleted.");
      }
    } catch (error) {
      message(error.message, true);
    }
  });

  $("order-list").addEventListener("click", async event => {
    const id = event.target.dataset.orderSave;
    if (!id) return;
    try {
      await updateOrder(id);
    } catch (error) {
      message(error.message, true);
    }
  });

  $("review-list").addEventListener("click", async event => {
    const id = event.target.dataset.review;
    if (!id) return;

    try {
      const is_approved = event.target.dataset.approved === "true";
      const { error } = await db.from("reviews")
        .update({ is_approved }).eq("id", id);
      if (error) throw error;
      await loadReviews();
      message("Review updated.");
    } catch (error) {
      message(error.message, true);
    }
  });

  db.auth.getSession().then(async ({ data }) => {
    if (!data.session) return;
    const { data: { user } } = await db.auth.getUser();
    const { data: admin } = await db.from("admins")
      .select("user_id").eq("user_id", user.id).maybeSingle();

    if (admin) {
      showDashboard();
      await refreshAll();
    }
  });
}
async function loadPaymentSettings() {
  const { data, error } = await db
    .from("settings")
    .select("key, value")
    .in("key", [
      "easypaisa_title",
      "easypaisa_number",
      "advance_instructions"
    ]);

  if (error) throw error;

  const settings = Object.fromEntries(
    (data || []).map(item => [item.key, item.value])
  );

  $("easypaisa-title").value = settings.easypaisa_title || "";
  $("easypaisa-number").value = settings.easypaisa_number || "";
  $("advance-instructions").value =
    settings.advance_instructions || "";
}

async function savePaymentSettings() {
  const msg = $("payment-settings-message");
  msg.textContent = "Saving...";

  try {
    const items = [
      {
        key: "easypaisa_title",
        value: $("easypaisa-title").value.trim()
      },
      {
        key: "easypaisa_number",
        value: $("easypaisa-number").value.trim()
      },
      {
        key: "advance_instructions",
        value: $("advance-instructions").value.trim()
      }
    ];

    for (const item of items) {
      const { error } = await db
        .from("settings")
        .upsert(item, { onConflict: "key" });

      if (error) throw error;
    }

    msg.textContent = "Settings saved successfully!";
  } catch (error) {
    msg.textContent = "Error: " + error.message;
  }
}

if (db) {
  $("save-payment-settings").addEventListener(
    "click",
    savePaymentSettings
  );
}
