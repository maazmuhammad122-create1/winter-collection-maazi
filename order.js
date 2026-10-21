const db = window.maaziSupabase;
const $ = id => document.getElementById(id);

const FUNCTION_URL =
  "https://extbxdbzyfpbnpnhswsu.supabase.co/functions/v1/upload-payment-proof";

const PUBLIC_KEY =
  "sb_publishable_imfAmf4GjqdTgzimy7T_iw_xSZLRCX2";

let productList = [];
let variantList = [];
let selectedProduct = null;
let selectedVariant = null;

function showMessage(message, error = false) {
  const el = $("form-message");
  if (!el) return;

  el.textContent = String(message ?? "");
  el.style.color = error ? "#ff8b8b" : "#e4c477";
}

function getErrorMessage(value) {
  if (typeof value === "string") return value;

  if (value instanceof Error) return value.message;

  if (value && typeof value === "object") {
    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;

    try {
      return JSON.stringify(value);
    } catch {
      return "Unknown error";
    }
  }

  return "Order submit nahi ho saka. Dobara koshish karein.";
}

function formatPKR(amount) {
  return "PKR " + Number(amount || 0).toLocaleString("en-PK");
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
  const total = selectedProduct
    ? Number(selectedProduct.price) * qty
    : 0;

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

  productSelect.innerHTML =
    '<option value="">Loading products...</option>';

  if (!db) {
    throw new Error(
      "Supabase connection nahi mili. supabase.js check karein."
    );
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

  const requestedId =
    new URLSearchParams(location.search).get("product");

  if (
    requestedId &&
    productList.some(p => String(p.id) === requestedId)
  ) {
    productSelect.value = requestedId;
    await loadVariants(requestedId);
  } else {
    selectedProduct = null;
    selectedVariant = null;
    variantList = [];

    setOptions(
      $("variant_id"),
      "Select a product first",
      [],
      () => ""
    );
  }

  updateTotal();

  if (!productList.length) {
    showMessage("Koi active product nahi mila.", true);
  }
}

async function loadVariants(productId) {
  selectedProduct =
    productList.find(p => String(p.id) === String(productId)) || null;

  selectedVariant = null;
  variantList = [];

  if (!selectedProduct) {
    setOptions(
      $("variant_id"),
      "Select a product first",
      [],
      () => ""
    );

    updateTotal();
    return;
  }

  setOptions(
    $("variant_id"),
    "Loading sizes / colours...",
    [],
    () => ""
  );

  const { data, error } = await db
    .from("product_variants")
    .select("id,product_id,size,color,stock")
    .eq("product_id", productId)
    .gt("stock", 0);

  if (error) throw error;

  variantList = data || [];

  variantList.sort((a, b) => {
    const sizeCompare =
      String(a.size || "").localeCompare(String(b.size || ""));

    return sizeCompare ||
      String(a.color || "").localeCompare(String(b.color || ""));
  });

  setOptions(
    $("variant_id"),
    variantList.length
      ? "Choose size / colour"
      : "Currently out of stock",
    variantList,
    v => {
      const label = [v.size, v.color].filter(Boolean).join(" / ");
      return `${label || "Standard"} — ${v.stock} available`;
    }
  );

  updateTotal();

  if (!variantList.length) {
    showMessage(
      "Is product ka available size / colour nahi mila.",
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
      settings.easypaisa_title ||
      "Account details will be updated soon";

    numberEl.textContent =
      settings.easypaisa_number || "Not available yet";

    instructionsEl.textContent =
      settings.advance_instructions ||
      "Please contact the store before making payment.";
  } catch (error) {
    console.error("Easypaisa settings error:", error);

    titleEl.textContent = "Temporarily unavailable";
    numberEl.textContent = "Please contact the store";
    instructionsEl.textContent =
      "Payment details could not be loaded.";
  }
}

async function submitOrder(event) {
  event.preventDefault();

  const button = $("submit-btn");

  button.disabled = true;
  button.textContent = "PLEASE WAIT...";

  try {
    if (!db) {
      throw new Error("Supabase connection nahi mili.");
    }

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

    if (
      !variant ||
      String(variant.product_id) !== String(product.id)
    ) {
      throw new Error("Available size / colour select karein.");
    }

    if (
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > 20 ||
      qty > Number(variant.stock)
    ) {
      throw new Error(
        "Quantity available stock ke mutabiq enter karein."
      );
    }

    if (!["COD", "ADVANCE"].includes(paymentMethod)) {
      throw new Error("Payment method select karein.");
    }

    const total = Number(product.price) * qty;

    if (!Number.isSafeInteger(total) || total <= 0) {
      throw new Error("Product ki price valid nahi hai.");
    }

    const customerName = $("customer_name").value.trim();
    const phone = $("phone").value.trim();
    const city = $("city").value.trim();
    const address = $("address").value.trim();

    if (!customerName || !phone || !city || !address) {
      throw new Error("Customer ki tamam details fill karein.");
    }

    let advance = 0;
    let transactionId = "";
    let proofFile = null;

    if (paymentMethod === "ADVANCE") {
      advance = Number($("advance_amount").value);
      transactionId = $("transaction_id").value.trim();
      proofFile = $("payment_proof").files[0];

      if (
        !Number.isSafeInteger(advance) ||
        advance < 1 ||
        advance > total
      ) {
        throw new Error("Valid advance amount enter karein.");
      }

      if (!transactionId) {
        throw new Error("Transaction ID enter karein.");
      }

      if (!proofFile) {
        throw new Error("Payment screenshot select karein.");
      }

      if (
        !["image/jpeg", "image/png", "image/webp"].includes(proofFile.type)
      ) {
        throw new Error(
          "Screenshot JPG, PNG ya WebP honi chahiye."
        );
      }

      if (
        proofFile.size < 1 ||
        proofFile.size > 5 * 1024 * 1024
      ) {
        throw new Error(
          "Screenshot 5 MB se chhoti honi chahiye."
        );
      }
    }

    showMessage("Order save ho raha hai...");

    const formData = new FormData();

    formData.append("customer_name", customerName);
    formData.append("phone", phone);
    formData.append("city", city);
    formData.append("address", address);
    formData.append("variant_id", String(variant.id));
    formData.append("qty", String(qty));
    formData.append("payment_method", paymentMethod);
    formData.append("advance_amount", String(advance));
    formData.append("transaction_id", transactionId);

    if (proofFile) {
      formData.append(
        "payment_proof",
        proofFile,
        proofFile.name
      );
    }

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        apikey: PUBLIC_KEY
      },
      body: formData
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Server ka response samajh nahi aaya. Function deployment check karein."
      );
    }

    if (!response.ok || !result?.success) {
      console.error("Order function response:", result);

      const detail = getErrorMessage(result);

      throw new Error(
        `Order submit nahi hua (HTTP ${response.status}): ${detail}`
      );
    }

    $("order-form").reset();
    $("advance-fields").style.display = "none";
    $("product_id").value = "";

    selectedProduct = null;
    selectedVariant = null;
    variantList = [];

    setOptions(
      $("variant_id"),
      "Select a product first",
      [],
      () => ""
    );

    updatePaymentFields();

    showMessage(
      `Order submitted! Order number: ${result.order_number}. ` +
      (
        paymentMethod === "ADVANCE"
          ? "Payment verification pending hai."
          : "Payment delivery par hogi."
      )
    );
  } catch (error) {
    console.error("Order submission error:", error);

    showMessage(getErrorMessage(error), true);
  } finally {
    button.disabled = false;
    button.textContent = "SUBMIT ORDER";
  }
}

function updatePaymentFields() {
  const isAdvance = $("advance").checked;

  $("advance-fields").style.display =
    isAdvance ? "block" : "none";

  updateTotal();
}

function startOrderPage() {
  if (!db) {
    showMessage(
      "Supabase connection nahi mili. supabase.js check karein.",
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

      setOptions(
        $("variant_id"),
        "Could not load sizes / colours",
        [],
        () => ""
      );

      showMessage(
        "Size / colour error: " + getErrorMessage(error),
        true
      );
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

    setOptions(
      $("variant_id"),
      "Select a product first",
      [],
      () => ""
    );

    showMessage(
      "Product loading error: " + getErrorMessage(error),
      true
    );
  });

  loadEasypaisaSettings();
}

startOrderPage();
