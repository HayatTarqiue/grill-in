/* =========================================================
   New Grill In — interactions, motion & WhatsApp ordering
   Vanilla JS. Depends on js/config.js (RESTAURANT_CONFIG, MENU).
   Cart is the single source of truth, persisted in localStorage;
   prices/totals are always recomputed from MENU (never trusted
   from storage). WhatsApp uses click-to-chat (no backend).
   ========================================================= */
(function () {
  "use strict";

  var CONFIG = window.RESTAURANT_CONFIG || {};
  var MENU = Array.isArray(window.MENU) ? window.MENU : [];
  var MENU_BY_ID = {};
  MENU.forEach(function (m) { MENU_BY_ID[m.id] = m; });

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CART_KEY = "ngi_cart_v1";
  var SYM = CONFIG.currencySymbol || "₹";

  var UNS = "https://images.unsplash.com/photo-";
  function img(id, w, q) { return UNS + id + "?w=" + (w || 800) + "&q=" + (q || 78) + "&auto=format&fit=crop"; }
  function srcset(id) { return img(id, 500, 72) + " 500w, " + img(id, 800, 78) + " 800w, " + img(id, 1100, 80) + " 1100w"; }

  function money(n) { return SYM + Number(n || 0).toLocaleString("en-IN"); }
  // Escape for safe insertion into HTML (used for any dynamic text).
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function vegMark(veg) {
    return '<span class="veg veg--' + (veg ? "yes" : "no") + '" title="' + (veg ? "Veg" : "Non-veg") + '" aria-label="' + (veg ? "Vegetarian" : "Non-vegetarian") + '"></span>';
  }

  /* =======================================================
     MENU RENDER
     ======================================================= */
  var grid = document.getElementById("menuGrid");
  if (grid) {
    grid.innerHTML = MENU.map(function (d) {
      var sold = d.available === false;
      var action = sold
        ? '<button class="dish__add" disabled aria-disabled="true">Sold out</button>'
        : '<button class="dish__add" data-add="' + esc(d.id) + '" aria-label="Add ' + esc(d.name) + ' to order">Add to Cart ' + arrow + '</button>';
      return (
        '<article class="dish' + (sold ? " is-unavailable" : "") + '" data-cat="' + esc(d.category) + '" data-id="' + esc(d.id) + '">' +
          '<div class="dish__media">' +
            '<img class="dish__img" src="' + img(d.img, 800, 78) + '" srcset="' + srcset(d.img) + '" ' +
              'sizes="(max-width: 560px) 90vw, (max-width: 900px) 45vw, 360px" width="800" height="600" ' +
              'loading="lazy" decoding="async" alt="' + esc(d.name) + '" />' +
            '<span class="dish__cat">' + esc(d.category) + '</span>' +
            (sold ? '<span class="dish__sold">Sold out</span>' : "") +
          '</div>' +
          '<div class="dish__body">' +
            '<div class="dish__top">' +
              '<h3 class="dish__name">' + vegMark(d.veg) + esc(d.name) + '</h3>' +
              '<span class="dish__price">' + money(d.price) + '</span>' +
            '</div>' +
            '<p class="dish__desc">' + esc(d.desc) + '</p>' +
            action +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  /* =======================================================
     GALLERY RENDER
     ======================================================= */
  var GALLERY = [
    { id: "1544025162-d76694265947", alt: "Skewers caramelising over charcoal", cls: "gfig--tall" },
    { id: "1568901346375-23c9450c58cd", alt: "A loaded flame-grilled burger" },
    { id: "1513104890138-7c749659a591", alt: "Wood-fired pizza fresh from the oven" },
    { id: "1600891964092-4316c288032e", alt: "Grilled meat platter, sizzling", cls: "gfig--wide" },
    { id: "1598515214211-89d3c73ae83b", alt: "Charred grilled chicken" },
    { id: "1528735602780-2552fd46c7af", alt: "A pressed grilled sandwich" },
    { id: "1550547660-d9450f859349", alt: "Double stacked smash burger", cls: "gfig--tall" },
    { id: "1565299624946-b28f40a0ae38", alt: "Close-up of a cheesy pizza slice" }
  ];
  var gGrid = document.getElementById("galleryGrid");
  if (gGrid) {
    gGrid.innerHTML = GALLERY.map(function (g) {
      return '<figure class="gfig ' + (g.cls || "") + '">' +
        '<img src="' + img(g.id, 700, 76) + '" srcset="' + srcset(g.id) + '" sizes="(max-width: 768px) 50vw, 25vw" ' +
        'width="700" height="525" loading="lazy" decoding="async" alt="' + esc(g.alt) + '" /></figure>';
    }).join("");
  }

  /* ---------- Year + WhatsApp contact links from config ---------- */
  var yEl = document.getElementById("year");
  if (yEl) yEl.textContent = new Date().getFullYear();

  /* =======================================================
     HERO VIDEO — crossfading food clips
     Cross-platform hardened (Mac / Windows / Android / iOS):
     - Reveals a clip ONLY once it is genuinely playing, so a
       browser that blocks or delays autoplay never shows a
       frozen/black frame — the hero image stays instead.
     - Retries playback on the first user interaction if muted
       autoplay was blocked (common on iOS / data-saver modes).
     - Always falls back to the static hero image.
     ======================================================= */
  (function initHeroVideo() {
    if (prefersReduced) return;                        // reduced-motion: keep image
    var conn = navigator.connection || navigator.webkitConnection;
    if (conn && conn.saveData) return;                 // data-saver: keep image
    var videos = $all("[data-hero-video]");
    if (videos.length < 2) return;
    var v0 = videos[0];
    if (!v0.canPlayType || !v0.canPlayType("video/mp4")) return;

    // A clip can be one file, or { wide, narrow } when its framing only works
    // on one screen shape: the top-down pizza-share table crops to a plain
    // pizza close-up on portrait phones, so phones get a face + slice clip.
    // narrowPos re-aims the crop on phones, where only ~26% of a 16:9 frame's
    // width is visible: the eater's mouth sits left of centre in pizza-eat.
    // narrowStart skips its first seconds (mostly sleeve/hands in that crop)
    // so phones open straight on the bite.
    var PLAYLIST = [
      "assets/video/burger.mp4",
      { wide: "assets/video/pizza-share.mp4", narrow: "assets/video/pizza-eat.mp4", narrowPos: "25% 40%", narrowStart: 6 },
      "assets/video/pizza.mp4"
    ];
    var NARROW = window.matchMedia("(max-width: 700px)");
    // Resolved when each clip loads (not once at startup), so a phone rotated
    // mid-session gets the right version on the next loop.
    function clipSrc(i) {
      var c = PLAYLIST[i];
      return typeof c === "string" ? c : (NARROW.matches ? c.narrow : c.wide);
    }
    function clipPos(i) {
      var c = PLAYLIST[i];
      return (typeof c !== "string" && NARROW.matches && c.narrowPos) || ""; // "" = CSS default
    }
    function clipStart(i) {
      var c = PLAYLIST[i];
      return (typeof c !== "string" && NARROW.matches && c.narrowStart) || 0;
    }
    var FADE = 1000;
    var started = false;        // has any clip actually begun playing?
    var pendingVideo = null;    // clip waiting for a user gesture to start
    var gestureArmed = false;

    // Maximise autoplay compatibility across browsers (esp. iOS Safari).
    videos.forEach(function (v) {
      v.muted = true; v.defaultMuted = true;
      v.setAttribute("muted", "");
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
    });

    function attemptPlay(v) {
      v.muted = true;                     // re-assert right before play (iOS quirk)
      var p = v.play();
      return (p && p.then) ? p : Promise.resolve();
    }

    // If autoplay is blocked, kick playback off on the first user interaction.
    function armGesture(v) {
      pendingVideo = v;
      if (gestureArmed) return;
      gestureArmed = true;
      var evs = ["touchstart", "pointerdown", "click", "keydown", "scroll"];
      var onGesture = function () {
        evs.forEach(function (ev) { window.removeEventListener(ev, onGesture, true); });
        gestureArmed = false;
        if (pendingVideo) attemptPlay(pendingVideo).catch(function () {});
      };
      evs.forEach(function (ev) { window.addEventListener(ev, onGesture, { capture: true, passive: true }); });
    }

    function cycle(layer, srcIdx) {
      var v = videos[layer], other = videos[1 - layer];
      var startAt = clipStart(srcIdx);
      v.loop = false;
      v.style.objectPosition = clipPos(srcIdx);
      v.src = clipSrc(srcIdx);
      v.load();

      // Reveal ONLY when the clip is genuinely playing (not merely loaded).
      var onPlaying = function () {
        v.removeEventListener("playing", onPlaying);
        started = true;
        v.classList.add("is-active");
        other.classList.remove("is-active");
        // Cycle through all clips on every device (clips load one-by-one, not
        // all at once, so data stays progressive on phones).
        var next = function () { cycle(1 - layer, (srcIdx + 1) % PLAYLIST.length); };
        var remaining = v.duration - startAt;
        if (isFinite(remaining) && remaining > 0.5) setTimeout(next, Math.max(remaining * 1000 - FADE, 1500));
        else v.addEventListener("ended", next, { once: true });
      };
      v.addEventListener("playing", onPlaying);

      var start = function () {
        // Seek before playing; the clip stays hidden until "playing", so the
        // skipped opening frames never flash on screen.
        if (startAt && v.currentTime < startAt) { try { v.currentTime = startAt; } catch (e) {} }
        attemptPlay(v).catch(function () {
          // Autoplay blocked — keep the hero image; retry on first interaction.
          if (srcIdx === 0) armGesture(v);
        });
      };
      if (v.readyState >= 2) start();
      else v.addEventListener("loadeddata", start, { once: true });

      v.addEventListener("error", function () {
        if (srcIdx !== 0) cycle(1 - layer, (srcIdx + 1) % PLAYLIST.length); // skip a broken later clip
        // first-clip error: silently keep the hero image fallback
      }, { once: true });
    }
    cycle(0, 0);
  })();

  /* =======================================================
     CART STATE  (single source of truth)
     cart = [{ id, qty }]  — persisted; prices NOT stored.
     ======================================================= */
  var cart = loadCart();

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      // Validate against current MENU; drop unknown ids / bad qty.
      var out = [];
      data.forEach(function (it) {
        if (!it || typeof it.id !== "string") return;
        if (!MENU_BY_ID[it.id]) return;
        var q = parseInt(it.qty, 10);
        if (!isFinite(q) || q < 1) return;
        out.push({ id: it.id, qty: Math.min(q, 99) });
      });
      return out;
    } catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function cartFind(id) { for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i]; return null; }

  function cartAdd(id) {
    var m = MENU_BY_ID[id];
    if (!m || m.available === false) return;
    var line = cartFind(id);
    if (line) line.qty = Math.min(line.qty + 1, 99);
    else cart.push({ id: id, qty: 1 });
    saveCart(); renderCart(); bumpBadge();
  }
  function cartSetQty(id, qty) {
    var line = cartFind(id);
    if (!line) return;
    if (qty <= 0) cart = cart.filter(function (c) { return c.id !== id; });
    else line.qty = Math.min(qty, 99);
    saveCart(); renderCart();
  }
  function cartInc(id) { var l = cartFind(id); if (l) cartSetQty(id, l.qty + 1); }
  function cartDec(id) { var l = cartFind(id); if (l) cartSetQty(id, l.qty - 1); }
  function cartRemove(id) { cartSetQty(id, 0); }

  // Detailed view computed fresh from MENU every time.
  function cartDetailed() {
    var items = [];
    cart.forEach(function (c) {
      var m = MENU_BY_ID[c.id];
      if (!m) return;
      items.push({
        id: m.id, name: m.name, price: m.price, img: m.img, veg: m.veg,
        available: m.available !== false, qty: c.qty, lineTotal: m.price * c.qty
      });
    });
    var available = items.filter(function (i) { return i.available; });
    var subtotal = available.reduce(function (s, i) { return s + i.lineTotal; }, 0);
    var count = items.reduce(function (s, i) { return s + i.qty; }, 0);
    return { items: items, available: available, subtotal: subtotal, count: count };
  }
  function deliveryChargeFor(type, subtotal) {
    if (type !== "delivery") return 0;
    var fa = CONFIG.freeDeliveryAbove;
    if (fa != null && subtotal >= fa) return 0;
    return Number(CONFIG.deliveryCharge || 0);
  }

  /* =======================================================
     CART BADGE
     ======================================================= */
  var badge = document.getElementById("cartBadge");
  function updateBadge() {
    var n = cartDetailed().count;
    if (!badge) return;
    badge.textContent = n;
    badge.hidden = n === 0;
  }
  function bumpBadge() {
    updateBadge();
    if (!badge || prefersReduced) return;
    badge.classList.remove("is-bump");
    void badge.offsetWidth; // reflow to restart animation
    badge.classList.add("is-bump");
  }

  /* =======================================================
     TOAST (subtle add-to-cart feedback)
     ======================================================= */
  var toastWrap = document.getElementById("toasts");
  function toast(msg) {
    if (!toastWrap) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.textContent = msg;
    toastWrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("is-in"); });
    setTimeout(function () {
      el.classList.remove("is-in");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 2200);
  }

  /* =======================================================
     DRAWER (cart / checkout / status views)
     ======================================================= */
  var drawer = document.getElementById("cartDrawer");
  var panel = drawer ? $(".drawer__panel", drawer) : null;
  var lastFocus = null;

  function openDrawer(view) {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    showView(view || "cart");
    // focus first control in panel
    var f = panel && panel.querySelector(".drawer__close");
    if (f) f.focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function showView(name) {
    $all(".drawer__view", drawer).forEach(function (v) {
      v.classList.toggle("is-hidden", v.getAttribute("data-view") !== name);
    });
    var title = document.getElementById("drawerTitle");
    if (title) title.textContent = name === "checkout" ? "Checkout" : name === "status" ? "Almost there" : "Your Order";
    if (name === "checkout") renderCheckoutSummary();
  }

  /* ---------- Render cart view ---------- */
  var cartItemsEl = document.getElementById("cartItems");
  var cartEmptyEl = document.getElementById("cartEmpty");
  var cartFootEl = document.getElementById("cartFoot");
  var cartSubtotalEl = document.getElementById("cartSubtotal");

  function renderCart() {
    updateBadge();
    if (!cartItemsEl) return;
    var d = cartDetailed();
    if (d.items.length === 0) {
      cartItemsEl.innerHTML = "";
      if (cartEmptyEl) cartEmptyEl.hidden = false;
      if (cartFootEl) cartFootEl.hidden = true;
      return;
    }
    if (cartEmptyEl) cartEmptyEl.hidden = true;
    if (cartFootEl) cartFootEl.hidden = false;

    cartItemsEl.innerHTML = d.items.map(function (i) {
      return (
        '<div class="citem' + (i.available ? "" : " citem--off") + '" data-id="' + esc(i.id) + '">' +
          '<img class="citem__img" src="' + img(i.img, 160, 72) + '" width="80" height="80" loading="lazy" decoding="async" alt="' + esc(i.name) + '" />' +
          '<div class="citem__info">' +
            '<p class="citem__name">' + vegMark(i.veg) + esc(i.name) + '</p>' +
            '<p class="citem__unit">' + money(i.price) + (i.available ? "" : ' · <span class="citem__soldtag">unavailable</span>') + '</p>' +
            '<div class="citem__bottom">' +
              '<div class="stepper" role="group" aria-label="Quantity for ' + esc(i.name) + '">' +
                '<button class="stepper__btn" data-dec="' + esc(i.id) + '" aria-label="Decrease quantity">−</button>' +
                '<span class="stepper__q" aria-live="polite">' + i.qty + '</span>' +
                '<button class="stepper__btn" data-inc="' + esc(i.id) + '" aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<span class="citem__line">' + money(i.lineTotal) + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="citem__remove" data-remove="' + esc(i.id) + '" aria-label="Remove ' + esc(i.name) + '">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6 7h12M9 7V5h6v2m-7 0 1 12h6l1-12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>'
      );
    }).join("");

    if (cartSubtotalEl) cartSubtotalEl.textContent = money(d.subtotal);
    if (document.getElementById("toCheckout")) {
      document.getElementById("toCheckout").disabled = d.available.length === 0;
    }
  }

  /* =======================================================
     CHECKOUT
     ======================================================= */
  var form = document.getElementById("checkoutForm");
  var paySelect = document.getElementById("coPayment");
  // Populate payment options from config
  if (paySelect && Array.isArray(CONFIG.paymentPreferences)) {
    paySelect.innerHTML = CONFIG.paymentPreferences.map(function (p) {
      return '<option value="' + esc(p) + '">' + esc(p) + "</option>";
    }).join("");
  }

  function currentType() {
    var r = form ? form.querySelector('input[name="fulfillment"]:checked') : null;
    return r ? r.value : (CONFIG.deliveryEnabled ? "delivery" : "pickup");
  }
  function syncFulfillment() {
    if (!form) return;
    var type = currentType();
    var delBlock = document.getElementById("deliveryFields");
    if (delBlock) delBlock.hidden = type !== "delivery";
    // required flags
    ["coAddress", "coLocality"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.required = type === "delivery";
    });
    renderCheckoutSummary();
  }

  function renderCheckoutSummary() {
    var box = document.getElementById("checkoutSummary");
    if (!box) return;
    var d = cartDetailed();
    var type = currentType();
    var delivery = deliveryChargeFor(type, d.subtotal);
    var total = d.subtotal + delivery;
    var rows = d.available.map(function (i) {
      return '<li><span>' + i.qty + '× ' + esc(i.name) + '</span><span>' + money(i.lineTotal) + '</span></li>';
    }).join("");
    box.innerHTML =
      '<ul class="cosum__items">' + rows + '</ul>' +
      '<dl class="cosum__totals">' +
        '<div><dt>Subtotal</dt><dd>' + money(d.subtotal) + '</dd></div>' +
        '<div><dt>' + (type === "delivery" ? "Delivery" : "Pickup") + '</dt><dd>' + (type === "delivery" ? (delivery === 0 ? "Free" : money(delivery)) : "—") + '</dd></div>' +
        '<div class="cosum__grand"><dt>Estimated total</dt><dd>' + money(total) + '</dd></div>' +
      '</dl>';
  }

  // ---- Validation ----
  function setError(id, msg) {
    var field = document.getElementById(id);
    var err = document.querySelector('[data-err="' + id + '"]');
    if (field) field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg || "";
    return !msg;
  }
  function validPhone(v) {
    var cleaned = String(v || "").replace(/[\s\-().]/g, "");
    return /^(?:\+?91|0)?[6-9]\d{9}$/.test(cleaned);
  }
  function validateCheckout() {
    if (!form) return false;
    var ok = true;
    var type = currentType();
    var name = document.getElementById("coName").value.trim();
    var phone = document.getElementById("coPhone").value.trim();
    if (name.length < 2) ok = setError("coName", "Please enter your name.") && ok;
    else setError("coName", "");
    if (!validPhone(phone)) ok = setError("coPhone", "Enter a valid 10-digit Indian mobile number.") && ok;
    else setError("coPhone", "");
    if (type === "delivery") {
      var addr = document.getElementById("coAddress").value.trim();
      var loc = document.getElementById("coLocality").value.trim();
      if (addr.length < 5) ok = setError("coAddress", "Please enter your delivery address.") && ok;
      else setError("coAddress", "");
      if (loc.length < 2) ok = setError("coLocality", "Please enter your locality / area.") && ok;
      else setError("coLocality", "");
    } else {
      setError("coAddress", ""); setError("coLocality", "");
    }
    return ok;
  }

  // ---- WhatsApp message + order build ----
  function isWhatsAppConfigured() {
    return /^\d{11,14}$/.test(String(CONFIG.whatsappNumber || ""));
  }
  function orderRef() {
    return "NGI-" + Date.now().toString(36).toUpperCase() + "-" +
      Math.random().toString(36).slice(2, 5).toUpperCase();
  }
  function collectForm() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; };
    return {
      type: currentType(),
      name: g("coName"), phone: g("coPhone"),
      address: g("coAddress"), locality: g("coLocality"),
      landmark: g("coLandmark"), instructions: g("coInstructions"),
      payment: g("coPayment")
    };
  }
  function buildMessage(d, f, ref) {
    var type = f.type === "delivery" ? "Delivery" : "Pickup";
    var delivery = deliveryChargeFor(f.type, d.subtotal);
    var total = d.subtotal + delivery;
    var L = [];
    L.push("*NEW ORDER — " + (CONFIG.name || "New Grill In").toUpperCase() + "*");
    L.push("Order Reference: " + ref);
    L.push("Date/Time: " + new Date().toLocaleString("en-IN"));
    L.push("Order Type: " + type);
    L.push("");
    L.push("*CUSTOMER DETAILS*");
    L.push("Name: " + f.name);
    L.push("Phone: " + f.phone);
    if (f.type === "delivery") {
      L.push("");
      L.push("*DELIVERY DETAILS*");
      L.push("Address: " + f.address);
      L.push("Locality: " + f.locality);
      if (f.landmark) L.push("Landmark: " + f.landmark);
      if (f.instructions) L.push("Instructions: " + f.instructions);
    }
    L.push("");
    L.push("*ORDER ITEMS*");
    d.available.forEach(function (i, idx) {
      L.push((idx + 1) + ". " + i.name);
      L.push("   Quantity: " + i.qty);
      L.push("   Unit Price: " + money(i.price));
      L.push("   Item Total: " + money(i.lineTotal));
    });
    L.push("");
    L.push("*PRICE SUMMARY*");
    L.push("Subtotal: " + money(d.subtotal));
    L.push("Delivery Charge: " + (f.type === "delivery" ? (delivery === 0 ? "Free" : money(delivery)) : "—"));
    L.push("Estimated Total: " + money(total));
    L.push("Payment Preference: " + (f.payment || "To be confirmed"));
    L.push("");
    L.push("Please confirm availability and the final payable amount.");
    L.push("Thank you!");
    return L.join("\n");
  }
  function buildURL(message) {
    return "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(message);
  }
  // Single builder used by the submit handler AND by tests (window.NGI).
  function buildOrder() {
    var d = cartDetailed();
    var res = { valid: false, configured: isWhatsAppConfigured(), reason: "" };
    if (d.available.length === 0) { res.reason = "empty"; return res; }
    if (!validateCheckout()) { res.reason = "invalid"; return res; }
    if (CONFIG.minimumOrderAmount != null && d.subtotal < CONFIG.minimumOrderAmount) {
      res.reason = "minimum"; res.min = CONFIG.minimumOrderAmount; return res;
    }
    var f = collectForm();
    var ref = orderRef();
    var message = buildMessage(d, f, ref);
    res.valid = true;
    res.ref = ref; res.message = message; res.url = buildURL(message);
    res.form = f; res.detail = d;
    return res;
  }

  // ---- Submit ----
  var submitting = false;
  function submitCheckout(e) {
    if (e) e.preventDefault();
    if (submitting) return;
    var res = buildOrder();

    if (!res.valid) {
      if (res.reason === "empty") { toast("Your cart is empty."); showView("cart"); }
      else if (res.reason === "minimum") { toast("Minimum order is " + money(res.min) + "."); }
      else { // invalid — focus first error
        var firstErr = form.querySelector('[aria-invalid="true"]');
        if (firstErr) firstErr.focus();
      }
      return;
    }

    if (!res.configured) {
      // Never open a broken wa.me link. Show the generated message + how to fix.
      showStatus({ configured: false, message: res.message, ref: res.ref });
      return;
    }

    submitting = true;
    var btn = document.getElementById("continueWa");
    if (btn) btn.disabled = true;

    // Open WhatsApp directly from the user's click (avoids popup blockers).
    window.__NGI_lastWhatsApp = { url: res.url, message: res.message, ref: res.ref };
    var a = document.createElement("a");
    a.href = res.url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);

    // Accurate status — NOT a false "order placed". Cart is preserved.
    showStatus({ configured: true, message: res.message, ref: res.ref, url: res.url });

    setTimeout(function () { submitting = false; if (btn) btn.disabled = false; }, 1600);
  }

  // ---- Status view ----
  function showStatus(opts) {
    var el = document.getElementById("statusView");
    if (!el) return;
    var configured = opts.configured;
    var html = "";
    if (configured) {
      html =
        '<div class="status__icon status__icon--ok" aria-hidden="true">✓</div>' +
        '<h3 class="status__title">Your order is ready in WhatsApp</h3>' +
        '<p class="status__text">Review the message and press <strong>Send</strong> in WhatsApp to submit your order to ' + esc(CONFIG.name) + '. ' +
        'Opening WhatsApp does not place the order on its own — the restaurant only receives it once you send it.</p>' +
        '<p class="status__ref">Reference: <strong>' + esc(opts.ref) + '</strong></p>' +
        '<div class="status__actions">' +
          '<a class="btn btn--whatsapp" href="' + esc(opts.url) + '" target="_blank" rel="noopener">Open WhatsApp again</a>' +
          '<button class="btn btn--ghost" type="button" data-copy>Copy order text</button>' +
        '</div>';
    } else {
      html =
        '<div class="status__icon status__icon--warn" aria-hidden="true">!</div>' +
        '<h3 class="status__title">WhatsApp number not set yet</h3>' +
        '<p class="status__text">Your order summary below is ready. To enable one-tap ordering, add the restaurant’s WhatsApp number in <code>js/config.js</code> (<code>RESTAURANT_CONFIG.whatsappNumber</code>). For now you can copy the order text.</p>' +
        '<div class="status__actions">' +
          '<button class="btn btn--primary" type="button" data-copy>Copy order text</button>' +
        '</div>';
    }
    html += '<textarea class="status__msg" id="statusMsg" readonly rows="10" aria-label="Order message"></textarea>' +
            '<button class="btn btn--ghost status__back" type="button" data-status-back>Back to menu</button>';
    el.innerHTML = html;
    var ta = document.getElementById("statusMsg");
    if (ta) ta.value = opts.message; // value assignment is safe (no HTML parsing)
    showView("status");
  }

  /* =======================================================
     EVENT WIRING
     ======================================================= */
  // Add to cart (event delegation on the menu grid)
  if (grid) {
    grid.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-add]") : null;
      if (!b) return;
      var id = b.getAttribute("data-add");
      var m = MENU_BY_ID[id];
      cartAdd(id);
      if (m) toast(esc(m.name) + " added");
    });
  }
  // Cart item controls (delegation)
  if (cartItemsEl) {
    cartItemsEl.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : null;
      var inc = e.target.closest && e.target.closest("[data-inc]");
      var dec = e.target.closest && e.target.closest("[data-dec]");
      var rem = e.target.closest && e.target.closest("[data-remove]");
      if (inc) cartInc(inc.getAttribute("data-inc"));
      else if (dec) cartDec(dec.getAttribute("data-dec"));
      else if (rem) cartRemove(rem.getAttribute("data-remove"));
    });
  }

  // Open cart buttons (header + anywhere with data-open-cart)
  $all("[data-open-cart]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openDrawer("cart"); });
  });
  // Close
  $all("[data-cart-close]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); closeDrawer(); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) closeDrawer();
  });
  // Simple focus containment inside the open drawer
  if (panel) {
    panel.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = $all('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', panel)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // Cart → checkout
  var toCheckoutBtn = document.getElementById("toCheckout");
  if (toCheckoutBtn) toCheckoutBtn.addEventListener("click", function () {
    if (cartDetailed().available.length === 0) { toast("Add an item first."); return; }
    showView("checkout");
    syncFulfillment();
    var n = document.getElementById("coName"); if (n) n.focus();
  });
  // Back to cart
  var backBtn = document.getElementById("backToCart");
  if (backBtn) backBtn.addEventListener("click", function () { showView("cart"); });

  // Empty-state browse
  $all("[data-browse]").forEach(function (b) {
    b.addEventListener("click", function () { closeDrawer(); location.hash = "#menu"; });
  });

  // Fulfillment radios + live summary
  if (form) {
    $all('input[name="fulfillment"]', form).forEach(function (r) {
      r.addEventListener("change", syncFulfillment);
    });
    form.addEventListener("submit", submitCheckout);
    // live summary on input
    form.addEventListener("input", function () { renderCheckoutSummary(); });
  }

  // Status view delegated actions (copy / back)
  var statusViewEl = document.getElementById("statusView");
  if (statusViewEl) {
    statusViewEl.addEventListener("click", function (e) {
      if (e.target.closest("[data-copy]")) {
        var ta = document.getElementById("statusMsg");
        if (ta) {
          ta.select();
          var done = false;
          try { done = document.execCommand("copy"); } catch (x) {}
          if (navigator.clipboard && !done) navigator.clipboard.writeText(ta.value).catch(function () {});
          toast("Order text copied");
        }
      } else if (e.target.closest("[data-status-back]")) {
        closeDrawer(); showView("cart"); location.hash = "#menu";
      }
    });
  }

  /* =======================================================
     NAV: sticky header, mobile nav, filtering, active link
     ======================================================= */
  var header = $("[data-header]");
  function onScroll() { if (header) header.setAttribute("data-scrolled", window.scrollY > 20 ? "true" : "false"); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (toggle) { toggle.setAttribute("aria-expanded", open ? "true" : "false"); toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu"); }
    if (mobileNav) mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
  }
  if (toggle) toggle.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  $all("[data-close]").forEach(function (el) { el.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) { setNav(false); if (toggle) toggle.focus(); }
  });
  // If the viewport grows to desktop while the menu is open, close it so the
  // scroll lock never gets stuck.
  var desktopMQ = window.matchMedia("(min-width: 900px)");
  var onDesktop = function (e) { if (e.matches && document.body.classList.contains("nav-open")) setNav(false); };
  if (desktopMQ.addEventListener) desktopMQ.addEventListener("change", onDesktop);
  else if (desktopMQ.addListener) desktopMQ.addListener(onDesktop);

  // Menu filtering
  var chips = $all(".chip");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("is-active"); c.setAttribute("aria-selected", "false"); });
      chip.classList.add("is-active"); chip.setAttribute("aria-selected", "true");
      var f = chip.getAttribute("data-filter");
      $all(".dish").forEach(function (d, i) {
        var show = f === "all" || d.getAttribute("data-cat") === f;
        if (prefersReduced || !window.gsap) { d.classList.toggle("is-hidden", !show); return; }
        if (show) {
          d.classList.remove("is-hidden");
          window.gsap.fromTo(d, { opacity: 0, y: 18, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, delay: i * 0.03, ease: "power2.out", overwrite: true });
        } else {
          window.gsap.to(d, { opacity: 0, y: 10, duration: 0.25, ease: "power1.in", overwrite: true, onComplete: function () { d.classList.add("is-hidden"); } });
        }
      });
    });
  });

  // Active nav link
  var navLinks = $all(".nav__link");
  var sections = navLinks.map(function (l) { return document.querySelector(l.getAttribute("href")); });
  if ("IntersectionObserver" in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) navLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { if (s) secObs.observe(s); });
  }

  /* =======================================================
     MOTION
     ======================================================= */
  function basicReveal() {
    if (!("IntersectionObserver" in window)) { $all("[data-reveal], .dish").forEach(function (el) { el.classList.add("is-in"); }); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); obs.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    $all("[data-reveal], .dish").forEach(function (el) { obs.observe(el); });
  }
  function initGsap() {
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero__img", { scale: 1.28, duration: 1.6, ease: "power2.out" }, 0)
      .from(".hero__eyebrow", { y: 20, opacity: 0, duration: 0.7 }, 0.3)
      .from(".hero__title .line", { yPercent: 115, opacity: 0, duration: 1, stagger: 0.12 }, 0.4)
      .from(".hero__lede", { y: 24, opacity: 0, duration: 0.8 }, 0.75)
      .from(".hero__actions", { y: 24, opacity: 0, duration: 0.8 }, 0.9)
      .from(".hero__scroll", { opacity: 0, duration: 0.8 }, 1.1);
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%" } });
    });
    gsap.utils.toArray(".menu__grid").forEach(function (g) {
      gsap.fromTo(g.querySelectorAll(".dish"), { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: g, start: "top 82%" } });
    });
    gsap.utils.toArray(".gfig").forEach(function (f, i) {
      gsap.fromTo(f, { y: 40, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out", delay: (i % 4) * 0.05, scrollTrigger: { trigger: f, start: "top 90%" } });
    });
    gsap.utils.toArray("[data-parallax]").forEach(function (el) {
      var amt = parseFloat(el.getAttribute("data-parallax")) || 0.12;
      gsap.to(el.querySelector("img"), { yPercent: amt * 100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });
    var track = $("[data-marquee]");
    if (track) gsap.to(track, { xPercent: -50, duration: 24, ease: "none", repeat: -1 });
  }
  function boot() {
    if (!prefersReduced && window.gsap && window.ScrollTrigger) {
      try { initGsap(); } catch (e) { basicReveal(); }
    } else {
      $all("[data-reveal], .dish").forEach(function (el) { el.classList.add("is-in"); });
      if (!prefersReduced) basicReveal();
    }
  }

  // Initial paint
  renderCart();
  if (document.readyState === "complete" || window.gsap) boot();
  else window.addEventListener("load", boot);

  /* Debug / test + config surface (safe: this is the user's own page) */
  window.NGI = {
    config: CONFIG,
    menu: MENU,
    getCart: cartDetailed,
    buildOrder: buildOrder,
    isWhatsAppConfigured: isWhatsAppConfigured,
    addToCart: cartAdd,
    openDrawer: openDrawer
  };
})();
