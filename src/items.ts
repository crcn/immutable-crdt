import { KeyValue } from "./utils";
import { ObservableHandler, Observable } from "./observable";
import { CRDTMutation, CRDTMutationType } from "./crdt";

export type BaseItemShape = {
  id: string;
};

export abstract class BaseItem<TShape extends BaseItemShape> implements BaseItemShape {
  readonly id: string;
  $$parent: BaseParent<any>;
  private _jsonCache?: TShape;
  readonly changeObserver = new Observable<CRDTMutation>();
  constructor(id: string) {
    this.id = id;
    this.changeObserver.observe(this._onChange);
  }
  getParent() {
    return this.$$parent;
  }
  toJSON(): TShape {
    if (this._jsonCache) {
      return this._jsonCache;
    }
    return this._jsonCache = this._toJSON();
  }
  protected abstract _toJSON(): TShape;

  private _onChange = () => {
    this._jsonCache = null;
  }
}

abstract class BaseParent<TShape extends BaseItemShape> extends BaseItem<TShape> {
  protected linkChild(child: CRDTItem) {
    child.$$parent = this;
    if (isParentCRDTItem(child)) {
      child.changeObserver.observe(this.changeObserver.dispatch);
    }
  }

  protected unlinkChild(child: CRDTItem) {
    child.$$parent = this;
    if (isParentCRDTItem(child)) {
      child.changeObserver.unobserve(this.changeObserver.dispatch);
    }
  }
  
}

export const isParentCRDTItem = (item: CRDTItem): item is List | Map => {
  return item instanceof Map || item instanceof List;
}

type ListShape = {
  items: BaseItemShape[];
} & BaseItemShape;

export class List extends BaseParent<ListShape>  {
  _items: CRDTItem[];
  constructor(id: string, items: CRDTItem[]) {
    super(id);
    this._items = items;
  }
  get items() {
    return this._items;
  }
  push(item: CRDTItem) {
    this.linkChild(item);
    this.insert(this._items.length, item);
  }
  insert(index: number, item: CRDTItem) {
    this.linkChild(item);
    this._items.splice(index, 0, item);
    if (index >= this._items.length) {
      this.changeObserver.dispatch({ type: CRDTMutationType.INSERT, before: this._items[index + 1].id, value: item });
    } else {
      this.changeObserver.dispatch({ type: CRDTMutationType.APPEND, parent: this.id, value: item });
    }
  }
  remove(item: CRDTItem) {
    const index = this._items.findIndex(existing => existing.id === item.id);
    if (index === -1) {
      return;
    }
    this.unlinkChild(item);
    this.changeObserver.dispatch({ type: CRDTMutationType.DELETE, ref: item.id });
  }
  _toJSON() {
    return {
      id: this.id,
      items: this._items.map(item => item.toJSON())
    }
  }
}

type MapShape = {
  properties: KeyValue<BaseItemShape>;
} & BaseItemShape;

export class Map extends BaseParent<MapShape> implements MapShape {
  _properties: KeyValue<CRDTItem>;
  constructor(id: string, properties: KeyValue<CRDTItem>) {
    super(id);
    this._properties = properties;
  }
  get properties() {
    return this._properties;
  }
  setValue(propertyName: string, value: CRDTItem) {
    value.$$parent = this;
    if (this._properties[propertyName]) {
      this.changeObserver.dispatch({ type: CRDTMutationType.DELETE, ref: this._properties[propertyName].id });
    }
    this._properties[propertyName] = value;
    this.changeObserver.dispatch({ type: CRDTMutationType.MAP_SET, ref: this.id, propertyName, value });
  }
  getValue(key: string) {
    return this._properties[key];
  }
  _toJSON() {
    const properties = {};
    for (const key in this._properties) {
      properties[key] = this._properties[key].toJSON();
    }
    return {
      id: this.id,
      properties: this._properties
    }
  }
}

type PrimitiveValue = string | number | boolean | undefined | null;

export type PrimitiveJSON = {
  id: string;
  value: PrimitiveValue;
};

export class Primitive extends BaseItem<PrimitiveJSON> {
  _value: PrimitiveValue;
  constructor(id: string, value: PrimitiveValue) {
    super(id);
    this._value = value;
  }
  _toJSON() {
    return {
      id: this.id,
      value: this._value
    }
  }
}

export type CRDTItem = Map | List | Primitive;

export class Table {
  private _items: KeyValue<BaseItemShape>;
  private _root: CRDTItem;
  constructor(root: CRDTItem) {
    this._root = root;
    this._root.changeObserver.observe(this._onRootChange);
  }
  getItem(id: string): BaseItemShape {
    return this._items[id];
  }
  private _onRootChange = (mutation: CRDTMutation) => {
    switch(mutation.type) {
      case CRDTMutationType.DELETE: {
        delete this._items[mutation.ref];
        break;
      }
      case CRDTMutationType.MAP_SET:
      case CRDTMutationType.APPEND:
      case CRDTMutationType.INSERT: {
        this._items[mutation.value.id] = mutation.value;
        break;
      }
    }
  };
}

export const crdtItemCreator = (generateId: () => string) => {
  const createItem = (value: Object) => {
    if (Array.isArray(value)) {
      return new List(generateId(), value.map(createItem));
    } else if (value && typeof value === "object") {
      if (value.constructor !== Object) {
        throw new Error(`Unable to use ${value.constructor.name} in CRDT document. value must only extend Object, Array, String, Boolean, or Number.`);
      }
      const properties = {};
      for (const key in value) {
        properties[key] = createItem(value[key]);
      }
      return new Map(generateId(), properties);
    } else {
      const tov = typeof value;
      if (!tov || tov === "string" || tov === "number" || tov === "boolean") {
        return new Primitive(generateId(), value as PrimitiveValue);
      }
    }
    throw new Error(`Unsupported primitive ${value}.`);
  };

  return createItem;
}