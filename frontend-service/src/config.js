// Base URLs are injected at build time (REACT_APP_*). Defaults keep local development working.
export const ADDRESS_API = process.env.REACT_APP_ADDRESS_API || 'http://localhost:9090';
export const BACKEND_API = process.env.REACT_APP_BACKEND_API || 'http://localhost:8080';
