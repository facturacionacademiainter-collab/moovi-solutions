(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Este script lo comparten todas las páginas del sitio, y no todas
     tienen los mismos elementos. Cada bloque comprueba lo suyo antes
     de actuar: lo que no está, simplemente no se inicializa. */
  function $(id) { return document.getElementById(id); }

  /* ---- Capa futurista: aurora de fondo y barra de progreso ----
     Se insertan desde acá para no repetir el marcado en cada página. */
  var aurora = document.createElement('div');
  aurora.className = 'aurora';
  aurora.setAttribute('aria-hidden', 'true');
  aurora.innerHTML = '<i></i><i></i><i></i><i></i>';
  document.body.insertBefore(aurora, document.body.firstChild);

  var barra = document.createElement('div');
  barra.className = 'scroll-progress';
  barra.setAttribute('aria-hidden', 'true');
  document.body.appendChild(barra);

  var progreso = function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
  };
  progreso();
  window.addEventListener('scroll', progreso, { passive: true });
  window.addEventListener('resize', progreso);

  /* ---- Tarjetas: luz que sigue al cursor ---- */
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest ? e.target.closest('.pillar, .case, .rel-card, .folio-card, .offer') : null;
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

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

  /* ---- Tarjetas: posición dentro de su rejilla ----
     Cada tarjeta recibe su lugar como variable CSS: --i escalona la
     entrada y desfasa la flotación del ícono, y --col escalona por
     columna las del portafolio, que se revelan de a una. */
  var rejillas = document.querySelectorAll('.pillars, .offers, .cases, .rel-grid, .folio, .ind-grid, .ind-pills, .mdl-grid, .mdl-list');
  Array.prototype.forEach.call(rejillas, function (grid) {
    Array.prototype.forEach.call(grid.children, function (card, i) {
      card.style.setProperty('--i', i);
      card.style.setProperty('--col', i % 3);
    });
  });

  /* ---- Industrias: contadores que suben al entrar en pantalla ----
     El HTML ya trae el número final, así que sin JavaScript (o con
     movimiento reducido) se lee igual; acá solo se anima desde cero. */
  var contadores = document.querySelectorAll('[data-count]');
  if (contadores.length && !reduced && 'IntersectionObserver' in window) {
    var contar = function (el) {
      var fin = parseInt(el.getAttribute('data-count'), 10);
      var inicio = null;
      var paso = function (t) {
        if (inicio === null) inicio = t;
        var p = Math.min(1, (t - inicio) / 1400);
        el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3)));
        if (p < 1) window.requestAnimationFrame(paso);
      };
      window.requestAnimationFrame(paso);
    };
    var ioCuenta = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          contar(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(contadores, function (el) {
      el.textContent = '0';
      ioCuenta.observe(el);
    });
  }

  /* ---- Revelado en scroll ----
     El umbral de 0.12 pide que se vea el 12% del elemento. Un bloque más
     alto que la ventana nunca llega a mostrar esa proporción de sí mismo:
     si se lo observa con ese umbral no aparece nunca y queda invisible.
     Por eso cada elemento elige su umbral según lo que realmente puede
     llegar a mostrar. */
  var items = document.querySelectorAll('.reveal');

  function marcar(el) { el.classList.add('in'); }

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, marcar);
  } else {
    var opciones = { threshold: 0.12, rootMargin: '0px 0px -8% 0px' };

    var alVer = function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          marcar(entry.target);
          obs.unobserve(entry.target);
        }
      });
    };

    var ioNormal = new IntersectionObserver(alVer, opciones);
    /* Para los bloques altos alcanza con que asome: umbral 0 */
    var ioAlto = new IntersectionObserver(alVer, { threshold: 0, rootMargin: opciones.rootMargin });

    Array.prototype.forEach.call(items, function (el) {
      var visibleMax = window.innerHeight * 0.92;   /* lo que deja ver el rootMargin */
      var alto = el.offsetHeight;
      var alcanza = alto > 0 && (visibleMax / alto) >= 0.16;  /* margen sobre el 0.12 */
      (alcanza ? ioNormal : ioAlto).observe(el);
    });
  }

  /* ---- Portafolio: ficha del proyecto ----
     Tocar una tarjeta abre su ficha completa. El contenido vive en el
     HTML dentro de #projData, así que está en la página aunque nadie
     toque nada; el diálogo solo lo clona y lo muestra.
     La ficha abierta queda en la dirección (#p-kognia), de modo que se
     puede compartir el enlace y el botón atrás la cierra. */
  var dlg = $('projDialog');
  var dlgBody = $('projBody');
  var dlgClose = $('projClose');
  var fichas = $('projData');

  if (dlg && dlgBody && fichas) {
    var abierta = null;
    var saltarHistorial = false;

    var pintar = function (slug) {
      var ficha = fichas.querySelector('[data-proj="' + slug + '"]');
      if (!ficha) return false;

      dlgBody.innerHTML = '';

      /* El logo de la tarjeta encabeza la ficha: se clona en vez de
         repetirlo en el HTML, así existe una sola copia de cada marca. */
      var tarjeta = document.querySelector('.folio-card[data-brand="' + slug + '"]');
      var viz = tarjeta && tarjeta.querySelector('.folio-viz');
      if (viz) dlgBody.appendChild(viz.cloneNode(true));

      var copia = ficha.cloneNode(true);
      copia.removeAttribute('hidden');
      dlgBody.appendChild(copia);

      dlg.setAttribute('data-brand', slug);
      return true;
    };

    var limpiar = function () {
      abierta = null;
      document.documentElement.style.overflow = '';
      if (!saltarHistorial && location.hash.indexOf('#p-') === 0) {
        history.pushState(null, '', location.pathname);
      }
      saltarHistorial = false;
    };

    var abrir = function (slug, conHistorial) {
      if (!pintar(slug)) return;
      abierta = slug;
      if (typeof dlg.showModal === 'function') {
        if (!dlg.open) dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
      dlgBody.scrollTop = 0;
      document.documentElement.style.overflow = 'hidden';
      if (conHistorial !== false) history.pushState(null, '', '#p-' + slug);
    };

    var cerrar = function (conHistorial) {
      if (!abierta) return;
      saltarHistorial = (conHistorial === false);
      if (dlg.open && typeof dlg.close === 'function') {
        dlg.close();          /* dispara el evento close, que limpia */
      } else {
        dlg.removeAttribute('open');
        limpiar();
      }
    };

    /* Esc y close() nativo pasan por acá */
    dlg.addEventListener('close', limpiar);

    /* El botón "Ver proyecto" y cualquier punto de la tarjeta abren la ficha */
    document.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var boton = e.target.closest('.folio-open');
      var tarjeta = boton ? null : e.target.closest('.folio-card');
      var slug = boton ? boton.getAttribute('data-proj') : (tarjeta && tarjeta.getAttribute('data-brand'));
      if (slug) {
        e.preventDefault();
        abrir(slug);
      }
    });

    if (dlgClose) dlgClose.addEventListener('click', function () { cerrar(); });

    /* Clic sobre el fondo oscuro */
    dlg.addEventListener('click', function (e) { if (e.target === dlg) cerrar(); });

    /* Enlace directo al cargar, y botón atrás del navegador */
    var desdeDireccion = function () {
      var h = location.hash;
      if (h.indexOf('#p-') === 0) abrir(h.slice(3), false);
      else if (abierta) cerrar(false);
    };
    window.addEventListener('popstate', desdeDireccion);
    desdeDireccion();
  }

  /* ---- Portafolio: filtro por familia ----
     Las tarjetas traen su familia en data-fam y se ocultan con el
     atributo hidden, así el filtro no depende de ninguna clase de estilo.
     Solo existe en portafolio.html; en el resto de las páginas no hace nada. */
  var folioBar = $('folioBar');
  var folio = $('folio');
  if (folioBar && folio) {
    var chips = folioBar.querySelectorAll('.chip');
    var tarjetas = folio.querySelectorAll('.folio-card');
    var cuenta = $('folioCount');
    var vacio = $('folioEmpty');

    var filtrar = function (fam) {
      var visibles = 0;
      Array.prototype.forEach.call(tarjetas, function (card) {
        var ok = fam === 'all' || card.getAttribute('data-fam') === fam;
        card.hidden = !ok;
        if (ok) visibles++;
      });
      Array.prototype.forEach.call(chips, function (chip) {
        chip.setAttribute('aria-pressed', String(chip.getAttribute('data-fam') === fam));
      });
      /* Con "Todos" se muestra la cifra redonda de la marca, no el conteo exacto */
      if (cuenta) {
        cuenta.textContent = fam === 'all' ? 'Más de 20 proyectos'
          : (visibles === 1 ? '1 proyecto' : visibles + ' proyectos');
      }
      if (vacio) vacio.hidden = visibles > 0;
    };

    folioBar.addEventListener('click', function (e) {
      var chip = e.target.closest ? e.target.closest('.chip') : null;
      if (chip && folioBar.contains(chip)) filtrar(chip.getAttribute('data-fam'));
    });
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

  /* La mitad de los nodos va en el turquesa de la marca; el resto se
     reparte entre cian, azul, violeta y magenta. Cada línea toma el
     color del nodo del que sale. */
  var PALETA = ['8,147,181', '27,111,224', '124,92,230', '212,63,141'];
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
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.5) * 1.1,
        r: Math.random() * 1.4 + 0.7,
        rgb: Math.random() < 0.5 ? '14,159,142' : PALETA[Math.floor(Math.random() * PALETA.length)]
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
          ctx.strokeStyle = 'rgba(' + nodes[a].rgb + ',' + ((1 - d2 / 24000) * 0.42).toFixed(3) + ')';
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
      ctx.fillStyle = 'rgba(' + n.rgb + ',.8)';
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
