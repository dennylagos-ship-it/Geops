(function () {
  "use strict";

  var BRAND = window.__BRAND__ || {};

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn("[geops] " + name + " falló:", e); }
  }

  /* Menú móvil */
  function initMenu() {
    var header = document.querySelector("header.top");
    var btn = document.querySelector(".menu-btn");
    if (!header || !btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    function set(open) {
      header.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    }
    btn.addEventListener("click", function () { set(!header.classList.contains("menu-open")); });
    header.querySelectorAll("nav.links a").forEach(function (a) {
      a.addEventListener("click", function () { set(false); });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  /* Botones que preseleccionan un servicio en el formulario */
  function initServiceLinks() {
    document.querySelectorAll("[data-serv]").forEach(function (a) {
      if (a.dataset.bound) return;
      a.dataset.bound = "1";
      a.addEventListener("click", function () {
        var s = document.getElementById("f-serv");
        if (s) s.value = a.getAttribute("data-serv");
      });
    });
  }

  /* Formulario: arma el mensaje y lo abre en WhatsApp (o lo copia si aún no hay número) */
  function initForm() {
    var f = document.getElementById("cform");
    var out = document.getElementById("cresult");
    if (!f || !out || f.dataset.bound) return;
    f.dataset.bound = "1";
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.nombre.value.trim()) {
        out.textContent = "Escribe tu nombre para preparar la solicitud.";
        out.classList.add("show");
        f.nombre.focus();
        return;
      }
      var t = "Hola Geops SST, soy " + f.nombre.value.trim() +
        (f.empresa.value.trim() ? " de " + f.empresa.value.trim() : "") + "." +
        "\nServicio: " + f.serv.value +
        "\nTrabajadores: " + f.trab.value +
        (f.tel.value.trim() ? "\nTeléfono: " + f.tel.value.trim() : "") +
        (f.msg.value.trim() ? "\n\n" + f.msg.value.trim() : "");
      var num = String(BRAND.whatsapp || "").replace(/\D/g, "");
      if (num.length >= 10) {
        var url = "https://wa.me/" + num + "?text=" + encodeURIComponent(t);
        out.textContent = "Abriendo WhatsApp con tu solicitud. Si no se abrió, ";
        var a = document.createElement("a");
        a.href = url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = "toca aquí para enviarla";
        out.appendChild(a);
        out.appendChild(document.createTextNode("."));
        out.classList.add("show");
        window.open(url, "_blank", "noopener");
        return;
      }
      out.textContent = "Solicitud lista. Cópiala y envíala por WhatsApp:\n\n" + t;
      out.classList.add("show");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(t).then(function () {
          out.textContent = "Solicitud copiada. Pégala en WhatsApp:\n\n" + t;
        }).catch(function () {});
      }
    });
  }

  /* Aparición suave al hacer scroll (solo lo que está debajo de la primera pantalla) */
  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    var els = document.querySelectorAll(".sec-head,.area,.step,.split > div,form.card,.clock,.diff,.shots");
    var vh = window.innerHeight || 800;
    function done(t) {
      t.classList.add("in");
      setTimeout(function () { t.classList.remove("rv", "in"); t.style.transitionDelay = ""; }, 1200);
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); done(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) {
      if (el.dataset.rvBound || el.getBoundingClientRect().top < vh) return;
      el.dataset.rvBound = "1";
      el.classList.add("rv");
      var i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = (Math.min(i % 4, 3) * 0.09) + "s";
      io.observe(el);
    });
    /* Red de seguridad: a los 6 s, todo lo pendiente se muestra */
    setTimeout(function () {
      document.querySelectorAll(".rv").forEach(function (el) { io.unobserve(el); done(el); });
    }, 6000);
  }


  /* Carrusel de capturas de la app */
  function initShots() {
    var root = document.querySelector(".shots");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "1";
    var track = root.querySelector(".shots-track");
    var slides = root.querySelectorAll(".slide");
    var dots = root.querySelectorAll(".dot-btn");
    var n = slides.length, cur = 0, timer = null, paused = false;
    function go(i) {
      cur = (i + n) % n;
      track.scrollTo({ left: cur * track.clientWidth, behavior: "smooth" });
      mark();
    }
    function mark() {
      dots.forEach(function (d, k) { d.setAttribute("aria-current", k === cur ? "true" : "false"); });
    }
    root.querySelector(".prev").addEventListener("click", function () { stop(); go(cur - 1); });
    root.querySelector(".next").addEventListener("click", function () { stop(); go(cur + 1); });
    dots.forEach(function (d) { d.addEventListener("click", function () { stop(); go(+d.dataset.i); }); });
    var t;
    track.addEventListener("scroll", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i !== cur) { cur = i; mark(); }
      }, 80);
    }, { passive: true });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(cur + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(cur - 1); }
    });
    function start() { if (!timer) timer = setInterval(function () { if (!paused && !document.hidden) go(cur + 1); }, 5000); }
    function stop() { clearInterval(timer); timer = null; }
    root.addEventListener("mouseenter", function () { paused = true; });
    root.addEventListener("mouseleave", function () { paused = false; });
    root.addEventListener("touchstart", function () { stop(); }, { passive: true });
    root.addEventListener("focusin", function () { paused = true; });
    root.addEventListener("focusout", function () { paused = false; });
    window.addEventListener("resize", function () { track.scrollLeft = cur * track.clientWidth; });
    mark();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { threshold: 0.05 }).observe(root);
    } else start();
  }


  /* Fondo de la portada: rotación de fotos y profundidad al hacer scroll */
  function initHeroBg() {
    var bg = document.querySelector(".hero-bg");
    if (!bg || bg.dataset.bound) return;
    bg.dataset.bound = "1";
    var imgs = bg.querySelectorAll(".hb-img"), i = 0;
    if (imgs.length > 1) {
      setInterval(function () {
        if (document.hidden) return;
        imgs[i].classList.remove("is-on");
        i = (i + 1) % imgs.length;
        void imgs[i].offsetWidth;
        imgs[i].classList.add("is-on");
      }, 7000);
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        bg.style.setProperty("--py", (y * 0.3).toFixed(1) + "px");
        ticking = false;
      });
    }, { passive: true });
  }

  function boot() {
    safe(initMenu, "menu");
    safe(initServiceLinks, "serviceLinks");
    safe(initForm, "form");
    safe(initReveal, "reveal");
    safe(initShots, "shots");
    safe(initHeroBg, "heroBg");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
