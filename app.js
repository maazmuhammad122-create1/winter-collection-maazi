/* Winter Collection by Maazi
   Storefront interactions
*/

const StoreApp = (() => {
  const demoProducts = [
    {
      id: "demo-shirt-1",
      name: "Classic Winter Shirt",
      price: 2800,
      sizes: ["M", "L", "XL"],
      photos: [],
      description: "Premium winter collection"
    },
    {
      id: "demo-shirt-2",
      name: "Premium Winter Shirt",
      price: 2800,
      sizes: ["M", "L", "XL"],
      photos: [],
      description: "Style meets comfort"
    }
  ];

  let products = [...demoProducts];

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderProducts(list = products) {
    const grid = document.getElementById("grid");
    if (!grid) return;

    grid.replaceChildren();

    if (!list.length) {
      grid.append(element("p", "", "No products found."));
      return;
    }

    list.forEach(product => {
      const card = element("article", "product-card");
      const gallery = element("div", "product-gallery");

      if (product.photos?.length) {
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
        element("p", "product-price", `PKR ${Number(product.price).toLocaleString()}`)
      );

      if (product.description) {
        info.append(element("p", "product-description", product.description));
      }

      const sizeLabel = element("label", "", "Select size");
      const sizeSelect = element("select");
      sizeSelect.setAttribute("aria-label", `Size for ${product.name}`);

      product.sizes.forEach(size => {
        const option = element("option", "", size);
        option.value = size;
        sizeSelect.append(option);
      });

      info.append(sizeLabel, sizeSelect);

      const orderButton = element("button", "order-btn", "ORDER NOW");
      orderButton.type = "button";
      orderButton.addEventListener("click", () => {
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

  function setProducts(databaseProducts) {
    products = databaseProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      photos: Array.isArray(p.photos) ? p.photos : [],
      description: p.description || ""
    }));

    renderProducts();
  }

  function initSearch() {
    const search = document.getElementById("search");
    if (!search) return;

    search.addEventListener("input", () => {
      const term = search.value.trim().toLowerCase();

      renderProducts(
        products.filter(p => p.name.toLowerCase().includes(term))
      );
    });
  }

  function initSnowfall() {
    const snow = document.getElementById("snow");
    if (!snow || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

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
    renderProducts();
    initSearch();
    initSnowfall();
  }

  return { init, setProducts, renderProducts };
})();

document.addEventListener("DOMContentLoaded", StoreApp.init);
