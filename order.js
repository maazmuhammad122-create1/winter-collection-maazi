const db = window.maaziSupabase;

const $ = id => document.getElementById(id);

let productList = [];
let variantList = [];
let selectedProduct = null;
let selectedVariant = null;

function showMessage(text, error = false) {
  $("form-message").textContent = text;
  $("form-message").style.color = error ? "#ff8b8b" : "#e4c477";
}

function formatPKR(amount) {
  return "PKR " + Number(amount || 0).toLocaleString("en-PK");
}

function makeOrderNumber() {
  return "MAZ-" + Date.now().toString().slice(-9);
}

async function loadProducts() {
  const { data, error } = await db
    .from("products")
    .select("id,name,price,description,images,is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  productList = data || [];

  $("product_id").innerHTML =
    '<option value="">Choose product</option>' +
    productList.map(p =>
      `<option value="${p.id}">${p.name.replace(/[&<>"']/g, "")} — ${formatPKR(p.price)}</option>`
    ).join("");

  // Allow a product selected from a URL, e.g. order.html?product=UUID
  const requestedId = new URLSearchParams(location.search).get("product");
  if (requestedId && productList.some(p => p.id === requestedId)) {
    $("product_id").value = requestedId;
    await loadVariants(requestedId);
  }

  updateTotal();
}

async function loadVariants(productId) {
  selectedProduct = productList.find(p => p.id === productId) || null;
  selectedVariant = null;
  variantList = [];

  $("variant_id").innerHTML = '<option value="">Loading sizes...</option>';

  if (!selectedProduct) {
    $("variant_id").innerHTML = '<option value="">Select a product first</option>';
    updateTotal();
    return;
  }

  const { data, error } = await db
    .from("product_variants")
    .select("id,product_id,size,color,stock")
    .eq("product_id", productId)
    .gt("stock", 0)
    .order("size");

  if (error) throw error;

  variantList = data || [];

  $("variant_id").innerHTML = variantList.length
    ? '<option value="">Choose size / colour</option>' +
      variantList.map(v => {
        const label = [v.size, v.color].filter(Boolean).join(" / ");
        return `<option value="${v.id}">${label} — ${v.stock} available</option>`;
      }).join("")
    : '<option value="">Currently out of stock</option>';

  $("product-summary").textContent = selectedProduct.name;
  updateTotal();
}

function updateTotal() {
  selectedProduct = productList.find(p => p.id === $("product_id").value) || null;
  selectedVariant = variantList.find(v => v.id === $("variant_id").value) || null;

  const qty = Math.max(1, Number($("qty").value) || 1);
  const total = selectedProduct ? Number(selectedProduct.price) * qty : 0;

  $("total-display").textContent = "Total: " + formatPKR(total);

  const advanceMode = $("advance").checked;
  const advanceInput = $("advance_amount");
  advanceInput.required = advanceMode;
  $("transaction_id").required = advanceMode;
  $("payment_proof").required = advanceMode;

  if (advanceMode) {
    advanceInput.max = total;
    if (Number(advanceInput.value) > total) advanceInput.value = total || "";
  } else {
    advanceInput.value = "";
    $("transaction_id").value = "";
    $("payment_proof").value = "";
  }

  const advance = advanceMode ? Number(advanceInput.value || 0) : 0;
  $("balance-display").textContent = "Balance Due: " + formatPKR(Math.max(0, total - advance));
}

async function uploadPaymentProof(file) {
  if (!file) throw new Error("Payment screenshot select karein.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Screenshot JPG, PNG ya WebP format mein honi chahiye.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Payment screenshot 5 MB se chhoti honi chahiye.");
  }

  const path = `payment-proofs/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  // A separate private bucket and its upload policy must be configured
  // for payment proofs before advance orders can be submitted.
  const { error } = await db.storage.from("payment-proofs").upload(path, file);
  if (error) {
    throw new Error("Payment proof upload nahi hua. Payment-proof storage setup check karein.");
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
  showMessage("Order submit ho raha hai...");

  let proofPath = null;

  try {
    const product = productList.find(p => p.id === $("product_id").value);
    const variant = variantList.find(v => v.id === $("variant_id").value);
    const qty = Number($("qty").value);
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

    if (!product || !variant) {
      throw new Error("Product aur available size select karein.");
    }

    if (!Number.isInteger(qty) || qty < 1 || qty > 20 || qty > variant.stock) {
      throw new Error("Quantity available stock ke mutabiq enter karein.");
    }

    const total = Number(product.price) * qty;
    let advance = 0;
    let transactionId = null;

    if (paymentMethod === "ADVANCE") {
      advance = Number($("advance_amount").value);
      transactionId = $("transaction_id").value.trim();

      if (!Number.isInteger(advance) || advance < 1 || advance > total) {
        throw new Error("Valid advance amount enter karein.");
      }
      if (!transactionId) throw new Error("Transaction ID enter karein.");

      proofPath = await uploadPaymentProof($("payment_proof").files[0]);
    }

    const orderNumber = makeOrderNumber();

    const orderPayload = {
      order_number: orderNumber,
      customer_name: $("customer_name").value.trim(),
      phone: $("phone").value.trim(),
      city: $("city").value.trim(),
      address: $("address").value.trim(),
      total,
      advance_amount: advance,
      balance_due: total - advance,
      status: "pending",
      payment_method: paymentMethod,
      payment_status: paymentMethod === "COD" ? "pending" : "verification_pending",
      transaction_id: transactionId,
      payment_proof_url: proofPath,
      payment_deadline: null,
      admin_note: null
    };

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert(orderPayload)
      .select("id,order_number")
      .single();

    if (orderError) throw orderError;

    const { error: itemError } = await db.from("order_items").insert({
      order_id: order.id,
      variant_id: variant.id,
      product_name: product.name,
      size: variant.size,
      color: variant.color || "",
      qty,
      unit_price: Number(product.price)
    });

    if (itemError) {
      // Do not leave an incomplete order behind.
      await db.from("orders").delete().eq("id", order.id);
      throw itemError;
    }

    $("order-form").reset();
    $("advance-fields").style.display = "none";
    $("product_id").value = "";
    $("variant_id").innerHTML = '<option value="">Select a product first</option>';
    selectedProduct = null;
    selectedVariant = null;
    updateTotal();

    showMessage(
      `Order submitted! Order number: ${order.order_number}. ` +
      (paymentMethod === "ADVANCE"
        ? "Payment abhi verification ke liye pending hai."
        : "Payment delivery par hogi.")
    );
  } catch (error) {
    showMessage(error.message || "Order submit nahi ho saka.", true);
  } finally {
    button.disabled = false;
    button.textContent = "SUBMIT ORDER";
  }
}

if (!db) {
  showMessage("supabase.js mein project URL aur publishable key check karein.", true);
} else {
  $("product_id").addEventListener("change", async event => {
    try {
      await loadVariants(event.target.value);
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  $("variant_id").addEventListener("change", updateTotal);
  $("qty").addEventListener("input", updateTotal);
  $("advance_amount").addEventListener("input", updateTotal);

  $("order-form").addEventListener("submit", submitOrder);

  loadProducts().catch(error => {
    showMessage("Products load nahi hue. Database permissions check karein.", true);
    console.error(error);
  });
}
async function loadEasypaisaSettings() {
  const titleEl = document.getElementById("easypaisa-account-title");
  const numberEl = document.getElementById("easypaisa-account-number");
  const instructionsEl = document.getElementById("easypaisa-payment-instructions");

  try {
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

    titleEl.textContent = settings.easypaisa_title || "Account details will be updated soon";
    numberEl.textContent = settings.easypaisa_number || "Not available yet";
    instructionsEl.textContent = settings.advance_instructions || "Please contact the store before making payment.";
  } catch (error) {
    titleEl.textContent = "Temporarily unavailable";
    numberEl.textContent = "Please contact the store";
    instructionsEl.textContent = "Payment details could not be loaded.";
    console.error("Easypaisa settings error:", error);
  }
}

if (db) {
  loadEasypaisaSettings();
}
