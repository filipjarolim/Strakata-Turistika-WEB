interface WorkboxEventMap {
  controlling: Event;
  activated: Event;
  installed: CustomEvent<{ isUpdate: boolean }>;
  redundant: Event;
  externalinstalled: CustomEvent<{ isUpdate: boolean }>;
  externalactivated: Event;
  externalwaiting: Event;
  waiting: Event;
}

interface Workbox extends EventTarget {
  addEventListener<K extends keyof WorkboxEventMap>(
    type: K,
    listener: (this: Workbox, ev: WorkboxEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof WorkboxEventMap>(
    type: K,
    listener: (this: Workbox, ev: WorkboxEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  register(): Promise<void>;
  update(): Promise<void>;
  getSW(): Promise<ServiceWorker>;
  messageSkipWaiting(): void;
}

interface Window {
  workbox?: Workbox;
} 