# Moovi Solutions

Sitio web corporativo de **Moovi Solutions** — ingeniería de software e inteligencia artificial para empresas.

Es un sitio estático de un solo archivo: no necesita build, ni dependencias, ni servidor. Se abre `index.html` en cualquier navegador.

## Contenido

| Sección | Qué muestra |
| --- | --- |
| Héroe | Presentación, con red de nodos animada en canvas |
| Servicios | Desarrollo de Software · Soluciones de IA |
| Casos de uso | Ecommerce · Apps Móviles · Smart City e IoT |
| Proceso | Descubrimiento → Arquitectura → Construcción → Operación |
| Stack | Tecnologías, con panel de código que se escribe solo |
| Contacto | Formulario que compone el mail con `mailto:` |

## Desarrollo

No hay proceso de build. Editá `index.html` y recargá el navegador.

Para verlo servido por HTTP (recomendado si vas a probar el formulario o compartirlo en la red local):

```bash
python -m http.server 8000
# luego abrir http://localhost:8000
```

## Estructura del archivo

Todo vive en `index.html`, en tres bloques:

1. `<style>` — tokens de diseño en `:root` (color, tipografía, escala), componentes, responsive y `prefers-reduced-motion`.
2. El marcado de las secciones.
3. `<script>` — barra superior, menú móvil, revelado en scroll, formulario, panel de código animado y la red de nodos del héroe.

Las tipografías (Archivo, IBM Plex Sans, IBM Plex Mono) se cargan desde Google Fonts. Sin conexión, el sitio cae a la pila de fuentes de respaldo y sigue siendo legible.

## Formulario de contacto

Las consultas se envían a **contacto@moovisolutions.com** a través de [FormSubmit](https://formsubmit.co), que recibe el POST y reenvía el contenido por correo. Hace falta un intermediario porque GitHub Pages solo sirve archivos estáticos: no puede procesar un formulario ni enviar mails.

El envío es por `fetch` contra `https://formsubmit.co/ajax/contacto@moovisolutions.com`, así que el visitante nunca sale de la página. Incluye un campo trampa (`_honey`) que los bots completan y las personas no, lo que descarta el spam automático.

**Activación (una sola vez):** el primer envío dispara un correo de FormSubmit a la casilla de destino con un enlace de confirmación. Hasta que se haga clic ahí, los mensajes no se reenvían. Después de activarlo, FormSubmit ofrece un alias con forma de token que conviene usar en lugar de la dirección en claro, para que la casilla no quede expuesta en el HTML a los rastreadores de spam.

Para cambiar la dirección de destino, editar la constante `DESTINO` en el `<script>`.

## Despliegue

Cualquier hosting de archivos estáticos sirve. Con **GitHub Pages**: en el repositorio, `Settings → Pages → Source: Deploy from a branch`, rama `main`, carpeta `/ (root)`. El archivo `.nojekyll` está para que Pages publique el sitio tal cual, sin procesarlo con Jekyll.
