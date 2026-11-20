import L from 'leaflet';

if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { L: typeof L }).L = L;
}

export default L;
