/* Vantload landing page – small, dependency-free. Everything here is progressive enhancement. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ── 1. Links come from config.js (single place to edit) ── */
  var cfg = window.VANTLOAD_CONFIG || {};
  $all("[data-cfg]").forEach(function (el) {
    var key = el.getAttribute("data-cfg");
    var url = cfg[key];
    if (url) {
      el.setAttribute("href", url + (el.getAttribute("data-suffix") || ""));
      if (/^https?:/i.test(url) && (key === "CHROME_STORE_URL" || key === "GITHUB_URL" || key === "DOWNLOAD_URL")) {
        el.setAttribute("rel", "noopener");
      }
    } else if (key === "CHROME_STORE_URL") {
      // listing not live yet: show an honest state instead of a dead link
      el.classList.add("is-soon");
      el.setAttribute("aria-disabled", "true");
      el.removeAttribute("href");
      el.textContent = el.getAttribute("data-soon") || "Coming soon";
    }
  });

  /* ── 2. Nav: scrolled state + mobile menu ── */
  var nav = $("#nav"), toggle = $("#navToggle"), links = $("#navLinks");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 8); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && links.classList.contains("open")) { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
  });

  /* ── 3. Scroll reveal ── */
  var revealTargets = $all(".section-head, .trio-card, .conn, .shot-card, .steps li, .stage, .mini, .feat, .install-strip, .g-item, .pro-card, .faq details, .final-inner");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in"); io.unobserve(el);
        // once it has faded in, hand the element back to its own hover transitions
        setTimeout(function () { el.removeAttribute("data-reveal"); el.style.transitionDelay = ""; }, 1000);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealTargets.forEach(function (el, i) {
      el.setAttribute("data-reveal", "");
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      io.observe(el);
    });
  }

  /* ── 4. Multi-connection demo ── */
  var demo = $("#connDemo");
  if (demo) {
    var bar = $("#connBar"), label = $("#connLabel"), sParts = $("#statParts"), sPct = $("#statPct"), sSpeed = $("#statSpeed");
    var buttons = $all(".seg-control button", demo);
    var n = 8, fills = [], speeds = [], t = 0, last = 0, hold = 0, raf = 0, inView = false, userPicked = false, cycleTimer = 0;
    var DURATION = 3.4;          // seconds for the slowest part, purely visual
    var PER_CONN = 2, LINE = 50; // the worked example in the caption: MB/s per connection, MB/s line speed

    function setN(next) {
      n = next;
      bar.setAttribute("data-n", n);
      bar.innerHTML = "";
      fills = []; speeds = [];
      for (var i = 0; i < n; i++) {
        var seg = document.createElement("div"); seg.className = "seg";
        var fill = document.createElement("i"); seg.appendChild(fill); bar.appendChild(seg);
        fills.push(fill);
        speeds.push(0.72 + Math.random() * 0.28);   // parts finish at slightly different moments, like real life
      }
      label.textContent = n + (n === 1 ? " connection" : " connections");
      sParts.textContent = n;
      sSpeed.textContent = Math.min(n * PER_CONN, LINE) + " MB/s";
      buttons.forEach(function (b) {
        var on = +b.getAttribute("data-n") === n;
        b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      t = 0; hold = 0;
      if (reduceMotion) paint(0.62);
    }

    function paint(globalP) {
      var sum = 0;
      for (var i = 0; i < n; i++) {
        var p = reduceMotion ? globalP : Math.min(1, (t / DURATION) * speeds[i]);
        fills[i].style.transform = "scaleX(" + p + ")";
        sum += p;
      }
      sPct.textContent = Math.round((sum / n) * 100) + "%";
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      if (hold > 0) { hold -= dt; if (hold <= 0) { t = 0; for (var k = 0; k < n; k++) speeds[k] = 0.72 + Math.random() * 0.28; } return; }
      t += dt;
      paint();
      if (t / DURATION * 0.72 >= 1) { paint(); hold = 1.1; }
    }

    function start() { if (!raf && !reduceMotion) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { userPicked = true; clearInterval(cycleTimer); setN(+b.getAttribute("data-n")); });
    });

    setN(8);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView) {
          start();
          if (!userPicked && !reduceMotion && !cycleTimer) {
            var order = [1, 4, 8, 16, 32], idx = 2;
            cycleTimer = setInterval(function () {
              if (userPicked || !inView) return;
              idx = (idx + 1) % order.length; setN(order[idx]);
            }, 6600);
          }
        } else { stop(); }
      }, { threshold: 0.25 }).observe(demo);
    } else { start(); }
  }

  /* ── 5. Quality picker recreation ── */
  var picker = $("#picker");
  if (picker) {
    var go = $("#pickerGo"), note = $("#fmtNote");
    var noteMP4 = "<strong>MP4</strong> is the most compatible and plays almost everywhere. <strong>MKV</strong> keeps the best quality available without re-encoding.";
    var resetTimer = 0;
    go.addEventListener("click", function () {
      if (go.classList.contains("sent")) return;
      go.classList.add("sent"); go.textContent = "✓ Sent to Vantload";
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () { go.classList.remove("sent"); go.textContent = "Download"; }, 2600);
    });
    $all('input[name="f"]', picker).forEach(function (r) {
      r.addEventListener("change", function () {
        note.innerHTML = r.value === "MKV"
          ? "<strong>MKV</strong> keeps the best quality available, with no re-encoding. Choose <strong>MP4</strong> when you want it to play almost everywhere."
          : noteMP4;
      });
    });
  }

  /* ── 6. Screenshot lightbox ── */
  var lb = $("#lightbox"), lbImg = $("#lbImg");
  if (lb && typeof lb.showModal === "function") {
    $all(".g-item").forEach(function (b) {
      b.addEventListener("click", function () {
        lbImg.src = b.getAttribute("data-full"); lbImg.alt = b.getAttribute("data-alt") || "";
        lb.showModal();
      });
    });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target === lbImg) lb.close(); });
  }

  /* ── 7. Deep links into the FAQ open the answer ── */
  function openFaqFromHash() {
    var id = location.hash.slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === "DETAILS") el.open = true;
  }
  openFaqFromHash();
  window.addEventListener("hashchange", openFaqFromHash);

  /* ── 8. Footer year ── */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
