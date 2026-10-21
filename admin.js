const db = window.maaziSupabase;

const $ = (id) => document.getElementById(id);

let products = [];
let orders = [];
let reviews = [];
let photoFiles = [];

function message(text, error = false) {
  const loginPanel = $("login-panel");
  const isLoggedOut =
    loginPanel && loginPanel.style.display !== "none";

  const el = isLoggedOut
    ? $("login-message")
    : $("message");

  if (!el) return;

  el.textContent = text;
  el.style.color = error ? "#ff8b8b" : "#e4c477";
}

function money(value) {
  return "PKR " + Number(value || 0).toLocaleString("en-PK");
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
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
  const {
    data: { user },
    error: userError
  } = await db.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User login verify nahi hua.");

  const { data: admin, error: adminError } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    throw new Error(
      "Admin verification failed: " + adminError.message
    );
  }

  if (!admin) {
    await db.auth.signOut();
    showLogin();
    throw new Error(
      "Yeh account admins table mein authorized nahi hai."
    );
  }

  return user;
}

/* =========================
   PRODUCTS
========================= */

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

  $("stat-stock").textContent = (variants || []).reduce(
    (sum, variant) => sum + Number(variant.stock || 0),
    0
  );
}

function renderProducts() {
  const term = ($("product-search").value || "")
    .toLowerCase()
    .trim();

  const list = $("product-list");

  const filtered = products.filter((product) =>
    (product.name || "").toLowerCase().includes(term)
  );

  list.innerHTML = filtered.map((product) => `
    <article class="card"
      style="padding:14px;margin-bottom:12px">

      ${(Array.isArray(product.images) ? product.images : [])
        .map((url) => `
          <img
            src="${escapeHTML(url)}"
            alt="${escapeHTML(product.name || "Product photo")}"
            loading="lazy"
            style="width:65px;height:65px;object-fit:cover;
                   margin:4px;border-radius:6px">
        `).join("")}

      <h3>${escapeHTML(product.name || "")}</h3>
      <p class="price">${money(product.price)}</p>
      <p>${escapeHTML(product.category || "")}</p>
      <p>${product.is_active ? "Active" : "Hidden"}</p>

      <button type="button" data-edit="${escapeHTML(product.id)}">
        EDIT
      </button>

      <button type="button" data-delete="${escapeHTML(product.id)}">
        DELETE
      </button>
    </article>
  `).join("") || '<p class="empty">No products found.</p>';
}

async function saveProduct(event) {
  event.preventDefault();

  const saveButton = $("save-product-btn");
  saveButton.disabled = true;

  try {
    message("Saving product...");

    const id = $("product-id").value;
    const name = $("product-name").value.trim();
    const price = Number($("product-price").value);

    const sizes = [
      ...new Set(
        $("product-sizes").value
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean)
      )
    ];

    const stock = Number($("product-stock").value);
    const description = $("product-description").value.trim();

    if (!name) {
      throw new Error("Product name enter karo.");
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Valid product price enter karo.");
    }

    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("Stock zero ya positive whole number hona chahiye.");
    }

    const oldProduct = products.find(
      (product) => String(product.id) === String(id)
    );

    const images = [
      ...(Array.isArray(oldProduct?.images)
        ? oldProduct.images
        : [])
    ];

    // Upload selected photos to Supabase Storage.
    for (const file of photoFiles) {
      if (!file.type.startsWith("image/")) {
        throw new Error("Sirf image files upload kar sakte ho.");
      }

      const safeName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const uniqueName =
        `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

      const { error: uploadError } = await db.storage
        .from("product-photos")
        .upload(uniqueName, file, {
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = db.storage
        .from("product-photos")
        .getPublicUrl(uniqueName);

      if (publicData?.publicUrl) {
        images.push(publicData.publicUrl);
      }
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
      const { error } = await db
        .from("products")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
    } else {
      const { data, error } = await db
        .from("products")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      productId = data.id;
    }

    // Create or update variants for the sizes entered.
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
    $("photo-preview").replaceChildren();
    photoFiles = [];

    await loadProducts();
    message("Product saved successfully!");

  } catch (error) {
    message(
      "Product save error: " +
      (error.message || "Product save nahi hua."),
      true
    );
  } finally {
    saveButton.disabled = false;
  }
}

/* =========================
   ORDERS
========================= */

async function loadOrders() {
  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  orders = data || [];
  $("stat-orders").textContent = orders.length;

  renderOrders();
}

function renderOrders() {
  const term = ($("order-search").value || "")
    .toLowerCase()
    .trim();

  const status = $("order-status-filter").value.toLowerCase();

  const filtered = orders.filter((order) => {
    const orderStatus = String(order.status || "").toLowerCase();

    const searchText = [
      order.order_number,
      order.customer_name,
      order.phone
    ].join(" ").toLowerCase();

    return (
      (!status || orderStatus === status) &&
      searchText.includes(term)
    );
  });

  $("order-list").innerHTML = filtered.map((order) => {
    const currentStatus = String(
      order.status || "pending"
    ).toLowerCase();

    const statuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ];

    return `
      <article class="card"
        style="padding:14px;margin-bottom:12px">

        <h3>Order ${escapeHTML(order.order_number || order.id)}</h3>

        <p>
          ${escapeHTML(order.customer_name || "")}
          · ${escapeHTML(order.phone || "")}
        </p>

        <p>
          ${escapeHTML(order.city || "")}
          — ${escapeHTML(order.address || "")}
        </p>

        <p class="price">${money(order.total)}</p>

        <p>
          Advance: ${money(order.advance_amount)}
          · Due: ${money(order.balance_due)}
        </p>

        <p>Payment: ${escapeHTML(order.payment_status || "")}</p>
        <p>Transaction: ${escapeHTML(order.transaction_id || "")}</p>
        <p>Current status: ${escapeHTML(order.status || "pending")}</p>

        <label for="status-${escapeHTML(order.id)}">
          Update order status
        </label>

        <select id="status-${escapeHTML(order.id)}">
          ${statuses.map((value) => `
            <option value="${value}"
              ${currentStatus === value ? "selected" : ""}>
              ${value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          `).join("")}
        </select>

        <label for="note-${escapeHTML(order.id)}">
          Admin note
        </label>

        <textarea id="note-${escapeHTML(order.id)}"
          placeholder="Admin note">${escapeHTML(order.admin_note || "")}</textarea>

        <button type="button"
          data-order-save="${escapeHTML(order.id)}">
          SAVE ORDER UPDATE
        </button>
      </article>
    `;
  }).join("") || '<p class="empty">No orders found.</p>';
}

async function updateOrder(id) {
  const statusField = $(`status-${id}`);
  const noteField = $(`note-${id}`);

  if (!statusField || !noteField) {
    throw new Error("Order fields nahi milay.");
  }

  const { error } = await db
    .from("orders")
    .update({
      status: statusField.value,
      admin_note: noteField.value.trim()
    })
    .eq("id", id);

  if (error) throw error;

  await loadOrders();
  message("Order updated successfully.");
}

/* =========================
   CUSTOMER REVIEWS
========================= */

async function loadReviews() {
  const { data, error } = await db
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  reviews = data || [];
  $("stat-reviews").textContent = reviews.length;

  $("review-list").innerHTML = reviews.map((review) => `
    <article class="card"
      style="padding:14px;margin-bottom:12px">

      <h3>${escapeHTML(review.customer_name || "Customer")}</h3>

      <p>Rating: ${Number(review.rating || 0)}/5</p>

      <p>${escapeHTML(review.comment || "")}</p>

      <p>
        ${review.is_approved ? "Approved" : "Pending approval"}
      </p>

      <button
        type="button"
        data-review="${escapeHTML(review.id)}"
        data-approved="${!review.is_approved}">
        ${review.is_approved ? "HIDE REVIEW" : "APPROVE REVIEW"}
      </button>
    </article>
  `).join("") || '<p class="empty">No reviews yet.</p>';
}

async function updateReview(id, isApproved) {
  const { error } = await db
    .from("reviews")
    .update({ is_approved: isApproved })
    .eq("id", id);

  if (error) throw error;

  await loadReviews();
  message("Review updated successfully.");
}

/* =========================
   PAYMENT SETTINGS
========================= */

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
    (data || []).map((item) => [
      item.key,
      item.value
    ])
  );

  $("easypaisa-title").value =
    settings.easypaisa_title || "";

  $("easypaisa-number").value =
    settings.easypaisa_number || "";

  $("advance-instructions").value =
    settings.advance_instructions || "";
}

async function savePaymentSettings() {
  const msg = $("payment-settings-message");
  const button = $("save-payment-settings");

  button.disabled = true;
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
    msg.style.color = "#e4c477";

  } catch (error) {
    msg.textContent = "Error: " + error.message;
    msg.style.color = "#ff8b8b";
  } finally {
    button.disabled = false;
  }
}

/* =========================
   DASHBOARD REFRESH
========================= */

async function refreshAll() {
  try {
    message("Loading dashboard...");

    await Promise.all([
      loadProducts(),
      loadOrders(),
      loadReviews(),
      loadPaymentSettings()
    ]);

    message("Dashboard updated.");

  } catch (error) {
    message(
      "Dashboard error: " +
      (error.message || "Data load nahi hua."),
      true
    );
  }
}

/* =========================
   INITIALIZATION & EVENTS
========================= */

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
  message(
    "Supabase configured nahi hai. supabase.js mein URL aur publishable key check karo.",
    true
  );
} else {
  // Login
  $("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const loginButton = event.submitter;
    if (loginButton) loginButton.disabled = true;

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
      message(
        "Login error: " + (error.message || "Unknown error"),
        true
      );
    } finally {
      if (loginButton) loginButton.disabled = false;
    }
  });

  // Product form
  $("product-form").addEventListener("submit", saveProduct);

  $("product-search").addEventListener("input", renderProducts);

  $("order-search").addEventListener("input", renderOrders);

  $("order-status-filter").addEventListener(
    "change",
    renderOrders
  );

  $("refresh-btn").addEventListener("click", refreshAll);

  // Logout
  $("logout-btn").addEventListener("click", async () => {
    try {
      const { error } = await db.auth.signOut();
      if (error) throw error;

      products = [];
      orders = [];
      reviews = [];
      photoFiles = [];

      showLogin();
      $("login-message").textContent = "You have logged out.";

    } catch (error) {
      message("Logout error: " + error.message, true);
    }
  });

  // Clear product form
  $("reset-product-btn").addEventListener("click", () => {
    $("product-form").reset();
    $("product-id").value = "";
    $("photo-preview").replaceChildren();
    photoFiles = [];
  });

  // Track selected photos
  $("product-photos").addEventListener("change", (event) => {
    photoFiles = Array.from(event.target.files || []);
  });

  // Edit and delete products
  $("product-list").addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const editId = button.dataset.edit;
    const deleteId = button.dataset.delete;

    try {
      if (editId) {
        const product = products.find(
          (item) => String(item.id) === String(editId)
        );

        if (!product) return;

        $("product-id").value = product.id;
        $("product-name").value = product.name || "";
        $("product-price").value = product.price ?? 0;
        $("product-description").value =
          product.description || "";

        $("product-photos").value = "";
        $("photo-preview").replaceChildren();
        photoFiles = [];

        const { data: variants, error } = await db
          .from("product_variants")
          .select("size, stock")
          .eq("product_id", product.id);

        if (error) throw error;

        $("product-sizes").value = (variants || [])
          .map((variant) => variant.size)
          .filter(Boolean)
          .join(", ");

        $("product-stock").value =
          variants?.[0]?.stock ?? 0;

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }

      if (
        deleteId &&
        confirm("Is product ko delete karna hai?")
      ) {
        // Delete variants first to avoid foreign-key conflicts.
        const { error: variantError } = await db
          .from("product_variants")
          .delete()
          .eq("product_id", deleteId);

        if (variantError) throw variantError;

        const { error } = await db
          .from("products")
          .delete()
          .eq("id", deleteId);

        if (error) throw error;

        await loadProducts();
        message("Product deleted successfully.");
      }

    } catch (error) {
      message(
        "Product error: " + (error.message || "Operation failed."),
        true
      );
    }
  });

  // Update orders
  $("order-list").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-order-save]");
    if (!button) return;

    try {
      button.disabled = true;
      await updateOrder(button.dataset.orderSave);
    } catch (error) {
      message("Order error: " + error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  // Approve or hide reviews
  $("review-list").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-review]");
    if (!button) return;

    try {
      button.disabled = true;

      await updateReview(
        button.dataset.review,
        button.dataset.approved === "true"
      );

    } catch (error) {
      message("Review error: " + error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  // Save payment settings
  $("save-payment-settings").addEventListener(
    "click",
    savePaymentSettings
  );

  // Restore an existing session, if authorized.
  db.auth.getSession().then(async ({ data, error }) => {
    if (error) {
      showLogin();
      message("Session error: " + error.message, true);
      return;
    }

    if (data.session) {
      await initializeDashboard();
    } else {
      showLogin();
    }
  });
}
