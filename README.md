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


## Tienda pública y configuración

- `/tienda` es pública y adaptable a móvil. Productos paginados, búsqueda y filtros en servidor, primero productos con foto; detalle con galería y carrito persistido por comercio.
- Configuración → Publicación de tienda: habilitar publicación, nombre, bienvenida, moneda y número de WhatsApp. Configuración → Inicio de tienda: crear colecciones con título, portada y encuadre, orden y selección paginada de productos; guardar borrador, activar y pausar. Los cambios en borrador no alteran la versión publicada.
- El checkout valida stock/precios, registra el pedido y prepara WhatsApp al teléfono del local. Pedidos → Tienda online permite gestionar Pendiente, En preparación, Listo para entrega, Entregado, Devolución y Cancelado. Abrir WhatsApp no confirma que el cliente haya enviado el mensaje.
- Las imágenes de productos y portadas publicadas usan rutas públicas del catálogo, sin sesión. Las portadas privadas/borradores siguen protegidas. No se incorporan datos ni fotografías de clientes particulares en la plantilla.
- Configurar `NEXT_PUBLIC_API_URL` en frontend y `NEXT_PUBLIC_SITE_URL` con su dominio público para enlaces y metadatos. Antes de desplegar frontend, desplegar API y sus migraciones; no habilitar la tienda hasta configurar WhatsApp y publicar productos.
- No hay cobro electrónico: el flujo actual coordina el pedido por WhatsApp. No se ejecutaron MySQL ni QA de navegador al trasladar estos cambios.
