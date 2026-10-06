/* Vantload landing page – small, dependency-free. Everything here is progressive enhancement. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ── 0. Lazy images fade in (kept first: CSS hides them until marked, so this must always run) ── */
  $all('img[loading="lazy"]').forEach(function (img) {
    function mark() { img.classList.add("loaded"); }
    if (img.complete) mark();
    else { img.addEventListener("load", mark); img.addEventListener("error", mark); }
  });

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
  var prog = $("#scrollProgress"), toTop = $("#toTop"), topShown = false, topTimer = 0, ticking = false;
  function onScroll() {
    ticking = false;
    nav.classList.toggle("scrolled", window.scrollY > 8);
    var doc = document.documentElement, max = doc.scrollHeight - doc.clientHeight;
    if (prog) prog.style.setProperty("--p", (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4));
    var want = window.scrollY > 900;
    if (toTop && want !== topShown) {
      topShown = want;
      clearTimeout(topTimer);
      if (want) { toTop.hidden = false; requestAnimationFrame(function () { toTop.classList.add("show"); }); }
      else { toTop.classList.remove("show"); topTimer = setTimeout(function () { toTop.hidden = true; }, 320); }
    }
  }
  onScroll();
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  // highlight the nav link for the section in the middle of the screen
  if ("IntersectionObserver" in window) {
    var linkFor = {};
    $all(".nav-links a").forEach(function (a) { var id = (a.getAttribute("href") || "").slice(1); if (id) linkFor[id] = a; });
    var current = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (current) current.classList.remove("active");
        current = linkFor[en.target.id] || null;      // sections without a link (hero, speed, pro) clear the highlight
        if (current) current.classList.add("active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", "speed", "extension", "features", "screenshots", "pro", "faq", "changelog", "download"].forEach(function (id) {
      var el = document.getElementById(id); if (el) spy.observe(el);
    });
  }
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
  var revealTargets = $all(".section-head, .trio-card, .conn, .shot-card, .steps li, .stage, .mini, .feat, .install-strip, .g-item, .pro-card, .faq details, .rel, .final-inner");
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

  /* ── 8. The "32" counts up when it scrolls into view ── */
  if (!reduceMotion && "IntersectionObserver" in window) {
    $all(".count").forEach(function (el) {
      var to = +el.getAttribute("data-to") || 0;
      var io2 = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io2.disconnect();
        var start = performance.now(), dur = 1100;
        (function tick(now) {
          var t = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.max(1, Math.round(to * eased));
          if (t < 1) requestAnimationFrame(tick); else el.textContent = to;
        })(start);
      }, { threshold: 0.8 });
      io2.observe(el);
    });
  }

  /* ── 9. Pointer effects (fine pointers only): hero tilt + card spotlight ── */
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !reduceMotion) {
    var shotImg = $(".hero-shot img");
    if (shotImg) {
      var fig = shotImg.parentNode, tiltRaf = 0, rx = 0, ry = 0;
      fig.addEventListener("pointermove", function (e) {
        var r = fig.getBoundingClientRect();
        ry = (((e.clientX - r.left) / r.width) - 0.5) * 4;
        rx = -(((e.clientY - r.top) / r.height) - 0.5) * 3;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(function () {
          tiltRaf = 0;
          shotImg.style.setProperty("--rx", rx.toFixed(2) + "deg");
          shotImg.style.setProperty("--ry", ry.toFixed(2) + "deg");
        });
      });
      fig.addEventListener("pointerleave", function () {
        shotImg.style.setProperty("--rx", "0deg"); shotImg.style.setProperty("--ry", "0deg");
      });
    }
    $all(".feat, .mini").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ── 10. Download hint: what to expect (and click) if Windows shows its warning ── */
  var toast = $("#toast"), toastTimer = 0, toastHide = 0;
  function hideToast() {
    clearTimeout(toastTimer);
    toast.classList.remove("show");
    clearTimeout(toastHide);
    toastHide = setTimeout(function () { toast.hidden = true; }, 420);
  }
  function showToast() {
    clearTimeout(toastTimer); clearTimeout(toastHide);
    toast.hidden = false;
    void toast.offsetWidth;                    // let the browser register the hidden->visible change so it animates
    toast.classList.add("show");
    toastTimer = setTimeout(hideToast, 15000);
  }
  if (toast) {
    $all('a[data-cfg="DOWNLOAD_URL"]').forEach(function (a) {
      a.addEventListener("click", function () { if (/\.exe(\?|$)/i.test(a.getAttribute("href") || "")) showToast(); });
    });
    $("#toastClose").addEventListener("click", hideToast);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && toast.classList.contains("show")) hideToast(); });
  }

  /* ── 11. The extension demo plays itself until the visitor touches it ── */
  var stage = $("#stage"), extGrid = $(".ext-grid");
  if (stage && picker && extGrid && !reduceMotion && "IntersectionObserver" in window) {
    var qRows = $all(".picker-row", stage), goBtn = $("#pickerGo"), steps = $all(".steps li", extGrid);
    var mp4 = $('input[name="f"][value="MP4"]', stage), mkv = $('input[name="f"][value="MKV"]', stage);
    var q1080 = $('input[name="q"]', stage);
    var STATES = ["s-btn", "s-picker", "s-app", "s-click", "s-run"];
    var timers = [], playing = false, stopped = false, inViewStage = false;
    function setState(list) { STATES.forEach(function (c) { stage.classList.toggle(c, list.indexOf(c) > -1); }); }
    function setStep(n) { steps.forEach(function (li, i) { li.classList.toggle("on", i === n); }); }
    function cleanPicker() {
      qRows.forEach(function (r) { r.classList.remove("hl"); });
      goBtn.classList.remove("press", "sent"); goBtn.textContent = "Download";
      q1080.checked = true;
      if (!mp4.checked) mp4.click();
    }
    var SCRIPT = [
      [0,     function () { cleanPicker(); setState(["s-btn"]); setStep(0); }],                       // the button appears on the video
      [1900,  function () { setState(["s-picker"]); setStep(1); }],                                   // click -> quality picker opens
      [2800,  function () { qRows[0].classList.add("hl"); }],                                         // looks over the sizes
      [3900,  function () { mkv.click(); }],                                                          // chooses MKV
      [4900,  function () { goBtn.classList.add("press"); }],
      [5100,  function () { goBtn.classList.remove("press"); goBtn.click(); }],                       // Download -> "Sent to Vantload"
      [6400,  function () { qRows[0].classList.remove("hl"); setState(["s-btn", "s-app"]); setStep(2); }],   // picker closes, app's confirm window pops up
      [8000,  function () { setState(["s-btn", "s-app", "s-click"]); }],                              // Start Download
      [8400,  function () { setState(["s-btn", "s-app", "s-run"]); }],                                // running
      [13000, function () { setState(["s-btn"]); }],                                                  // window goes away
      [14200, function () { loop(); }]
    ];
    function loop() {
      timers.forEach(clearTimeout); timers = [];
      SCRIPT.forEach(function (st) { timers.push(setTimeout(st[1], st[0])); });
    }
    function begin() {
      if (playing || stopped) return;
      playing = true;
      stage.classList.add("auto"); extGrid.classList.add("playing");
      loop();
    }
    function pause() {                       // scrolled away: stop the clock, start over on return
      if (!playing) return;
      playing = false; timers.forEach(clearTimeout); timers = [];
    }
    function stopForGood() {                 // the visitor touched it: it is theirs now
      stopped = true; playing = false; timers.forEach(clearTimeout); timers = [];
      stage.classList.remove("auto"); setState([]);
      extGrid.classList.remove("playing"); setStep(-1);
      qRows.forEach(function (r) { r.classList.remove("hl"); });
      goBtn.classList.remove("press");
    }
    stage.addEventListener("pointerdown", function (e) { if (e.isTrusted) stopForGood(); });
    stage.addEventListener("keydown", function (e) { if (e.isTrusted) stopForGood(); });
    new IntersectionObserver(function (es) {
      inViewStage = es[0].isIntersecting;
      if (inViewStage) begin(); else pause();
    }, { threshold: 0.4 }).observe(stage);
  }

  /* ── 12. Footer year ── */
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
