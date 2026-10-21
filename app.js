/* Winter Collection by Maazi — Storefront */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  let products = [];
  let searchText = "";

  function makeElement(tag, className, text) {
    const el = document.createElement(tag);

    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;

    return el;
  }

  function formatPKR(amount) {
    return "PKR " + Number(amount || 0).toLocaleString("en-PK");
  }

  function normalizeImages(value) {
    if (!value) return [];

    let images = value;

    if (typeof images === "string") {
      try {
        images = JSON.parse(images);
      } catch {
        images = [images];
      }
    }

    if (!Array.isArray(images)) images = [images];

    return images
      .map((item) => {
        if (typeof item === "string") return item.trim();

        if (item && typeof item === "object") {
          return item.url || item.publicUrl || item.public_url || item.src || "";
        }

        return "";
      })
      .filter((url) => /^https?:\/\//i.test(url));
  }

  function showStatus(message, isError = false) {
    const status = $("status-message");
    if (!status) return;

    status.textContent = message;
    status.style.color = isError ? "#ff8b8b" : "#bdb5a3";
  }

  function createGallery(images, productName) {
    const gallery = makeElement("div", "product-gallery");

    if (!images.length) {
      const placeholder = makeElement("div", "gallery-slide");
      placeholder.textContent = "Product image coming soon";
      placeholder.style.color = "#bdb5a3";
      gallery.appendChild(placeholder);
      return gallery;
    }

    const track = makeElement("div", "gallery-track");
    track.setAttribute("aria-label", productName + " pictures");

    const dots = makeElement("div", "gallery-dots");
    const count = makeElement("span", "image-count", "1 / " + images.length);

    images.forEach((url, index) => {
      const slide = makeElement("div", "gallery-slide");
      const img = document.createElement("img");

      img.src = url;
      img.alt = productName + " — picture " + (index + 1);
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";
      img.draggable = false;

      img.addEventListener("error", () => {
        slide.replaceChildren();
        slide.textContent = "Image unavailable";
        slide.style.color = "#bdb5a3";
      }, { once: true });

      slide.appendChild(img);
      track.appendChild(slide);

      const dot = makeElement("span", "gallery-dot");
      if (index === 0) dot.classList.add("active");
      dots.appendChild(dot);
    });

    gallery.appendChild(track);

    if (images.length > 1) {
      const prev = makeElement("button", "gallery-arrow gallery-prev", "‹");
      const next = makeElement("button", "gallery-arrow gallery-next", "›");

      prev.type = "button";
      next.type = "button";
      prev.setAttribute("aria-label", "Previous picture");
      next.setAttribute("aria-label", "Next picture");

      gallery.appendChild(prev);
      gallery.appendChild(next);
      gallery.appendChild(dots);
      gallery.appendChild(count);

      let currentIndex = 0;
      let scrollTimer = null;

      function goTo(index) {
        currentIndex = (index + images.length) % images.length;

        track.scrollTo({
          left: currentIndex * track.clientWidth,
          behavior: "smooth"
        });

        updateIndicators();
      }

      function updateIndicators() {
        [...dots.children].forEach((dot, i) => {
          dot.classList.toggle("active", i === currentIndex);
        });

        count.textContent = (currentIndex + 1) + " / " + images.length;
      }

      prev.addEventListener("click", () => goTo(currentIndex - 1));
      next.addEventListener("click", () => goTo(currentIndex + 1));

      track.addEventListener("scroll", () => {
        if (scrollTimer) clearTimeout(scrollTimer);

        scrollTimer = setTimeout(() => {
          currentIndex = Math.max(
            0,
            Math.min(
              images.length - 1,
              Math.round(track.scrollLeft / Math.max(track.clientWidth, 1))
            )
          );

          updateIndicators();
        }, 70);
      }, { passive: true });

      window.addEventListener("resize", () => {
        track.scrollLeft = currentIndex * track.clientWidth;
      });
    } else {
      gallery.appendChild(count);
    }

    return gallery;
  }

  function createProductCard(product) {
    const card = makeElement("article", "product-card");

    card.appendChild(createGallery(product.photos, product.name));

    const info = makeElement("div", "product-info");

    info.appendChild(makeElement("h3", "product-name", product.name));

    if (product.description) {
      info.appendChild(
        makeElement("p", "product-description", product.description)
      );
    }

    info.appendChild(
      makeElement("p", "product-price", formatPKR(product.price))
    );

    info.appendChild(makeElement("p", "size-heading", "AVAILABLE SIZES"));

    const sizeList = makeElement("div", "size-list");

    product.variants.forEach((variant) => {
      const label = [variant.size, variant.color].filter(Boolean).join(" / ");
      const chip = makeElement(
        "span",
        "size-chip",
        label + (variant.stock > 0 ? "" : " · Out of stock")
      );

      if (variant.stock <= 0) chip.classList.add("unavailable");

      sizeList.appendChild(chip);
    });

    if (!product.variants.length) {
      sizeList.appendChild(
        makeElement("span", "size-chip unavailable", "Currently unavailable")
      );
    }

    info.appendChild(sizeList);

    const orderButton = makeElement("a", "order-btn", "ORDER NOW");
    orderButton.href = "order.html?product=" + encodeURIComponent(product.id);

    if (!product.variants.some((variant) => variant.stock > 0)) {
      orderButton.classList.add("disabled");
      orderButton.setAttribute("aria-disabled", "true");
      orderButton.addEventListener("click", (event) => event.preventDefault());
    }

    info.appendChild(orderButton);
    card.appendChild(info);

    return card;
  }

  function renderProducts() {
    const grid = $("grid");
    if (!grid) return;

    grid.replaceChildren();

    const filtered = products.filter((product) => {
      const text = (
        product.name + " " + product.description
      ).toLowerCase();

      return text.includes(searchText);
    });

    if (!filtered.length) {
      grid.appendChild(
        makeElement(
          "div",
          "empty-state",
          products.length
            ? "No products match your search."
            : "No active products are available right now."
        )
      );
      return;
    }

    filtered.forEach((product) => {
      grid.appendChild(createProductCard(product));
    });
  }

  async function loadProducts() {
    const db = window.maaziSupabase;

    if (!db) {
      showStatus(
        "Store connection nahi ho saka. supabase.js configuration check karein.",
        true
      );
      return;
    }

    showStatus("Loading your collection...");

    try {
      const { data: productRows, error: productError } = await db
        .from("products")
        .select("id,name,price,description,images,is_active,created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (productError) throw productError;

      const activeProducts = productRows || [];
      let variantRows = [];

      if (activeProducts.length) {
        const { data, error: variantError } = await db
          .from("product_variants")
          .select("id,product_id,size,color,stock")
          .in("product_id", activeProducts.map((product) => product.id));

        if (variantError) throw variantError;
        variantRows = data || [];
      }

      products = activeProducts.map((product) => ({
        id: product.id,
        name: product.name || "Winter Collection",
        price: Number(product.price) || 0,
        description: product.description || "",
        photos: normalizeImages(product.images),
        variants: variantRows
          .filter((variant) => variant.product_id === product.id)
          .map((variant) => ({
            id: variant.id,
            size: variant.size || "",
            color: variant.color || "",
            stock: Math.max(0, Number(variant.stock) || 0)
          }))
      }));

      renderProducts();

      showStatus(
        products.length
          ? products.length + " product(s) in our collection"
          : "Abhi koi active product available nahi hai."
      );
    } catch (error) {
      console.error("Storefront loading error:", error);
      showStatus(
        "Products load nahi ho sake. Database permissions aur table columns check karein.",
        true
      );
    }
  }

  function init() {
    const search = $("search");

    if (search) {
      search.addEventListener("input", () => {
        searchText = search.value.trim().toLowerCase();
        renderProducts();
      });
    }

    loadProducts();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
