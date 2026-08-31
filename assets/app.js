(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Este script lo comparten todas las páginas del sitio, y no todas
     tienen los mismos elementos. Cada bloque comprueba lo suyo antes
     de actuar: lo que no está, simplemente no se inicializa. */
  function $(id) { return document.getElementById(id); }

  /* ---- Año en curso ---- */
  var year = $('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Barra superior ---- */
  var topbar = $('topbar');
  if (topbar) {
    var onScroll = function () { topbar.classList.toggle('stuck', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Menú móvil ---- */
  var toggle = $('navToggle');
  var nav = $('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
      nav.setAttribute('data-open', String(!open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
        nav.setAttribute('data-open', 'false');
      }
    });
  }

  /* ---- Ticker: se duplica para que el bucle sea continuo ---- */
  var track = $('tickerTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ---- Revelado en scroll ---- */
  var items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---- Formulario: envía la consulta a contacto@moovisolutions.com ----
     El envío pasa por FormSubmit, que reenvía el contenido por correo.
     Es necesario porque GitHub Pages solo sirve archivos: no puede
     procesar un POST ni mandar mails por sí mismo. */
  var DESTINO = 'contacto@moovisolutions.com';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + DESTINO;

  var form = $('contactForm');
  var sent = $('formSent');
  var note = $('formNote');
  var boton = $('formSubmit');

  function aviso(texto, esError) {
    sent.hidden = false;
    sent.textContent = texto;
    if (esError) sent.setAttribute('data-state', 'error');
    else sent.removeAttribute('data-state');
  }

  if (form && sent && note && boton) form.addEventListener('submit', function (e) {
    e.preventDefault();

    var data = new FormData(form);
    var nombre = String(data.get('nombre') || '').trim();
    var email = String(data.get('email') || '').trim();
    var mensaje = String(data.get('mensaje') || '').trim();
    var empresa = String(data.get('empresa') || '').trim();
    var interes = String(data.get('interes') || '');

    if (String(data.get('_honey') || '')) return;   /* bot */

    if (!nombre || !email || !mensaje) {
      aviso('Faltan datos: completá nombre, email y el detalle de la consulta.', true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      aviso('Revisá el email: no parece una dirección válida.', true);
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Enviando…';
    aviso('Enviando tu consulta…', false);

    var cuerpo = {
      Nombre: nombre,
      Empresa: empresa || '-',
      Email: email,
      'Tema de interés': interes,
      Consulta: mensaje,
      _subject: 'Consulta desde el sitio - ' + interes,
      _template: 'table',
      _captcha: 'false'
    };

    /* Distingue "no llegué al servidor" de "el servidor me rechazó":
       son problemas distintos y el aviso tiene que decir cuál es */
    var sinRespuesta = true;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(cuerpo)
    })
      .then(function (r) {
        sinRespuesta = false;
        return r.json().catch(function () { return {}; });
      })
      .then(function (r) {
        if (r && (r.success === 'true' || r.success === true)) {
          form.reset();
          note.hidden = true;
          aviso('Listo, ' + nombre + '. Recibimos tu consulta y te respondemos a ' + email + '.', false);
          return;
        }
        throw new Error(r && r.message ? r.message : 'respuesta inesperada del servidor');
      })
      .catch(function (err) {
        /* El motivo técnico va a la consola, no a la pantalla del visitante */
        if (window.console && console.error) console.error('[moovi] envío fallido:', err);
        aviso(sinRespuesta
          ? 'No pudimos conectar con el servidor de envíos. Revisá tu conexión, o escribinos a ' + DESTINO + '.'
          : 'No pudimos procesar el envío. Escribinos a ' + DESTINO + ' y te respondemos igual.',
        true);
      })
      .then(function () {
        boton.disabled = false;
        boton.textContent = 'Enviar consulta';
      });
  });

  /* ---- Panel de código: software escribiéndose ---- */
  var SNIPPETS = [
    {
      file: 'ingesta.py',
      lang: 'Python · FastAPI',
      task: 'Ingesta de telemetría',
      lines: [
        [['@app', 'tk-kw'], ['.post(', 'tk-pun'], ['"/telemetria"', 'tk-str'], [')', 'tk-pun']],
        [['async def ', 'tk-kw'], ['ingesta', 'tk-fn'], ['(lote: ', 'tk-pun'], ['list', 'tk-var'], ['[Lectura]):', 'tk-pun']],
        [['    await ', 'tk-kw'], ['bus.publicar', 'tk-fn'], ['(', 'tk-pun'], ['"sensores"', 'tk-str'], [', lote)', 'tk-pun']],
        [['    alertas', 'tk-var'], [' = ', 'tk-pun'], ['detectar_anomalias', 'tk-fn'], ['(lote)', 'tk-pun']],
        [['    if ', 'tk-kw'], ['alertas', 'tk-var'], [':', 'tk-pun']],
        [['        await ', 'tk-kw'], ['notificar', 'tk-fn'], ['(alertas)', 'tk-pun']],
        [['    return ', 'tk-kw'], ['{', 'tk-pun'], ['"ok"', 'tk-str'], [': ', 'tk-pun'], ['True', 'tk-num'], [', ', 'tk-pun'], ['"n"', 'tk-str'], [': ', 'tk-pun'], ['len', 'tk-fn'], ['(lote)}', 'tk-pun']]
      ]
    },
    {
      file: 'Carrito.tsx',
      lang: 'TypeScript · React',
      task: 'Checkout de ecommerce',
      lines: [
        [['export function ', 'tk-kw'], ['Carrito', 'tk-fn'], ['({ items }: ', 'tk-pun'], ['Props', 'tk-tag'], [') {', 'tk-pun']],
        [['  const ', 'tk-kw'], ['total', 'tk-var'], [' = items.', 'tk-pun'], ['reduce', 'tk-fn'], ['(', 'tk-pun']],
        [['    (acc, i) ', 'tk-var'], ['=> ', 'tk-kw'], ['acc + i.precio * i.cantidad,', 'tk-var']],
        [['    0', 'tk-num']],
        [['  );', 'tk-pun']],
        [['  return ', 'tk-kw'], ['<Resumen', 'tk-tag'], [' total', 'tk-var'], ['={total} ', 'tk-pun'], ['/>', 'tk-tag'], [';', 'tk-pun']],
        [['}', 'tk-pun']]
      ]
    },
    {
      file: 'asistente.py',
      lang: 'Python · LLM',
      task: 'Asistente sobre datos propios',
      lines: [
        [['# recupera contexto de tus documentos', 'tk-com']],
        [['docs', 'tk-var'], [' = indice.', 'tk-pun'], ['buscar', 'tk-fn'], ['(pregunta, k=', 'tk-pun'], ['6', 'tk-num'], [')', 'tk-pun']],
        [['contexto', 'tk-var'], [' = ', 'tk-pun'], ['unir', 'tk-fn'], ['(d.texto ', 'tk-pun'], ['for', 'tk-kw'], [' d ', 'tk-pun'], ['in', 'tk-kw'], [' docs)', 'tk-pun']],
        [['respuesta', 'tk-var'], [' = modelo.', 'tk-pun'], ['responder', 'tk-fn'], ['(', 'tk-pun']],
        [['    pregunta, contexto=contexto', 'tk-var']],
        [[')', 'tk-pun']],
        [['registrar', 'tk-fn'], ['(pregunta, respuesta, docs)', 'tk-pun']]
      ]
    }
  ];

  (function codePanel() {
    var panel = document.getElementById('codepanel');
    var elLines = document.getElementById('codeLines');
    if (!panel || !elLines) return;

    var elFile = document.getElementById('codeFile');
    var elLang = document.getElementById('codeLang');
    var elTask = document.getElementById('codeTask');
    var elState = document.getElementById('codeState');
    var elStatus = document.getElementById('codeStatus');

    var caret = document.createElement('span');
    caret.className = 'caret';

    var index = 0;
    var timer = null;
    var onScreen = true;

    if ('IntersectionObserver' in window) {
      onScreen = false;
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
      }, { threshold: 0.15 }).observe(panel);
    }

    function newLine() {
      var li = document.createElement('li');
      var code = document.createElement('code');
      li.appendChild(code);
      elLines.appendChild(li);
      return code;
    }

    function header(snip) {
      elFile.textContent = snip.file;
      elLang.textContent = snip.lang;
      elTask.textContent = snip.task;
    }

    function renderStatic(snip) {
      elLines.innerHTML = '';
      snip.lines.forEach(function (line) {
        var code = newLine();
        line.forEach(function (tk) {
          var s = document.createElement('span');
          s.className = tk[1];
          s.textContent = tk[0];
          code.appendChild(s);
        });
      });
    }

    function type(snip, onDone) {
      elLines.innerHTML = '';
      elStatus.removeAttribute('data-state');
      elState.textContent = 'compilando';

      var li = 0, ti = 0, ci = 0;
      var code = null, span = null, cls = null;

      function step() {
        if (!onScreen || document.hidden) { timer = window.setTimeout(step, 350); return; }

        if (code === null) {
          code = newLine();
          code.appendChild(caret);
          span = null;
          cls = null;
        }

        var line = snip.lines[li];
        var tok = line[ti];

        if (cls !== tok[1]) {
          span = document.createElement('span');
          span.className = tok[1];
          code.insertBefore(span, caret);
          cls = tok[1];
        }
        span.textContent += tok[0].charAt(ci);
        ci++;

        var delay = 20 + Math.random() * 26;

        if (ci >= tok[0].length) { ci = 0; ti++; }
        if (ti >= line.length) { ti = 0; li++; code = null; delay = 160; }

        if (li >= snip.lines.length) {
          elStatus.setAttribute('data-state', 'ok');
          elState.textContent = 'listo';
          timer = window.setTimeout(onDone, 2600);
          return;
        }
        timer = window.setTimeout(step, delay);
      }

      step();
    }

    function cycle() {
      var snip = SNIPPETS[index];
      header(snip);
      type(snip, function () {
        index = (index + 1) % SNIPPETS.length;
        cycle();
      });
    }

    if (reduced) {
      header(SNIPPETS[0]);
      renderStatic(SNIPPETS[0]);
      elStatus.setAttribute('data-state', 'ok');
      elState.textContent = 'listo';
    } else {
      cycle();
    }
  })();

  /* ---- Héroe: red de nodos en movimiento ---- */
  var canvas = $('net');
  if (!canvas) return;
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var nodes = [];
  var w = 0, h = 0, dpr = 1, raf = null;

  function size() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    var count = Math.round(Math.min(78, Math.max(24, (w * h) / 17000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.7,
        hot: Math.random() < 0.18
      });
    }
  }

  function draw(animate) {
    ctx.clearRect(0, 0, w, h);

    var i, a, b, n;
    if (animate) {
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }
    }

    for (a = 0; a < nodes.length; a++) {
      for (b = a + 1; b < nodes.length; b++) {
        var dx = nodes[a].x - nodes[b].x;
        var dy = nodes[a].y - nodes[b].y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 24000) {
          ctx.strokeStyle = 'rgba(13,155,135,' + ((1 - d2 / 24000) * 0.3).toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(nodes[b].x, nodes[b].y);
          ctx.stroke();
        }
      }
    }

    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      ctx.fillStyle = n.hot ? 'rgba(90,69,240,.7)' : 'rgba(13,155,135,.55)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (animate) raf = window.requestAnimationFrame(function () { draw(true); });
  }

  function start() {
    if (raf) window.cancelAnimationFrame(raf);
    size();
    draw(!reduced);
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(start, 180);
  });

  start();
})();
