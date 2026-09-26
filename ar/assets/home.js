(function () {
  'use strict';

  /* Script propio de la home (ar/ y en/). El menú, el revelado, el
     formulario y el panel de código siguen en app.js; acá va lo que
     solo existe en esta página. Cada bloque comprueba lo suyo. */

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EN = document.documentElement.lang === 'en';
  function t(es, en) { return EN ? en : es; }
  function $(id) { return document.getElementById(id); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  var hasIO = 'IntersectionObserver' in window;

  /* Llama a fn la primera vez que el elemento entra en pantalla */
  function onVisible(el, fn, threshold) {
    if (!el) return;
    if (!hasIO) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); fn(); }
    }, { threshold: threshold || 0.3 });
    io.observe(el);
  }

  /* Observa si el elemento está en pantalla, para pausar lo que corre solo */
  function watch(el, cb) {
    if (!el) return;
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }, { threshold: 0.2 }).observe(el);
  }

  /* ---- Números que suben al entrar en pantalla ----
     El HTML ya trae la cifra final: sin JS o con movimiento reducido se
     lee igual. data-dec indica cuántos decimales mostrar. */
  function fmt(n, dec) {
    return n.toLocaleString(EN ? 'en-US' : 'es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-to'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    if (reduced || isNaN(end)) { el.textContent = fmt(end, dec); return; }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / 1600);
      var v = end * (1 - Math.pow(1 - p, 4));
      el.textContent = fmt(dec ? v : Math.round(v), dec);
      if (p < 1) window.requestAnimationFrame(step);
    }
    el.textContent = fmt(0, dec);
    window.requestAnimationFrame(step);
  }
  each(document.querySelectorAll('.num[data-to]'), function (el) {
    /* Los del panel arrancan cuando el panel se vuelve visible */
    if (el.closest('.app')) return;
    onVisible(el, function () { countUp(el); }, 0.6);
  });

  /* ---- Menú: marca la sección que se está leyendo ---- */
  var links = document.querySelectorAll('.nav-links a[href^="#"]');
  if (links.length && hasIO) {
    var byId = {};
    each(links, function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var ioNav = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = byId[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          each(links, function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        } else if (a.getAttribute('aria-current')) {
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = $(id); if (s) ioNav.observe(s); });
  }

  /* ---- Ecosistema: la lista y el diagrama se iluminan juntos ----
     Mientras nadie lo toca, recorre las siete capas solo. */
  var ecoList = $('ecoList');
  var ecoSvg = $('ecoSvg');
  if (ecoList && ecoSvg) {
    var items = ecoList.querySelectorAll('li');
    var nodes = ecoSvg.querySelectorAll('.eco-node');
    var current = -1, timer = null, hovering = false, ecoOn = false;

    var light = function (n) {
      current = n;
      each(items, function (li) { li.classList.toggle('on', +li.getAttribute('data-n') === n); });
      each(nodes, function (g) { g.classList.toggle('on', +g.getAttribute('data-n') === n); });
    };
    var tick = function () {
      window.clearTimeout(timer);
      if (reduced || hovering || !ecoOn) return;
      light((current + 1) % items.length);
      timer = window.setTimeout(tick, 2200);
    };
    each(items, function (li) {
      li.addEventListener('mouseenter', function () { hovering = true; light(+li.getAttribute('data-n')); });
      li.addEventListener('mouseleave', function () { hovering = false; timer = window.setTimeout(tick, 1600); });
    });
    watch(ecoSvg, function (vis) { ecoOn = vis; if (vis) tick(); else window.clearTimeout(timer); });
    if (reduced && ecoSvg.pauseAnimations) ecoSvg.pauseAnimations();
  }

  /* ---- Panel Zelira: pestañas ----
     Patrón de pestañas accesible: flechas para moverse, Inicio y Fin. */
  var tabs = document.querySelectorAll('.app-tabs [role="tab"]');
  var app = $('app');
  if (tabs.length && app) {
    var side = app.querySelectorAll('.app-side li');
    var select = function (tab, focus) {
      each(tabs, function (tb) {
        var on = tb === tab;
        tb.setAttribute('aria-selected', String(on));
        tb.tabIndex = on ? 0 : -1;
        $(tb.getAttribute('aria-controls')).hidden = !on;
      });
      var view = tab.getAttribute('aria-controls').replace('view-', '');
      var first = true;
      each(side, function (li) {
        var on = first && li.getAttribute('data-view') === view;
        if (on) first = false;
        li.classList.toggle('on', on);
      });
      if (focus) tab.focus();
    };
    each(tabs, function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, j = null;
        if (k === 'ArrowRight') j = (i + 1) % n;
        else if (k === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (k === 'Home') j = 0;
        else if (k === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });

    onVisible(app, function () {
      app.classList.add('live');
      each(app.querySelectorAll('.num[data-to]'), countUp);
    }, 0.25);
  }

  /* ---- Panel: gráfico de leads con cruz y tooltip ---- */
  var chart = $('leadsChart');
  if (chart) {
    var DATA = [38, 42, 40, 51, 48, 57, 55, 63, 61, 70, 74, 82];
    var W = 600, H = 200, MAX = 100, TOP = 12, BOT = 186;
    var X = function (i) { return i * (W / (DATA.length - 1)); };
    var Y = function (v) { return BOT - (v / MAX) * (BOT - TOP); };
    var d = DATA.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    var svg = chart.querySelector('svg');
    svg.querySelector('.line').setAttribute('d', d);
    svg.querySelector('.area').setAttribute('d', d + ' L' + W + ' ' + BOT + ' L0 ' + BOT + ' Z');

    var xh = svg.querySelector('.xhair');
    var dot = svg.querySelector('.dot');
    var tip = chart.querySelector('.tip');
    var show = function (i) {
      var x = X(i), y = Y(DATA[i]);
      xh.setAttribute('x1', x); xh.setAttribute('x2', x);
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      /* El SVG se estira en horizontal: el tooltip se ubica en píxeles reales */
      var r = svg.getBoundingClientRect();
      tip.style.left = Math.max(40, Math.min(r.width - 40, x / W * r.width)) + 'px';
      tip.style.top = (y / H * r.height) + 'px';
      tip.querySelector('b').textContent = DATA[i] + ' leads';
      tip.querySelector('span').textContent = t('Semana ', 'Week ') + (i + 1);
      tip.hidden = false;
      chart.classList.add('hover');
    };
    var hide = function () { tip.hidden = true; chart.classList.remove('hover'); };
    chart.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect();
      var i = Math.round((e.clientX - r.left) / r.width * (DATA.length - 1));
      show(Math.max(0, Math.min(DATA.length - 1, i)));
    });
    chart.addEventListener('pointerleave', hide);
  }

  /* ---- Panel: actividad en vivo ----
     Cada tantos segundos entra un evento nuevo arriba y sale el último. */
  var feed = $('feed');
  if (feed && !reduced) {
    var EVENTS = [
      ['ai', t('La IA respondió una consulta de precios por WhatsApp', 'AI answered a pricing question on WhatsApp')],
      ['', t('Nueva oportunidad creada desde Google Ads', 'New opportunity created from Google Ads')],
      ['ai', t('La IA calificó un lead de LinkedIn · score 78', 'AI qualified a LinkedIn lead · score 78')],
      ['', t('Documento firmado y archivado', 'Document signed and filed')],
      ['ai', t('Resumen de reunión cargado en el CRM', 'Meeting summary logged in the CRM')],
      ['', t('Recordatorio de pago enviado a Cliente Demo 022', 'Payment reminder sent to Demo Client 022')]
    ];
    var ev = 0, feedOn = false;
    watch(feed, function (vis) { feedOn = vis; });
    window.setInterval(function () {
      if (!feedOn || document.hidden || $('view-dash').hidden) return;
      var e = EVENTS[ev++ % EVENTS.length];
      var li = document.createElement('li');
      li.className = 'new';
      li.innerHTML = '<i' + (e[0] ? ' class="ai"' : '') + '></i><p></p><time>' + t('ahora', 'now') + '</time>';
      li.querySelector('p').textContent = e[1];
      var times = feed.querySelectorAll('time');
      each(times, function (tm, i) { tm.textContent = [t('1 min', '1 min'), t('3 min', '3 min'), t('10 min', '10 min'), '1 h'][i] || tm.textContent; });
      feed.insertBefore(li, feed.firstChild);
      if (feed.children.length > 4) feed.removeChild(feed.lastElementChild);
    }, 4200);
  }

  /* ---- IA: conversación de ejemplo ----
     Entra un mensaje por vez, con los tres puntos de "escribiendo"
     antes de cada uno; al final aparece la ficha del lead en el CRM. */
  var demo = $('aiDemo');
  if (demo && !reduced) {
    var chat = demo.querySelector('.ai-chat');
    var msgs = demo.querySelectorAll('.msg');
    var card = demo.querySelector('.ai-card');
    var replay = $('aiReplay');
    var timers = [];
    var later = function (fn, ms) { timers.push(window.setTimeout(fn, ms)); };

    var play = function () {
      timers.forEach(window.clearTimeout); timers = [];
      demo.classList.remove('done');
      demo.classList.add('play');
      each(msgs, function (m) { m.classList.remove('show'); m.hidden = true; });
      card.classList.remove('show');
      var old = chat.querySelector('.typing'); if (old) old.remove();

      var at = 300;
      each(msgs, function (m) {
        var out = m.classList.contains('out');
        var dots = document.createElement('p');
        dots.className = 'typing' + (out ? ' out' : '');
        dots.innerHTML = '<i></i><i></i><i></i>';
        later(function () { chat.appendChild(dots); }, at);
        at += out ? 1100 : 900;
        later(function () {
          dots.remove();
          m.hidden = false;
          chat.appendChild(m);
          window.requestAnimationFrame(function () { m.classList.add('show'); });
        }, at);
        at += 700;
      });
      later(function () { card.classList.add('show'); }, at + 300);
      later(function () { demo.classList.add('done'); }, at + 900);
    };
    demo.classList.add('play');
    each(msgs, function (m) { m.hidden = true; });
    onVisible(demo, play, 0.4);
    if (replay) replay.addEventListener('click', play);
  }

  /* ---- Comenzar: selector de objetivo ----
     Elige el tema del formulario y ajusta el mensaje de al lado. Los
     enlaces con data-goal (en los capítulos) llegan con el tema puesto. */
  var goals = $('goals');
  var interes = $('interes');
  var goalMsg = $('goalMsg');
  var mensaje = $('mensaje');
  if (goals && interes) {
    var COPY = {
      crear: [t('Contanos qué tipo de empresa querés armar, cuántos socios son y a qué se va a dedicar. Te proponemos la estructura y los pasos.', 'Tell us what kind of company you want to set up, how many partners and what it will do. We will propose the structure and the steps.'),
              t('Ej.: somos dos socios, queremos una SRL de servicios y empezar a facturar en 60 días.', 'E.g. two partners, a services company, invoicing within 60 days.')],
      crecer: [t('Contanos cómo conseguís clientes hoy y dónde se pierden. Te proponemos el canal, la medición y el seguimiento.', 'Tell us how you win customers today and where you lose them. We will propose the channel, the tracking and the follow-up.'),
               t('Ej.: vendemos por recomendación y queremos un canal digital con seguimiento en CRM.', 'E.g. we sell by referral and want a digital channel with CRM follow-up.')],
      tecnologia: [t('Contanos qué sistema necesitás, con qué tiene que integrarse y quién lo va a usar. Te respondemos con alcance y enfoque.', 'Tell us what system you need, what it must integrate with and who will use it. We will reply with scope and approach.'),
                   t('Ej.: una plataforma para clientes integrada con nuestro ERP.', 'E.g. a customer platform integrated with our ERP.')],
      automatizar: [t('Contanos qué tareas se repiten todos los días y en qué sistemas viven. Te mostramos qué se puede automatizar primero.', 'Tell us which tasks repeat every day and which systems they live in. We will show you what to automate first.'),
                    t('Ej.: cargamos pedidos de WhatsApp a mano en una planilla.', 'E.g. we copy WhatsApp orders into a spreadsheet by hand.')]
    };
    var buttons = goals.querySelectorAll('[role="radio"]');
    var pick = function (goal, fromSelect) {
      each(buttons, function (b) {
        var on = b.getAttribute('data-goal') === goal;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on || (!goal && b === buttons[0]) ? 0 : -1;
      });
      if (!COPY[goal]) return;
      if (!fromSelect) {
        var opt = interes.querySelector('option[data-param="' + goal + '"]');
        if (opt) opt.selected = true;
      }
      if (goalMsg) goalMsg.textContent = COPY[goal][0];
      if (mensaje) mensaje.placeholder = COPY[goal][1];
    };
    each(buttons, function (b, i) {
      b.addEventListener('click', function () { pick(b.getAttribute('data-goal')); });
      b.addEventListener('keydown', function (e) {
        var n = buttons.length, j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
        if (j !== null) { e.preventDefault(); buttons[j].click(); buttons[j].focus(); }
      });
    });
    interes.addEventListener('change', function () {
      var o = interes.options[interes.selectedIndex];
      pick(o.getAttribute('data-param') || '', true);
    });
    each(document.querySelectorAll('a[data-goal]'), function (a) {
      a.addEventListener('click', function () { pick(a.getAttribute('data-goal')); });
    });
    /* ?interes=… (lo resuelve app.js en el select): el selector lo refleja */
    var o0 = interes.options[interes.selectedIndex];
    pick(o0 && o0.getAttribute('data-param') || '', true);
  }

  /* ---- Etapas: el riel se llena con el scroll ---- */
  var stages = $('stages');
  if (stages) {
    var lis = stages.querySelectorAll('li');
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = stages.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = reduced ? 1 : Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (r.height + vh * 0.2)));
      stages.style.setProperty('--prog', p.toFixed(3));
      each(lis, function (li, i) { li.classList.toggle('lit', p >= i / lis.length + 0.02); });
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
