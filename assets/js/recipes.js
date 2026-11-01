(function () {
  "use strict";

  const recipes = window.VF_RECIPES || [];
  const grid = document.querySelector("[data-recipe-grid]");
  const detail = document.querySelector("[data-recipe-detail]");
  const cookbook = document.querySelector("[data-cookbook]");
  const search = document.querySelector("[data-recipe-search]");
  const filters = document.querySelector("[data-recipe-filters]");
  let activeCategory = "All";

  const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  })[character]);

  function recipeUrl(slug) {
    return `recipes.html?recipe=${encodeURIComponent(slug)}`;
  }

  function formatQuantity(quantity, factor) {
    const display = (number) => {
      const scaled = number * factor;
      if (Number.isInteger(scaled)) return String(scaled);
      return String(Math.round(scaled * 100) / 100).replace("0.25", "¼").replace("0.5", "½").replace("0.75", "¾");
    };
    return Array.isArray(quantity) ? quantity.map(display).join("–") : display(quantity);
  }

  function card(recipe) {
    return `<article class="cookbook-card">
      <a class="cookbook-card__image" href="${recipeUrl(recipe.slug)}" aria-label="Open ${escapeHtml(recipe.title)} recipe">
        <img src="${recipe.image}" alt="${escapeHtml(recipe.imageAlt)}" width="800" height="600" loading="lazy">
      </a>
      <div class="cookbook-card__body">
        <p class="eyebrow">${escapeHtml(recipe.eyebrow)}</p>
        <h3><a href="${recipeUrl(recipe.slug)}">${escapeHtml(recipe.title)}</a></h3>
        <p>${escapeHtml(recipe.description)}</p>
        <div class="cookbook-card__meta"><span>${escapeHtml(recipe.category)}</span><span>${escapeHtml(recipe.prepTime)}</span></div>
      </div>
    </article>`;
  }

  function renderGrid() {
    if (!grid) return;
    const query = (search?.value || "").trim().toLowerCase();
    const visible = recipes.filter((recipe) => {
      const inCategory = activeCategory === "All" || recipe.category === activeCategory;
      const haystack = [recipe.title, recipe.description, recipe.category, ...recipe.tags, ...recipe.ingredients.map((item) => item.item)].join(" ").toLowerCase();
      return inCategory && (!query || haystack.includes(query));
    });
    grid.innerHTML = visible.length ? visible.map(card).join("") : `<p class="cookbook-empty">No recipe matches that search yet. Try “pepper”, “sorrel” or “herbs”.</p>`;
  }

  function renderFilters() {
    if (!filters) return;
    const categories = ["All", ...new Set(recipes.map((recipe) => recipe.category))];
    filters.innerHTML = categories.map((category) => `<button class="filter-chip" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">${escapeHtml(category)}</button>`).join("");
  }

  function ingredientMarkup(recipe, factor) {
    return recipe.ingredients.map((ingredient, index) => `<li>
      <label><input type="checkbox" data-ingredient="${index}"><span><strong>${formatQuantity(ingredient.quantity, factor)} ${escapeHtml(ingredient.unit)}</strong> ${escapeHtml(ingredient.item)}${ingredient.note ? ` <small>(${escapeHtml(ingredient.note)})</small>` : ""}</span></label>
    </li>`).join("");
  }

  function setStructuredData(recipe) {
    const script = document.getElementById("recipeSchema");
    if (!script) return;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: recipe.title,
      description: recipe.description,
      image: new URL(recipe.image, location.href).href,
      recipeYield: recipe.yield,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      recipeCategory: recipe.category,
      recipeIngredient: recipe.ingredients.map((item) => `${formatQuantity(item.quantity, 1)} ${item.unit} ${item.item}`.trim()),
      recipeInstructions: recipe.steps.map((step) => ({ "@type": "HowToStep", text: step })),
      author: { "@type": "Organization", name: "Valley Feast Kitchen Delight" }
    });
  }

  function renderDetail(recipe) {
    document.title = `${recipe.title} — Valley Feast Kitchen Delight`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", recipe.description);
    cookbook.hidden = true;
    detail.hidden = false;
    detail.innerHTML = `<article class="recipe-page">
      <a class="recipe-back" href="recipes.html">← Back to the cookbook</a>
      <header class="recipe-hero">
        <div class="recipe-hero__copy">
          <p class="eyebrow">${escapeHtml(recipe.eyebrow)}</p>
          <h1>${escapeHtml(recipe.title)}</h1>
          <p class="recipe-hero__dek">${escapeHtml(recipe.description)}</p>
          <div class="recipe-facts" aria-label="Recipe facts">
            <span><small>Prep</small>${escapeHtml(recipe.prepTime)}</span>
            <span><small>Cook</small>${escapeHtml(recipe.cookTime)}</span>
            <span><small>Makes</small>${escapeHtml(recipe.yield)}</span>
          </div>
          <div class="recipe-actions">
            <button class="btn btn--green" type="button" data-print>Print recipe</button>
            <button class="btn btn--outline" type="button" data-share>Share</button>
          </div>
        </div>
        <img src="${recipe.image}" alt="${escapeHtml(recipe.imageAlt)}" width="1200" height="900">
      </header>
      <div class="recipe-story"><p>${escapeHtml(recipe.story)}</p></div>
      <div class="recipe-workspace">
        <section class="ingredient-panel" aria-labelledby="ingredientsHeading">
          <div class="panel-heading"><div><p class="eyebrow">Get everything ready</p><h2 id="ingredientsHeading">Ingredients</h2></div>
            <label class="serving-control">Scale
              <select data-scale aria-label="Scale ingredient quantities">
                <option value="0.5">Half</option><option value="1" selected>Original</option><option value="1.5">1½×</option><option value="2">Double</option>
              </select>
            </label>
          </div>
          <ul class="ingredient-list" data-ingredients>${ingredientMarkup(recipe, 1)}</ul>
        </section>
        <section class="method-panel" aria-labelledby="methodHeading">
          <p class="eyebrow">Cook along</p><h2 id="methodHeading">Method</h2>
          <ol class="method-list">${recipe.steps.map((step, index) => `<li><span>${index + 1}</span><p>${escapeHtml(step)}</p></li>`).join("")}</ol>
        </section>
      </div>
      <aside class="recipe-note"><div><p class="eyebrow">From the Valley Feast table</p><h2>How we serve it</h2><p>${escapeHtml(recipe.pairings)}</p></div><p class="recipe-caution"><strong>Kitchen note:</strong> ${escapeHtml(recipe.caution)}</p></aside>
      <section class="recipe-cta"><p class="eyebrow">Love the flavour, feeding a crowd?</p><h2>Let the Valley Feast kitchen handle the big pot.</h2><p>From family limes to weddings and corporate events, we cater across Trinidad.</p><a class="btn btn--spice" href="catering.html#quote">Plan your catering</a></section>
    </article>`;

    setStructuredData(recipe);
    detail.querySelector("[data-scale]").addEventListener("change", (event) => {
      detail.querySelector("[data-ingredients]").innerHTML = ingredientMarkup(recipe, Number(event.target.value));
    });
    detail.querySelector("[data-print]").addEventListener("click", () => window.print());
    detail.querySelector("[data-share]").addEventListener("click", async (event) => {
      const data = { title: recipe.title, text: recipe.description, url: location.href };
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(location.href);
        event.currentTarget.textContent = "Link copied";
      }
    });
  }

  filters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderFilters();
    renderGrid();
  });
  search?.addEventListener("input", renderGrid);

  const slug = new URLSearchParams(location.search).get("recipe");
  const selected = recipes.find((recipe) => recipe.slug === slug);
  if (selected) renderDetail(selected);
  else {
    renderFilters();
    renderGrid();
  }
})();
