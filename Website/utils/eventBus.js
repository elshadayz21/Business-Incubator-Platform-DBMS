import { EventEmitter } from "events";

class SafeEventBus extends EventEmitter {
  emit(event, ...args) {
    const listeners = this.listeners(event);
    for (const listener of listeners) {
      try {
        const result = listener(...args);
        if (result instanceof Promise) {
          result.catch(err => {
            console.error(`[EventBus] Error in async subscriber for event "${event}":`, err);
          });
        }
      } catch (err) {
        console.error(`[EventBus] Error in sync subscriber for event "${event}":`, err);
      }
    }
    return listeners.length > 0;
  }
}

const eventBus = new SafeEventBus();
export default eventBus;
