/* =========================================================
   New Grill In — interactions & motion
   Vanilla JS. GSAP + ScrollTrigger enhance; graceful fallback.
   ========================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var UNS = "https://images.unsplash.com/photo-";
  function img(id, w, q) { return UNS + id + "?w=" + (w || 800) + "&q=" + (q || 78) + "&auto=format&fit=crop"; }
  function srcset(id) {
    return img(id, 500, 72) + " 500w, " + img(id, 800, 78) + " 800w, " + img(id, 1100, 80) + " 1100w";
  }

  /* ---------- Menu data (SAMPLE — prices illustrative, ₹) ---------- */
  var DISHES = [
    { name: "Smoky Charcoal Tikka", cat: "grill", price: "₹220",
      desc: "Marinated overnight, grilled over live charcoal with a squeeze of lime.",
      id: "1544025162-d76694265947" },
    { name: "Flame-Grilled Chicken", cat: "grill", price: "₹260",
      desc: "Half chicken, slow-grilled with house spice rub and smoky char.",
      id: "1598515214211-89d3c73ae83b" },
    { name: "Grilled Platter", cat: "grill", price: "₹380",
      desc: "A sharing board of assorted grilled cuts, served sizzling.",
      id: "1600891964092-4316c288032e" },
    { name: "The Grill-In Classic", cat: "burgers", price: "₹180",
      desc: "Flame-grilled patty, melted cheese, crisp veg and signature sauce.",
      id: "1568901346375-23c9450c58cd" },
    { name: "Double Smash Burger", cat: "burgers", price: "₹240",
      desc: "Two seared patties stacked tall with pickles and smoky mayo.",
      id: "1550547660-d9450f859349" },
    { name: "Crispy Chicken Burger", cat: "burgers", price: "₹200",
      desc: "Golden fried chicken, slaw and chilli mayo in a toasted bun.",
      id: "1606755962773-d324e0a13086" },
    { name: "Wood-Fired Margherita", cat: "pizza", price: "₹230",
      desc: "Tomato, mozzarella and basil on a blistered, chewy base.",
      id: "1604382354936-07c5d9983bd3" },
    { name: "Loaded Grill Pizza", cat: "pizza", price: "₹320",
      desc: "Grilled toppings piled high over a rich, slow-proved crust.",
      id: "1513104890138-7c749659a591" },
    { name: "Spicy Paneer Pizza", cat: "pizza", price: "₹280",
      desc: "Chilli-spiced paneer, peppers and onion with a mozzarella pull.",
      id: "1565299624946-b28f40a0ae38" },
    { name: "Grilled Club Sandwich", cat: "sandwiches", price: "₹160",
      desc: "Triple-stacked and pressed on the grill until golden.",
      id: "1528735602780-2552fd46c7af" },
    { name: "Smoky Veg Sub", cat: "sandwiches", price: "₹140",
      desc: "Grilled vegetables, melted cheese and herbs in a crusty roll.",
      id: "1509722747041-616f39b57569" },
    { name: "Chicken Melt", cat: "sandwiches", price: "₹190",
      desc: "Pulled grilled chicken and cheese, toasted to order.",
      id: "1539252554453-80ab65ce3586" }
  ];

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

  var arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Render menu ---------- */
  var grid = document.getElementById("menuGrid");
  if (grid) {
    var html = DISHES.map(function (d) {
      return (
        '<article class="dish" data-cat="' + d.cat + '">' +
          '<div class="dish__media">' +
            '<img class="dish__img" src="' + img(d.id, 800, 78) + '" srcset="' + srcset(d.id) + '" ' +
              'sizes="(max-width: 560px) 90vw, (max-width: 900px) 45vw, 360px" ' +
              'width="800" height="600" loading="lazy" decoding="async" alt="' + d.name + '" />' +
            '<span class="dish__cat">' + d.cat + '</span>' +
          '</div>' +
          '<div class="dish__body">' +
            '<div class="dish__top">' +
              '<h3 class="dish__name">' + d.name + '</h3>' +
              '<span class="dish__price">' + d.price + '</span>' +
            '</div>' +
            '<p class="dish__desc">' + d.desc + '</p>' +
            '<a class="dish__order" href="#order">Add to order ' + arrow + '</a>' +
          '</div>' +
        '</article>'
      );
    }).join("");
    grid.innerHTML = html;
  }

  /* ---------- Render gallery ---------- */
  var gGrid = document.getElementById("galleryGrid");
  if (gGrid) {
    gGrid.innerHTML = GALLERY.map(function (g) {
      return (
        '<figure class="gfig ' + (g.cls || "") + '">' +
          '<img src="' + img(g.id, 700, 76) + '" srcset="' + srcset(g.id) + '" ' +
            'sizes="(max-width: 768px) 50vw, 25vw" width="700" height="525" ' +
            'loading="lazy" decoding="async" alt="' + g.alt + '" />' +
        '</figure>'
      );
    }).join("");
  }

  /* ---------- Year ---------- */
  var yEl = document.getElementById("year");
  if (yEl) yEl.textContent = new Date().getFullYear();

  /* ---------- Hero video — crossfading food clips ---------- */
  (function initHeroVideo() {
    if (prefersReduced) return;                       // reduced-motion: keep image
    var conn = navigator.connection || navigator.webkitConnection;
    if (conn && conn.saveData) return;                // data-saver: keep image
    var videos = Array.prototype.slice.call(document.querySelectorAll("[data-hero-video]"));
    if (videos.length < 2) return;
    var v0 = videos[0];
    if (!v0.canPlayType || !v0.canPlayType("video/mp4")) return; // no mp4 support

    // Order: lightest clip first so playback starts fast and phones only ever
    // fetch this one (grill/pizza are requested lazily, desktop only).
    var PLAYLIST = ["assets/video/burger.mp4", "assets/video/grill.mp4", "assets/video/pizza.mp4"];
    var FADE = 1000;

    function isSmall() { return window.matchMedia("(max-width: 700px)").matches; }
    function fallbackToImage() {
      videos.forEach(function (v) { v.classList.remove("is-active"); try { v.pause(); } catch (e) {} });
    }

    function cycle(layer, srcIdx) {
      var v = videos[layer];
      var other = videos[1 - layer];
      v.loop = false;
      v.src = PLAYLIST[srcIdx];
      v.load();
      v.addEventListener("loadeddata", function onReady() {
        v.removeEventListener("loadeddata", onReady);
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
        v.classList.add("is-active");
        other.classList.remove("is-active");

        var next = function () { cycle(1 - layer, (srcIdx + 1) % PLAYLIST.length); };
        var schedule = function () {
          var dur = v.duration;
          if (isFinite(dur) && dur > 0.5) {
            setTimeout(next, Math.max(dur * 1000 - FADE, 1500));
          } else {
            v.addEventListener("ended", next, { once: true });
          }
        };

        // On the first clip, let the viewport settle, then decide: phones just
        // loop this one light clip (and fetch nothing more); larger screens cycle.
        if (srcIdx === 0) {
          setTimeout(function () {
            if (isSmall()) { v.loop = true; } else { schedule(); }
          }, 500);
          return;
        }
        schedule();
      }, { once: true });
      v.addEventListener("error", function () {
        if (srcIdx === 0) fallbackToImage();                    // first clip failed → image
        else cycle(1 - layer, (srcIdx + 1) % PLAYLIST.length);  // skip a broken later clip
      }, { once: true });
    }
    cycle(0, 0);
  })();

  /* ---------- Sticky header state ---------- */
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (!header) return;
    header.setAttribute("data-scrolled", window.scrollY > 20 ? "true" : "false");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (mobileNav) mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
  }
  if (toggle) toggle.addEventListener("click", function () {
    setNav(!document.body.classList.contains("nav-open"));
  });
  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () { setNav(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) setNav(false);
  });

  /* ---------- Menu filtering ---------- */
  var chips = document.querySelectorAll(".chip");
  var dishes = function () { return Array.prototype.slice.call(document.querySelectorAll(".dish")); };
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("is-active"); c.setAttribute("aria-selected", "false"); });
      chip.classList.add("is-active");
      chip.setAttribute("aria-selected", "true");
      var f = chip.getAttribute("data-filter");
      dishes().forEach(function (d, i) {
        var show = f === "all" || d.getAttribute("data-cat") === f;
        if (prefersReduced || !window.gsap) {
          d.classList.toggle("is-hidden", !show);
          return;
        }
        if (show) {
          d.classList.remove("is-hidden");
          window.gsap.fromTo(d, { opacity: 0, y: 18, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, delay: i * 0.03, ease: "power2.out", overwrite: true });
        } else {
          window.gsap.to(d, { opacity: 0, y: 10, duration: 0.25, ease: "power1.in", overwrite: true,
            onComplete: function () { d.classList.add("is-hidden"); } });
        }
      });
    });
  });

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  var sections = navLinks.map(function (l) {
    return document.querySelector(l.getAttribute("href"));
  });
  if ("IntersectionObserver" in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (l) {
            l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id);
          });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { if (s) secObs.observe(s); });
  }

  /* ======================================================
     Motion — GSAP if present & motion allowed, else reveal.
     ====================================================== */
  function basicReveal() {
    // IntersectionObserver fallback reveal
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal], .dish").forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); obs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    document.querySelectorAll("[data-reveal], .dish").forEach(function (el) { obs.observe(el); });
  }

  function initGsap() {
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    // Hero intro timeline
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero__img", { scale: 1.28, duration: 1.6, ease: "power2.out" }, 0)
      .from(".hero__eyebrow", { y: 20, opacity: 0, duration: 0.7 }, 0.3)
      .from(".hero__title .line", { yPercent: 115, opacity: 0, duration: 1, stagger: 0.12 }, 0.4)
      .from(".hero__lede", { y: 24, opacity: 0, duration: 0.8 }, 0.75)
      .from(".hero__actions", { y: 24, opacity: 0, duration: 0.8 }, 0.9)
      .from(".hero__scroll", { opacity: 0, duration: 0.8 }, 1.1);

    // Generic reveals
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.fromTo(el, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });

    // Staggered dish cards
    gsap.utils.toArray(".menu__grid").forEach(function (g) {
      gsap.fromTo(g.querySelectorAll(".dish"), { y: 36, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: g, start: "top 82%" }
      });
    });

    // Gallery figures
    gsap.utils.toArray(".gfig").forEach(function (f, i) {
      gsap.fromTo(f, { y: 40, opacity: 0, scale: 0.97 }, {
        y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out", delay: (i % 4) * 0.05,
        scrollTrigger: { trigger: f, start: "top 90%" }
      });
    });

    // Parallax on story image
    gsap.utils.toArray("[data-parallax]").forEach(function (el) {
      var amt = parseFloat(el.getAttribute("data-parallax")) || 0.12;
      gsap.to(el.querySelector("img"), {
        yPercent: amt * 100, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    // Marquee loop
    var track = document.querySelector("[data-marquee]");
    if (track) {
      gsap.to(track, { xPercent: -50, duration: 24, ease: "none", repeat: -1 });
    }
  }

  function boot() {
    if (!prefersReduced && window.gsap && window.ScrollTrigger) {
      try { initGsap(); }
      catch (e) { basicReveal(); }
    } else {
      // reduced-motion or GSAP failed to load: show everything
      document.querySelectorAll("[data-reveal], .dish").forEach(function (el) { el.classList.add("is-in"); });
      if (!prefersReduced) basicReveal();
    }
  }

  // GSAP is loaded with defer; ensure it's ready.
  if (document.readyState === "complete" || window.gsap) {
    boot();
  } else {
    window.addEventListener("load", boot);
  }
})();
