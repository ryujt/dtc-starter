/*
 * AS-IS 화면 재현용 공통 셸과 장면 전환.
 * - body[data-shell]: "main"(헤더+푸터), "checkout"(체크아웃 헤더), "none"
 * - body[data-cart-count]: 헤더 Cart (n) 표시
 * - body[data-logged-in="true"]: Account 링크를 계정 개요로 연결
 * - section[data-scene][data-scene-name]: 페이지 장면. URL hash(#장면ID)로 직접 연다.
 * - section[data-base]: 기본 장면 위에 오버레이를 여는 장면. data-overlay는 side-menu|search|search-empty|cart-dropdown
 * 예시 데이터는 시드(initial-data-seed.ts, seed-demo-products.ts)를 따른다. 서버 호출은 하지 않는다.
 */
(function () {
  var body = document.body;
  var shell = body.getAttribute("data-shell") || "main";
  var cartCount = body.getAttribute("data-cart-count") || "0";
  var loggedIn = body.getAttribute("data-logged-in") === "true";
  var accountHref = loggedIn ? "account-overview.html" : "account-login.html";
  var page = document.getElementById("page");

  var header =
    '<div class="nav-wrap"><header class="nav-header"><nav class="nav content-container">' +
    '<div class="side"><button class="plain" type="button" data-open="side-menu">Menu</button></div>' +
    '<a class="brand" href="home.html">Medusa Store</a>' +
    '<div class="side right">' +
    '<a href="search.html" data-open="search" aria-label="Search products"><span class="search-icon"></span></a>' +
    '<a class="hide-small" href="' + accountHref + '">Account</a>' +
    '<a href="cart.html">Cart (' + cartCount + ")</a>" +
    "</div></nav></header></div>";

  var footer =
    '<footer class="footer"><div class="content-container">' +
    '<div class="footer-top">' +
    '<a class="brand" href="home.html">Medusa Store</a>' +
    '<div class="footer-cols">' +
    '<div><span class="semi small">Categories</span><ul>' +
    '<li><a href="category.html">Shirts</a></li><li><a href="category.html">Sweatshirts</a></li>' +
    '<li><a href="category.html">Pants</a></li><li><a href="category.html">Merch</a></li></ul></div>' +
    '<div><span class="semi small">Collections</span><ul>' +
    '<li><a href="collection.html">Summer Essentials</a></li><li><a href="collection.html">Winter Layers</a></li>' +
    '<li><a href="collection.html">Everyday Basics</a></li><li><a href="collection.html">Limited Run</a></li></ul></div>' +
    '<div><span class="semi small">Customer service</span><ul>' +
    '<li><a href="shipping-policy.html">Shipping information</a></li><li><a href="returns-policy.html">Return policy</a></li>' +
    '<li><a href="terms.html">Terms of service</a></li><li><a href="privacy.html">Privacy policy</a></li>' +
    '<li><a href="contact.html">Contact</a></li><li><a href="search.html">Search</a></li></ul></div>' +
    '<div><span class="semi small">Medusa</span><ul>' +
    '<li><a href="https://github.com/medusajs">GitHub</a></li><li><a href="https://docs.medusajs.com">Documentation</a></li>' +
    '<li><a href="https://github.com/medusajs/dtc-starter">Source code</a></li></ul></div>' +
    "</div></div>" +
    '<div class="footer-bottom"><span>© 2026 Medusa Store. All rights reserved.</span>' +
    "<span>Powered by Medusa and Next.js</span></div>" +
    "</div></footer>";

  var checkoutHeader =
    '<div class="checkout-header"><nav class="content-container">' +
    '<a class="side small subtle upper" href="cart.html">‹ Back to shopping cart</a>' +
    '<a class="brand" href="home.html">Medusa Store</a><div class="side"></div></nav></div>';
  var checkoutFooter = '<div class="cta">Powered by <b>Medusa</b> &amp; <b>Next.js</b></div>';

  var overlays =
    '<div class="overlay-backdrop" data-close></div>' +
    '<aside class="side-menu" id="ov-side-menu"><div class="row between"><span></span>' +
    '<button class="plain" type="button" data-close style="color:#fff;background:none;border:0">✕</button></div>' +
    '<ul><li><a href="home.html">Home</a></li><li><a href="store.html">Store</a></li>' +
    '<li><a href="' + accountHref + '">Account</a></li><li><a href="cart.html">Cart</a></li></ul>' +
    '<div class="stack gap-4 small"><div>Language: <u>English</u></div>' +
    '<div>Shipping to: <u>Denmark</u> <span class="xsmall">(국가 선택 시 /{국가}/현재경로로 이동)</span></div>' +
    '<div class="xsmall">© 2026 Medusa Store. All rights reserved.</div></div></aside>' +
    '<aside class="drawer" id="ov-search"><div class="drawer-head"><input value="shirt" aria-label="Search">' +
    '<button class="btn btn-transparent" type="button" data-close>Close</button></div>' +
    '<div class="stack" id="search-results" style="padding:8px 16px">' +
    '<a class="row gap-3" style="padding:8px 0" href="product-detail.html"><span class="thumb small"></span><span>Medusa T-Shirt<br><span class="subtle small">€10.00</span></span></a>' +
    '<a class="row gap-3" style="padding:8px 0" href="product-detail.html"><span class="thumb small"></span><span>Medusa Sweatshirt<br><span class="subtle small">€10.00</span></span></a>' +
    '<a class="small link" style="padding:12px 0" href="search.html">See all results</a></div>' +
    '<p class="subtle" id="search-empty" style="padding:24px 16px;text-align:center;display:none">No products found for "zzz"</p></aside>';

  if (shell === "main") {
    page.insertAdjacentHTML("beforebegin", header);
    page.insertAdjacentHTML("afterend", footer);
  } else if (shell === "checkout") {
    page.insertAdjacentHTML("beforebegin", checkoutHeader);
    page.insertAdjacentHTML("afterend", checkoutFooter);
  }
  body.insertAdjacentHTML("beforeend", overlays);

  var backdrop = document.querySelector(".overlay-backdrop");
  function closeOverlays() {
    ["ov-side-menu", "ov-search"].forEach(function (id) {
      document.getElementById(id).classList.remove("open");
    });
    backdrop.classList.remove("open");
  }
  function openOverlay(name) {
    closeOverlays();
    if (name === "side-menu" || name === "search" || name === "search-empty") {
      var el = document.getElementById(name === "side-menu" ? "ov-side-menu" : "ov-search");
      el.classList.add("open");
      backdrop.classList.add("open");
      var empty = name === "search-empty";
      document.getElementById("search-results").style.display = empty ? "none" : "flex";
      document.getElementById("search-empty").style.display = empty ? "block" : "none";
      el.querySelector("input") && (el.querySelector("input").value = empty ? "zzz" : "shirt");
    }
    var dd = document.querySelector("[data-dropdown]");
    if (dd) dd.style.display = name === "cart-dropdown" ? "block" : "none";
  }
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open]");
    if (opener) {
      e.preventDefault();
      openOverlay(opener.getAttribute("data-open"));
      return;
    }
    if (e.target.closest("[data-close]")) closeOverlays();
  });

  var scenes = Array.prototype.slice.call(document.querySelectorAll("[data-scene]"));
  function show(id) {
    var target = scenes.filter(function (s) { return s.getAttribute("data-scene") === id; })[0] || scenes[0];
    if (!target) return;
    var base = target.getAttribute("data-base");
    var visible = base || target.getAttribute("data-scene");
    scenes.forEach(function (s) {
      s.classList.toggle("active", s.getAttribute("data-scene") === visible);
    });
    openOverlay(target.getAttribute("data-overlay") || "");
    if (!target.getAttribute("data-overlay")) closeOverlays();
    var links = document.querySelectorAll(".review-bar a");
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle("active", links[i].getAttribute("href") === "#" + target.getAttribute("data-scene"));
    }
    window.scrollTo(0, 0);
  }

  var bar = '<div class="review-bar" role="navigation" aria-label="검토용 장면 선택">' +
    '<button class="close" type="button" onclick="this.parentNode.remove()">✕</button>' +
    "<strong>검토용 장면 선택 (제품 UI 아님)</strong>";
  scenes.forEach(function (s) {
    bar += '<a href="#' + s.getAttribute("data-scene") + '">' + (s.getAttribute("data-scene-name") || s.getAttribute("data-scene")) + "</a>";
  });
  body.insertAdjacentHTML("beforeend", bar + "</div>");

  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
  show(location.hash.slice(1) || (scenes[0] && scenes[0].getAttribute("data-scene")));
})();
