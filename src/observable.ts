export type ObservableHandler<TMessage> = (message: TMessage) => void;


export class Observable<TMessage> {
  private _handlers: ObservableHandler<TMessage>[] = [];
  observe(handler: ObservableHandler<TMessage>) {
    if (handler == null) {
      throw new Error(`handler cannot be null`);
    }
    if (this._handlers.indexOf(handler) !== -1) {
      throw new Error(`Cannot add a handler twice to an observer.`);
    }
    this._handlers.push(handler);
  }
  unobserve(handler: ObservableHandler<TMessage>) {
    const index = this._handlers.indexOf(handler);
    if (index === -1) {
      return;
    }
    this._handlers.splice(index, 1);
  }
  dispatch = (message: TMessage) => {
    for (const handler of this._handlers) {
      handler(message);
    }
  }
}