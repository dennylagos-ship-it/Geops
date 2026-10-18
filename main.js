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
        out.textContent = "Abriendo WhatsApp con tu solicitud…";
        out.classList.add("show");
        window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(t), "_blank", "noopener");
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
    var els = document.querySelectorAll(".sec-head,.area,.step,.split > div,form.card,.feat,.clock,.diff");
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

  function boot() {
    safe(initMenu, "menu");
    safe(initServiceLinks, "serviceLinks");
    safe(initForm, "form");
    safe(initReveal, "reveal");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
