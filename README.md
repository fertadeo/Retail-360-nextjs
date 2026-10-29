# Retail 360 (Next.js)

Frontend gold **Retail 360** — misma línea visual que `template-retail`, con **sucursales** y sync de productos a **WooCommerce** y **Mercado Libre**.

Base: `fertadeo/template-retail`. Destino de provision: este repo.

## Stack

- Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript
- Datos vía API (`NEXT_PUBLIC_API_URL`) o fallback en memoria

## Desarrollo

```bash
cp .env.example .env.local
# Opcional: NEXT_PUBLIC_API_URL=http://127.0.0.1:3852
npm install
npm run dev
```

App en [http://127.0.0.1:3851](http://127.0.0.1:3851).

## Módulos

| Ruta | Uso |
|------|-----|
| `/` | Dashboard |
| `/catalogo` | Vitrina |
| `/productos` | SKUs + push WC/ML |
| `/clientes` | Agenda |
| `/pedidos` | Pedidos + POS |
| `/pos` | Terminal de caja |
| `/presupuestos` | Presupuestos + reglas de descuento escalonado |
| `/mayorista` | B2B |
| `/comercios` | Unidades de negocio + share/rotación de stock |
| `/sucursales` | Sucursales físicas |
| `/canales` | Credenciales y sync WooCommerce / Mercado Libre |
| `/configuracion` | Listas de precios |

## Gold Fenec

- Front: `fertadeo/Retail-360-nextjs`
- API: `fertadeo/Retail-360-api`
