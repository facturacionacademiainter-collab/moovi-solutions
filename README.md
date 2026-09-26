# Zelira

Sitio web corporativo de **Zelira** — infraestructura para crear, operar y hacer crecer empresas: puesta en marcha con profesionales especializados, software, inteligencia artificial y adquisición de clientes.

Es un sitio estático de un solo archivo: no necesita build, ni dependencias, ni servidor. Se abre `index.html` en cualquier navegador.

## Contenido

La home (`ar/index.html` y su gemela `en/index.html`) sigue la narrativa CREAR → OPERAR → CRECER:

| Sección | Ancla | Qué muestra |
| --- | --- | --- |
| Héroe | — | Titular en tres renglones, pila isométrica de las cinco capas y cifras ya publicadas en el sitio |
| Crear · Operar · Crecer | `#servicios`, `#crear`, `#operar`, `#crecer` | Los tres capítulos de servicio. Crear aclara que los actos con matrícula los hacen profesionales habilitados |
| Una empresa. Una infraestructura. | `#ecosistema` | Diagrama de las siete capas alrededor de Zelira |
| Panel Zelira | `#panel` | Maqueta de producto con pestañas y **datos ficticios** (rotulados como tales) |
| IA | `#ia` | La IA como capa transversal, con una conversación de ejemplo |
| Software empresarial | `#tecnologia` | Capacidades, panel de código animado, formas de construir y proceso |
| Casos | `#casos` | Flux Collect destacado (con las cifras de su ficha) y los 21 proyectos del portafolio por familia |
| Modelo Zelira | `#etapas` | Las cinco etapas: crear, operar, automatizar, crecer, escalar |
| Nosotros | `#nosotros` | Posicionamiento y principios de trabajo |
| Comenzar | `#comenzar`, `#contacto` | Selector de objetivo que elige el tema del formulario |

Las páginas internas (`industrias`, `modelos`, `portafolio`, `proyectos`, `video-ia`) mantienen su diseño y comparten el menú de la home.

Video con IA (`video-ia.html`): producción de video generativo con Higgsfield AI. El encabezado muestra a LIRA, el personaje del estudio (`ar/assets/img/lira.webp`), con el reel (`ar/assets/video/zelira-reel.mp4`, vertical) dentro de la pantalla del celular. Los enlaces con `?interes=video` preseleccionan el tema en el formulario.

## Desarrollo

No hay proceso de build. El sitio vive en `ar/` (se publica en `zelira.com.ar/ar/`). Editá `ar/index.html` y recargá el navegador. Los `.html` de la raíz solo redirigen a `/ar/`, para que las direcciones viejas sigan funcionando.

La versión en inglés vive en `en/`, con los mismos nombres de archivo que `ar/`, y usa los estilos, imágenes y el script de `ar/assets/`. El selector ES / EN del menú salta entre las dos versiones de cada página. Cada cambio de texto en `ar/` tiene que repetirse en su gemela de `en/`. Los textos que escribe `app.js` (avisos del formulario, panel de código, contador del portafolio) están en los dos idiomas dentro del script, con `t('español', 'english')`.

Para verlo servido por HTTP (recomendado si vas a probar el formulario o compartirlo en la red local):

```bash
python -m http.server 8000
# luego abrir http://localhost:8000/ar/
```

## Estructura de archivos

- `ar/assets/zelira.css` — sistema visual de la home: papel perlado con degradados violeta (tokens en `:root`, responsive y `prefers-reduced-motion`).
- `ar/assets/home.js` — lo que solo existe en la home: contadores, ecosistema, pestañas y gráfico del panel, conversación de IA, selector de objetivo y riel de etapas.
- `ar/assets/styles.css` — estilos de las páginas internas. Su última capa ("Capa unificada") les da el mismo menú, botones, títulos y pie que la home.
- `ar/assets/app.js` — compartido por todas las páginas: barra superior, menú móvil, revelado en scroll, formulario, panel de código y fichas del portafolio.

Al cambiar `zelira.css`, `home.js` o `styles.css`, subir el `?v=` con que los cargan las páginas para que el navegador no use la copia en caché.

Las tipografías (Archivo, IBM Plex Sans, IBM Plex Mono) se cargan desde Google Fonts. Sin conexión, el sitio cae a la pila de fuentes de respaldo y sigue siendo legible.

## Formulario de contacto

Las consultas se envían a **contacto@zelira.com.ar** a través de [FormSubmit](https://formsubmit.co), que recibe el POST y reenvía el contenido por correo. Hace falta un intermediario porque GitHub Pages solo sirve archivos estáticos: no puede procesar un formulario ni enviar mails.

El envío es por `fetch` contra `https://formsubmit.co/ajax/contacto@zelira.com.ar`, así que el visitante nunca sale de la página. Incluye un campo trampa (`_honey`) que los bots completan y las personas no, lo que descarta el spam automático.

**Activación (una sola vez):** el primer envío dispara un correo de FormSubmit a la casilla de destino con un enlace de confirmación. Hasta que se haga clic ahí, los mensajes no se reenvían. Después de activarlo, FormSubmit ofrece un alias con forma de token que conviene usar en lugar de la dirección en claro, para que la casilla no quede expuesta en el HTML a los rastreadores de spam.

Para cambiar la dirección de destino, editar la constante `DESTINO` en el `<script>`.

## Despliegue

Cualquier hosting de archivos estáticos sirve. Con **GitHub Pages**: en el repositorio, `Settings → Pages → Source: Deploy from a branch`, rama `main`, carpeta `/ (root)`. El archivo `.nojekyll` está para que Pages publique el sitio tal cual, sin procesarlo con Jekyll.
