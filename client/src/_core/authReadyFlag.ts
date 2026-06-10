// AUTH-LOOP-001: apiClient.ts is a plain module and cannot consume React
// context. The AuthExchangeProvider mirrors its readiness here so the 401
// handler can distinguish "session genuinely expired" (redirect is correct)
// from "exchange still in flight" (redirect creates the loop).
let ready = false;
export const setAuthReady = (v: boolean): void => { ready = v; };
export const isAuthReady = (): boolean => ready;
