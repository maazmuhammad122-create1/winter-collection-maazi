/* Winter Collection by Maazi
   Storefront interactions
   Loads products, images and sizes from Supabase
*/

const StoreApp = (() => {
  let products = [];

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function normalizeImages(images) {
    if (!images) return [];

    if (typeof images === "string") {
      try {
        images = JSON.parse(images);
      } catch {
        return images.startsWith("http") ? [images] : [];
      }
    }

    if (!Array.isArray(images)) return [];

    return images
      .map(image => {
        if (typeof image === "string") return image;
        if (image && typeof image.url === "string") return image.url;
        return "";
      })
      .filter(url => url.startsWith("http"));
  }

  function renderProducts(list = products) {
    const grid = document.getElementById("grid");
    if (!grid) return;

    grid.replaceChildren();

    if (!list.length) {
      grid.append(
        element("p", "", "No products available right now.")
      );
      return;
    }

    list.forEach(product => {
      const card = element("article", "product-card");
      const gallery = element("div", "product-gallery");

      if (product.photos.length) {
        product.photos.forEach(url => {
          const img = element("img");
          img.src = url;
          img.alt = product.name;
          img.loading = "lazy";
          gallery.append(img);
        });
      } else {
        gallery.append(
          element("div", "product-placeholder", "WINTER COLLECTION")
        );
      }

      const info = element("div", "product-info");
      info.append(element("h3", "", product.name));

      info.append(
        element(
          "p",
          "product-price",
          `PKR ${Number(product.price).toLocaleString()}`
        )
      );

      if (product.description) {
        info.append(
          element("p", "product-description", product.description)
        );
      }

      const sizeLabel = element("label", "", "Select size");
      const sizeSelect = element("select");
      sizeSelect.setAttribute("aria-label", `Size for ${product.name}`);

      if (product.sizes.length) {
        product.sizes.forEach(size => {
          const option = element("option", "", size);
          option.value = size;
          sizeSelect.append(option);
        });
      } else {
        const option = element("option", "", "Size unavailable");
        option.value = "";
        option.disabled = true;
        option.selected = true;
        sizeSelect.append(option);
        sizeSelect.disabled = true;
      }

      info.append(sizeLabel, sizeSelect);

      const orderButton = element("button", "order-btn", "ORDER NOW");
      orderButton.type = "button";
      orderButton.disabled = !product.sizes.length;

      orderButton.addEventListener("click", () => {
        if (!sizeSelect.value) return;

        const query = new URLSearchParams({
          product: product.name,
          size: sizeSelect.value
        });

        window.location.href = `order.html?${query.toString()}`;
      });

      info.append(orderButton);
      card.append(gallery, info);
      grid.append(card);
    });
  }

  async function loadProducts() {
    const grid = document.getElementById("grid");
    const db = window.maaziSupabase;

    if (!db) {
      console.error("Supabase client not found. Check supabase.js.");
      if (grid) {
        grid.replaceChildren(
          element("p", "", "Store connection unavailable. Please try again later.")
        );
      }
      return;
    }

    if (grid) {
      grid.replaceChildren(
        element("p", "", "Loading products...")
      );
    }

    try {
      const { data: productRows, error: productError } = await db
        .from("products")
        .select("id, name, price, description, images, is_active, created_at")
        .order("created_at", { ascending: false });

      if (productError) throw productError;

      const activeRows = (productRows || []).filter(
        product => product.is_active !== false
      );

      let variantsByProduct = {};

      if (activeRows.length) {
        const { data: variants, error: variantsError } = await db
          .from("product_variants")
          .select("product_id, size, stock")
          .in("product_id", activeRows.map(product => product.id));

        if (variantsError) {
          console.error("Could not load product sizes:", variantsError.message);
        } else {
          (variants || []).forEach(variant => {
            if (!variantsByProduct[variant.product_id]) {
              variantsByProduct[variant.product_id] = [];
            }

            const size = String(variant.size || "").trim();

            if (
              size &&
              Number(variant.stock) > 0 &&
              !variantsByProduct[variant.product_id].includes(size)
            ) {
              variantsByProduct[variant.product_id].push(size);
            }
          });
        }
      }

      products = activeRows.map(product => ({
        id: product.id,
        name: product.name || "Winter Collection",
        price: Number(product.price) || 0,
        sizes: variantsByProduct[product.id] || [],
        photos: normalizeImages(product.images),
        description: product.description || ""
      }));

      renderProducts();

    } catch (error) {
      console.error("Product loading error:", error);

      if (grid) {
        grid.replaceChildren(
          element(
            "p",
            "",
            "Products could not be loaded. Please try again later."
          )
        );
      }
    }
  }

  function initSearch() {
    const search = document.getElementById("search");
    if (!search) return;

    search.addEventListener("input", () => {
      const term = search.value.trim().toLowerCase();

      renderProducts(
        products.filter(product =>
          product.name.toLowerCase().includes(term)
        )
      );
    });
  }

  function initSnowfall() {
    const snow = document.getElementById("snow");

    if (
      !snow ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    if (snow.dataset.initialized === "true") return;
    snow.dataset.initialized = "true";

    for (let i = 0; i < 35; i++) {
      const flake = element("span", "snowflake", "❄");
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.animationDuration = `${6 + Math.random() * 8}s`;
      flake.style.animationDelay = `${-Math.random() * 12}s`;
      flake.style.fontSize = `${9 + Math.random() * 12}px`;
      snow.append(flake);
    }
  }

  function init() {
    initSearch();
    initSnowfall();
    loadProducts();
  }

  return {
    init,
    loadProducts,
    renderProducts
  };
})();

document.addEventListener("DOMContentLoaded", StoreApp.init);
