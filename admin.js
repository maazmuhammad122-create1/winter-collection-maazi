/* Maazi admin add-on: stock per size, EDIT opens the form, sizes shown in product list.
   Load AFTER admin.js. */
(() => {
  const box = $("size-rows");

  function addRow(size = "", stock = "") {
    const row = document.createElement("div");
    row.className = "size-row";
    row.innerHTML =
      '<input class="sz-name" maxlength="40" placeholder="Size e.g. Medium">' +
      '<input class="sz-stock" type="number" min="0" step="1" placeholder="Stock">' +
      '<button type="button" class="btn btn-danger sz-del">Remove</button>';
    row.querySelector(".sz-name").value = size;
    row.querySelector(".sz-stock").value = stock;
    box.appendChild(row);
  }

  function setRows(list) {
    box.replaceChildren();
    (list.length ? list : [{ size: "", stock: "" }]).forEach((v) => addRow(v.size, v.stock));
  }

  function readRows() {
    const out = [];
    const seen = new Set();
    box.querySelectorAll(".size-row").forEach((row) => {
      const size = row.querySelector(".sz-name").value.trim();
      const raw = row.querySelector(".sz-stock").value.trim();
      if (!size && !raw) return;
      if (!size) throw new Error("Stock ke saath size ka naam bhi likhein.");
      const stock = Number(raw === "" ? 0 : raw);
      if (!Number.isInteger(stock) || stock < 0) {
        throw new Error(size + " ka stock zero ya positive whole number hona chahiye.");
      }
      const key = size.toLowerCase();
      if (seen.has(key)) throw new Error(size + " do dafa likha hai.");
      seen.add(key);
      out.push({ size, stock });
    });
    return out;
  }

  function setEditing(name) {
    const banner = $("edit-banner");
    banner.textContent = name ? "Editing: " + name + ". Tabdeeli karke Update product dabayein." : "";
    banner.classList.toggle("hidden", !name);
    $("save-product-btn").textContent = name ? "Update product" : "Save product";
  }

  $("add-size").addEventListener("click", () => addRow());
  box.addEventListener("click", (e) => {
    const del = e.target.closest(".sz-del");
    if (!del) return;
    del.closest(".size-row").remove();
    if (!box.children.length) addRow();
  });
  $("product-form").addEventListener("reset", () => {
    setTimeout(() => { setRows([]); setEditing(""); }, 0);
  });
  setRows([]);

  /* EDIT: fill the form and scroll to it (instead of the page top) */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("#product-list button[data-edit]");
    if (!btn) return;
    e.stopImmediatePropagation();
    try {
      const p = products.find((x) => String(x.id) === String(btn.dataset.edit));
      if (!p) return;
      $("product-id").value = p.id;
      $("product-name").value = p.name || "";
      $("product-price").value = p.price ?? 0;
      $("product-description").value = p.description || "";
      $("product-photos").value = "";
      $("photo-preview").replaceChildren();
      photoFiles = [];

      const { data, error } = await db
        .from("product_variants").select("size, stock").eq("product_id", p.id);
      if (error) throw error;

      setRows((data || []).filter((v) => v.size).map((v) => ({ size: v.size, stock: v.stock })));
      setEditing(p.name || "product");
      $("product-form").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      message("Product error: " + (err.message || "Edit nahi khul saka."), true);
    }
  }, true);

  /* SAVE: product + one variant per size, each with its own stock */
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "product-form") return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const saveBtn = $("save-product-btn");
    saveBtn.disabled = true;
    try {
      message("Saving product...");
      const id = $("product-id").value;
      const name = $("product-name").value.trim();
      const price = Number($("product-price").value);
      const description = $("product-description").value.trim();

      if (!name) throw new Error("Product name enter karo.");
      if (!Number.isFinite(price) || price < 0) throw new Error("Valid product price enter karo.");
      const sizes = readRows();
      if (!sizes.length) throw new Error("Kam az kam ek size aur uska stock likhein.");

      const old = products.find((x) => String(x.id) === String(id));
      const images = [...(Array.isArray(old?.images) ? old.images : [])];

      for (const file of photoFiles) {
        if (!file.type.startsWith("image/")) throw new Error("Sirf image files upload kar sakte ho.");
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`;
        const { error: upErr } = await db.storage.from("product-photos").upload(fileName, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = db.storage.from("product-photos").getPublicUrl(fileName);
        if (pub?.publicUrl) images.push(pub.publicUrl);
      }

      const payload = { name, price, description, images, is_active: true };
      let productId = id;
      if (id) {
        const { error } = await db.from("products").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await db.from("products").insert(payload).select().single();
        if (error) throw error;
        productId = data.id;
      }

      const { data: existing, error: exErr } = await db
        .from("product_variants").select("id, size").eq("product_id", productId);
      if (exErr) throw exErr;

      for (const s of sizes) {
        const match = (existing || []).find((v) => v.size === s.size);
        if (match) {
          const { error } = await db.from("product_variants").update({ stock: s.stock }).eq("id", match.id);
          if (error) throw error;
        } else {
          const { error } = await db.from("product_variants")
            .insert({ product_id: productId, size: s.size, color: "", stock: s.stock });
          if (error) throw error;
        }
      }

      /* sizes removed from the form: delete them (or set stock 0 if an order uses them) */
      const keep = new Set(sizes.map((s) => s.size));
      for (const v of existing || []) {
        if (!v.size || keep.has(v.size)) continue;
        const { error } = await db.from("product_variants").delete().eq("id", v.id);
        if (error) await db.from("product_variants").update({ stock: 0 }).eq("id", v.id);
      }

      $("product-form").reset();
      $("product-id").value = "";
      $("photo-preview").replaceChildren();
      photoFiles = [];
      await loadProducts();
      message("Product saved successfully!");
    } catch (err) {
      message("Product save error: " + (err.message || "Product save nahi hua."), true);
    } finally {
      saveBtn.disabled = false;
    }
  }, true);

  /* product list: show "Medium - stock 1" lines under each price */
  const list = $("product-list");
  let busy = false;
  async function addStockLines() {
    if (busy) return;
    const cards = [...list.querySelectorAll("article.card")].filter((c) => !c.dataset.sz);
    if (!cards.length) return;
    busy = true;
    try {
      const { data } = await db.from("product_variants").select("product_id, size, stock");
      cards.forEach((card) => {
        card.dataset.sz = "1";
        const id = card.querySelector("[data-edit]")?.dataset.edit;
        const vs = (data || []).filter((v) => String(v.product_id) === String(id) && v.size);
        const p = document.createElement("p");
        p.className = "sizes-line";
        p.textContent = vs.length
          ? vs.map((v) => v.size + " — stock " + v.stock).join("\n")
          : "Sizes abhi add nahi huay";
        (card.querySelector(".price") || card.querySelector("h3"))?.after(p);
      });
    } catch (err) {
      console.error("Stock lines error:", err);
    } finally {
      busy = false;
      if (list.querySelector("article.card:not([data-sz])")) setTimeout(addStockLines, 0);
    }
  }
  new MutationObserver(addStockLines).observe(list, { childList: true, subtree: true });
  addStockLines();
})();
