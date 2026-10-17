type Listener = (token:string) => void;
const listeners = new Set<Listener>();
export function onUnauthorized(listener:Listener) {listeners.add(listener);return () => {listeners.delete(listener);};}
export function notifyUnauthorized(token:string) {for (const listener of listeners) listener(token);}
