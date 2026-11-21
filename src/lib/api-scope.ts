/**
 * Alcance de las peticiones (comercio, sucursal, vendedor).
 * Vive en memoria de la pestaña y lo completa la API; no se persiste.
 */

type ApiScope = {
  comercioId: string | null;
  branchScope: string | null;
  vendedorId: string | null;
};

let scope: ApiScope = {
  comercioId: null,
  branchScope: null,
  vendedorId: null,
};

export function getApiScope(): ApiScope {
  return scope;
}

export function setApiScope(patch: Partial<ApiScope>): void {
  scope = { ...scope, ...patch };
}
