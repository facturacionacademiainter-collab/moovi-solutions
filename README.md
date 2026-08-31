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

## Pendientes antes de publicar

Reemplazar los datos de contacto de ejemplo en `index.html`:

- `hola@moovisolutions.com` — aparece 3 veces (texto, `href` del `mailto:` y la constante `DESTINO` en el script).
- `+54 000 000 0000` — teléfono, en el texto y en el `href="tel:"`.
- El horario de atención, si difiere.

## Despliegue

Cualquier hosting de archivos estáticos sirve. Con **GitHub Pages**: en el repositorio, `Settings → Pages → Source: Deploy from a branch`, rama `main`, carpeta `/ (root)`. El archivo `.nojekyll` está para que Pages publique el sitio tal cual, sin procesarlo con Jekyll.
