# template-retail

Gold **Aurix Retail** (frontend Next.js). Catálogo, productos, clientes, pedidos y POS.

## Stack

- Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript
- Datos en memoria (`src/lib/store.ts`) hasta conectar `template-retail-api`

## Desarrollo

```bash
npm install
npm run dev
```

App en [http://127.0.0.1:3851](http://127.0.0.1:3851).

## Módulos

| Ruta | Uso |
|------|-----|
| `/` | Dashboard / KPIs |
| `/catalogo` | Vitrina de productos activos |
| `/productos` | Alta y edición de SKUs |
| `/clientes` | Agenda de clientes |
| `/pedidos` | Pedidos + historial POS |
| `/pos` | Terminal de caja |

## Template GitHub

Este repo debe estar marcado como **Template repository** para el alta Fenec Admin (`repoTemplateFront`).
