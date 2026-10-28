# template-retail

Gold **Aurix Retail** (frontend Next.js). Catálogo, productos, clientes, pedidos, POS y mayorista.

## Stack

- Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript
- Datos vía API (`NEXT_PUBLIC_API_URL`) o fallback en memoria (`src/lib/memory-store.ts`)

## Desarrollo

```bash
cp .env.example .env.local
# Opcional: NEXT_PUBLIC_API_URL=http://127.0.0.1:3852
npm install
npm run dev
```

App en [http://127.0.0.1:3851](http://127.0.0.1:3851).

Sin `NEXT_PUBLIC_API_URL` corre en **modo demo** (memoria).  
Con URL apunta al gold API (`/api/*` de `template-retail-api`).

## Conexión al API (alta Fenec)

En cada instancia, el front debe buildarse con:

```
NEXT_PUBLIC_API_URL=https://api-{slug}.aurixerp.com
```

El cliente HTTP está en `src/lib/api-client.ts`; `src/lib/store.ts` enruta a API o memoria.

## Módulos

| Ruta | Uso |
|------|-----|
| `/` | Dashboard / KPIs |
| `/catalogo` | Vitrina de productos activos |
| `/productos` | SKUs + ficha QR/barcode |
| `/clientes` | Agenda de clientes |
| `/pedidos` | Pedidos + historial POS |
| `/pos` | Terminal de caja (envío + ticket térmico) |
| `/mayorista` | Pedidos B2B + boleta PDF Aurix |
| `/configuracion` | Listas de precios |

## Template GitHub

Marcado como **Template repository** para el alta (`repoTemplateFront`).
