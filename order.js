const db = window.maaziSupabase;
const $ = id => document.getElementById(id);

let productList = [];
let variantList = [];
let selectedProduct = null;
let selectedVariant = null;

function showMessage(message, error = false) {
  const el = $("form-message");
  if (!el) return;
  el.textContent = message;
  el.style.color = error ? "#ff8b8b" : "#e4c477";
}

function formatPKR(amount) {
  return "PKR " + Number(amount || 0).toLocaleString("en-PK");
}

function makeOrderNumber() {
  return "MAZ-" + Date.now().toString().slice(-9);
}

function setOptions(select, placeholder, items, getLabel) {
  select.replaceChildren();

  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);

  items.forEach(item => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = getLabel(item);
    select.appendChild(option);
  });
}

function updateTotal() {
  selectedProduct =
    productList.find(p => String(p.id) === $("product_id").value) || null;

  selectedVariant =
    variantList.find(v => String(v.id) === $("variant_id").value) || null;

  const qty = Math.max(1, Number($("qty").value) || 1);
  const total = selectedProduct ? Number(selectedProduct.price) * qty : 0;

  $("total-display").textContent = "Total: " + formatPKR(total);

  $("product-summary").textContent = selectedProduct
    ? selectedProduct.name
    : "Your selected product will appear here.";

  const advanceMode = $("advance").checked;
  const advanceInput = $("advance_amount");

  advanceInput.required = advanceMode;
  $("transaction_id").required = advanceMode;
  $("payment_proof").required = advanceMode;

  if (advanceMode) {
    advanceInput.max = String(total);
    if (Number(advanceInput.value) > total) {
      advanceInput.value = total || "";
    }
  } else {
    advanceInput.value = "";
    $("transaction_id").value = "";
    $("payment_proof").value = "";
  }

  const advance = advanceMode ? Number(advanceInput.value || 0) : 0;

  $("balance-display").textContent =
    "Balance Due: " + formatPKR(Math.max(0, total - advance));
}

async function loadProducts() {
  const productSelect = $("product_id");
  productSelect.innerHTML = '<option value="">Loading products...</option>';

  if (!db) {
    throw new Error("Supabase connection nahi mili. supabase.js check karein.");
  }

  const { data, error } = await db
    .from("products")
    .select("id,name,price,description,images,is_active")
    .eq("is_active", true);

  if (error) throw error;

  productList = data || [];

  productList.sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );

  setOptions(
    productSelect,
    productList.length ? "Choose product" : "No active products found",
    productList,
    p => `${p.name} — ${formatPKR(p.price)}`
  );

  const requestedId = new URLSearchParams(location.search).get("product");

  if (requestedId && productList.some(p => String(p.id) === requestedId)) {
    productSelect.value = requestedId;
    await loadVariants(requestedId);
  } else {
    selectedProduct = null;
    selectedVariant = null;
    variantList = [];
    setOptions($("variant_id"), "Select a product first", [], () => "");
  }

  updateTotal();

  if (!productList.length) {
    showMessage(
      "Koi active product nahi mila. Supabase mein products aur is_active check karein.",
      true
    );
  }
}

async function loadVariants(productId) {
  selectedProduct =
    productList.find(p => String(p.id) === String(productId)) || null;

  selectedVariant = null;
  variantList = [];

  if (!selectedProduct) {
    setOptions($("variant_id"), "Select a product first", [], () => "");
    updateTotal();
    return;
  }

  setOptions($("variant_id"), "Loading sizes / colours...", [], () => "");

  const { data, error } = await db
    .from("product_variants")
    .select("id,product_id,size,color,stock")
    .eq("product_id", productId)
    .gt("stock", 0);

  if (error) throw error;

  variantList = data || [];

  variantList.sort((a, b) => {
    const sizeCompare = String(a.size || "").localeCompare(String(b.size || ""));
    return sizeCompare || String(a.color || "").localeCompare(String(b.color || ""));
  });

  setOptions(
    $("variant_id"),
    variantList.length ? "Choose size / colour" : "Currently out of stock",
    variantList,
    v => {
      const label = [v.size, v.color].filter(Boolean).join(" / ");
      return `${label || "Standard"} — ${v.stock} available`;
    }
  );

  updateTotal();

  if (!variantList.length) {
    showMessage(
      "Is product ka available size/colour nahi mila. product_variants mein product_id aur stock check karein.",
      true
    );
  } else {
    showMessage("");
  }
}

async function loadEasypaisaSettings() {
  const titleEl = $("easypaisa-account-title");
  const numberEl = $("easypaisa-account-number");
  const instructionsEl = $("easypaisa-payment-instructions");

  try {
    const { data, error } = await db
      .from("settings")
      .select("key,value")
      .in("key", [
        "easypaisa_title",
        "easypaisa_number",
        "advance_instructions"
      ]);

    if (error) throw error;

    const settings = Object.fromEntries(
      (data || []).map(item => [item.key, item.value])
    );

    titleEl.textContent =
      settings.easypaisa_title || "Account details will be updated soon";

    numberEl.textContent =
      settings.easypaisa_number || "Not available yet";

    instructionsEl.textContent =
      settings.advance_instructions ||
      "Please contact the store before making payment.";
  } catch (error) {
    titleEl.textContent = "Temporarily unavailable";
    numberEl.textContent = "Please contact the store";
    instructionsEl.textContent = "Payment details could not be loaded.";

    console.error("Easypaisa settings error:", error);
  }
}

async function uploadPaymentProof(file) {
  if (!file) {
    throw new Error("Payment screenshot select karein.");
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Screenshot JPG, PNG ya WebP format mein honi chahiye.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Payment screenshot 5 MB se chhoti honi chahiye.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueId = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const path = `${uniqueId}-${safeName}`;

  const { error } = await db.storage
    .from("payment-proofs")
    .upload(path, file, { upsert: false });

  if (error) {
    console.error("Payment proof upload error:", error);
    throw new Error(
      "Screenshot upload nahi hua. Supabase payment-proofs bucket aur upload permissions check karein."
    );
  }

  return path;
}

async function submitOrder(event) {
  event.preventDefault();

  if (!db) {
    showMessage("Supabase connection configured nahi hai.", true);
    return;
  }

  const button = $("submit-btn");
  button.disabled = true;
  button.textContent = "PLEASE WAIT...";

  let proofPath = null;
  let createdOrderId = null;

  try {
    const product = productList.find(
      p => String(p.id) === $("product_id").value
    );

    const variant = variantList.find(
      v => String(v.id) === $("variant_id").value
    );

    const qty = Number($("qty").value);
    const paymentMethod = document.querySelector(
      'input[name="payment_method"]:checked'
    )?.value;

    if (!product) {
      throw new Error("Product select karein.");
    }

    if (!variant || String(variant.product_id) !== String(product.id)) {
      throw new Error("Is product ka available size / colour select karein.");
    }

    if (!Number.isInteger(qty) || qty < 1 || qty > 20 || qty > Number(variant.stock)) {
      throw new Error("Quantity available stock ke mutabiq enter karein.");
    }

    if (!["COD", "ADVANCE"].includes(paymentMethod)) {
      throw new Error("Payment method select karein.");
    }

    const total = Number(product.price) * qty;

    if (!Number.isFinite(total) || total <= 0) {
      throw new Error("Product ki price valid nahi hai.");
    }

    let advance = 0;
    let transactionId = null;

    if (paymentMethod === "ADVANCE") {
      advance = Number($("advance_amount").value);
      transactionId = $("transaction_id").value.trim();

      if (!Number.isInteger(advance) || advance < 1 || advance > total) {
        throw new Error("Valid advance amount enter karein.");
      }

      if (!transactionId) {
        throw new Error("Transaction ID enter karein.");
      }

      proofPath = await uploadPaymentProof($("payment_proof").files[0]);
    }

    showMessage("Order save ho raha hai...");

    const orderPayload = {
      order_number: makeOrderNumber(),
      customer_name: $("customer_name").value.trim(),
      phone: $("phone").value.trim(),
      city: $("city").value.trim(),
      address: $("address").value.trim(),
      total: total,
      advance_amount: advance,
      balance_due: total - advance,
      status: "pending",
      payment_method: paymentMethod,
      payment_status:
        paymentMethod === "COD" ? "pending" : "verification_pending",
      transaction_id: transactionId,
      payment_proof_url: proofPath,
      payment_deadline: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
      admin_note: null
    };

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert(orderPayload)
      .select("id,order_number")
      .single();

    if (orderError) {
  console.error("Order insert error:", orderError);

  throw new Error(
    "Code: " + (orderError.code || "N/A") +
    " | Message: " + orderError.message +
    " | Details: " + (orderError.details || "N/A") +
    " | Hint: " + (orderError.hint || "N/A")
  );
}

    createdOrderId = order.id;

    const { error: itemError } = await db.from("order_items").insert({
      order_id: order.id,
      variant_id: variant.id,
      product_name: product.name,
      size: variant.size,
      color: variant.color || "",
      qty: qty,
      unit_price: Number(product.price)
    });

    if (itemError) {
      console.error("Order item save error:", itemError);
      throw new Error(
        "Order record ban gaya, lekin order item save nahi hua. Admin se order verify karwayein. Error: " +
        itemError.message
      );
    }

    createdOrderId = null;

    $("order-form").reset();
    $("advance-fields").style.display = "none";

    setOptions($("variant_id"), "Select a product first", [], () => "");
    $("product_id").value = "";

    selectedProduct = null;
    selectedVariant = null;
    variantList = [];

    updateTotal();

    showMessage(
      `Order submitted! Order number: ${order.order_number}. ` +
      (paymentMethod === "ADVANCE"
        ? "Payment verification pending hai."
        : "Payment delivery par hogi.")
    );
  } catch (error) {
    console.error("Order submission error:", error);

    if (createdOrderId) {
      showMessage(
        "Order save ho gaya tha, lekin item save nahi hua. Dobara order submit na karein; admin se order verify karwayein. Error: " +
        (error.message || String(error)),
        true
      );
    } else {
      showMessage(
        error.message || "Order submit nahi ho saka. Dobara koshish karein.",
        true
      );
    }
  } finally {
    button.disabled = false;
    button.textContent = "SUBMIT ORDER";
  }
}

function updatePaymentFields() {
  const isAdvance = $("advance").checked;
  $("advance-fields").style.display = isAdvance ? "block" : "none";
  updateTotal();
}

function startOrderPage() {
  if (!db) {
    showMessage(
      "Supabase connection nahi mili. supabase.js mein URL aur publishable key check karein.",
      true
    );

    $("product_id").innerHTML =
      '<option value="">Database connection unavailable</option>';

    return;
  }

  $("product_id").addEventListener("change", async event => {
    try {
      showMessage("");
      await loadVariants(event.target.value);
    } catch (error) {
      console.error("Variant loading error:", error);
      setOptions($("variant_id"), "Could not load sizes / colours", [], () => "");
      showMessage("Size / colour error: " + (error.message || String(error)), true);
    }
  });

  $("variant_id").addEventListener("change", updateTotal);
  $("qty").addEventListener("input", updateTotal);
  $("advance_amount").addEventListener("input", updateTotal);

  $("cod").addEventListener("change", updatePaymentFields);
  $("advance").addEventListener("change", updatePaymentFields);

  $("order-form").addEventListener("submit", submitOrder);

  updatePaymentFields();

  loadProducts().catch(error => {
    console.error("Products loading error:", error);

    $("product_id").innerHTML =
      '<option value="">Products could not load</option>';

    setOptions($("variant_id"), "Select a product first", [], () => "");

    showMessage(
      "Product loading error: " + (error.message || String(error)),
      true
    );
  });

  loadEasypaisaSettings();
}

startOrderPage();
