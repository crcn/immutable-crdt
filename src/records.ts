import { KeyValue } from "./utils";
import { Observable } from "./observable";
import { Mutation, MutationType } from "./mutations";

export enum RecordType {
  MAP = "MAP",
  LIST = "LIST",
  PRIMITIVE = "PRIMITIVE"
}

export type BaseRecordData<TType extends RecordType> = {
  id: string;
  type: TType
};

type ItemTraverser = (item: BaseRecord<any, any>) => void;

export abstract class BaseRecord<TType extends RecordType, TData extends BaseRecordData<TType>> implements BaseRecordData<RecordType> {
  readonly id: string;
  readonly type: TType;
  $$parent: BaseParent<any, any>;
  private _jsonCache?: TData;
  readonly changeObserver = new Observable<Mutation>();
  constructor(id: string, type: TType) {
    this.id = id;
    this.type = type;
    this.changeObserver.observe(this._onChange);
  }
  getParent() {
    return this.$$parent;
  }
  toJSON(): TData {
    if (this._jsonCache) {
      return this._jsonCache;
    }
    return this._jsonCache = this._toJSON();
  }
  protected abstract _toJSON(): TData;

  private _onChange = () => {
    this._jsonCache = null;
  }

  traverse(handler: ItemTraverser) {
    handler(this);
  }
}

abstract class BaseParent<TType extends RecordType, TData extends BaseRecordData<TType>> extends BaseRecord<TType, TData> {
  protected linkChild(child: Record) {
    child.$$parent = this;
    if (isParentRecord(child)) {
      child.changeObserver.observe(this.changeObserver.dispatch);
    }
  }

  protected unlinkChild(child: Record) {
    child.$$parent = this;
    if (isParentRecord(child)) {
      child.changeObserver.unobserve(this.changeObserver.dispatch);
    }
  }
}

export const isParentRecord = (item: Record): item is List | Map => {
  return item instanceof Map || item instanceof List;
}

type ListData = {
  items: RecordData[];
} & BaseRecordData<RecordType.LIST>;

export class List extends BaseParent<RecordType.LIST, ListData> implements ListData {
  private _items: Record[];
  constructor(id: string, items: Record[]) {
    super(id, RecordType.LIST);
    this._items = items;
  }
  get items() {
    return this._items;
  }
  push(item: Record) {
    this.linkChild(item);
    this.insert(this._items.length, item);
  }
  insert(index: number, item: Record) {
    this.linkChild(item);
    this._items.splice(index, 0, item);
    if (index >= this._items.length) {
      this.changeObserver.dispatch({ type: MutationType.INSERT, before: this._items[index + 1].id, value: item, timestamp: Date.now() });
    } else {
      this.changeObserver.dispatch({ type: MutationType.APPEND, parent: this.id, value: item, timestamp: Date.now() });
    }
  }
  remove(item: Record) {
    const index = this._items.findIndex(existing => existing.id === item.id);
    if (index === -1) {
      return;
    }
    this.unlinkChild(item);
    this.changeObserver.dispatch({ type: MutationType.DELETE, ref: item.id, timestamp: Date.now() });
  }
  removeAt(index: number) {
    const item = this._items[index];
    if (!item) {
      return;
    }
    return this.remove(item);
  }
  traverse(handler: ItemTraverser) {
    super.traverse(handler);
    this.toJSON()
    for (const item of this._items) {
      item.traverse(handler);
    }
  }
  _toJSON() {
    return {
      id: this.id,
      type: this.type,
      items: this._items.map(item => item.toJSON())
    }
  }
}

type MapData = {
  properties: KeyValue<RecordData>;
} & BaseRecordData<RecordType.MAP>;

export class Map extends BaseParent<RecordType.MAP, MapData> implements MapData {
  _properties: KeyValue<Record>;
  constructor(id: string, properties: KeyValue<Record>) {
    super(id, RecordType.MAP);
    this._properties = properties;
  }
  get properties() {
    return this._properties;
  }
  setValue(propertyName: string, value: Record) {
    this.linkChild(value);
    if (this._properties[propertyName]) {
      this.unlinkChild(this._properties[propertyName]);
      this.changeObserver.dispatch({ type: MutationType.DELETE, ref: this._properties[propertyName].id, timestamp: Date.now() });
    }
    this._properties[propertyName] = value;
    this.changeObserver.dispatch({ type: MutationType.MAP_SET, ref: this.id, propertyName, value, timestamp: Date.now() });
  }
  removeValue(propertyName: string) {
    this.setValue(propertyName, undefined);
  }
  traverse(handler: ItemTraverser) {
    super.traverse(handler);
    for (const key in this._properties) {
      const value = this._properties[key];
      value.traverse(handler);
    }
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
      type: this.type,
      properties,
    }
  }
}

type PrimitiveValue = string | number | boolean | undefined | null;

export type PrimitiveData = {
  id: string;
  value: PrimitiveValue;
} & BaseRecordData<RecordType.PRIMITIVE>

export class Primitive extends BaseRecord<RecordType.PRIMITIVE, PrimitiveData> implements PrimitiveData {
  _value: PrimitiveValue;
  constructor(id: string, value: PrimitiveValue) {
    super(id, RecordType.PRIMITIVE);
    this._value = value;
  }
  get value() {
    return this._value;
  }
  _toJSON() {
    return {
      id: this.id,
      type: this.type,
      value: this._value
    }
  }
}

export type Record = Map | List | Primitive;
export type RecordData = MapData | ListData | PrimitiveData;

export const recordCreator = (generateId: () => string) => {
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

export const deserializeRecord = (item: RecordData) => {
  if (item.constructor !== Object) {
    throw new Error(`deserialized object must be vanilla`);
  }
  switch(item.type) {
    case RecordType.PRIMITIVE: {
      return new Primitive(item.id, item.value);
    }
    case RecordType.MAP: {
      const properties = {};
      for (const key in item.properties) {
        properties[key] = deserializeRecord(item.properties[key]);
      }
      return new Map(item.id, properties);
    }
    case RecordType.LIST: {
      return new List(item.id, item.items.map(deserializeRecord));
    }
  }
}