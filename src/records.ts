import { KeyValue } from "./utils";
import { Observable } from "./observable";
import { Mutation, MutationType, Insert, Append } from "./mutations";

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
  private _stateCache?: any;
  readonly changeObservable = new Observable<Mutation>();
  constructor(id: string, type: TType) {
    this.id = id;
    this.type = type;
    this.changeObservable.observe(this._onChange);
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
  getState(): any {
    if (this._stateCache) {
      return this._stateCache;
    }
    return this._stateCache = this._getState();
  }
  applyMutation(mutation: Mutation): void {
    switch(mutation.type) {
      case MutationType.DELETE: {
        this.$$parent.remove(this);
        break;
      }
    }
  }
  abstract clone();
  protected abstract _getState(): any;
  protected abstract _toJSON(): TData;

  private _onChange = () => {
    this._jsonCache = null;
    this._stateCache = null;
  }

  traverse(handler: ItemTraverser) {
    handler(this);
  }
}

abstract class BaseParent<TType extends RecordType, TData extends BaseRecordData<TType>> extends BaseRecord<TType, TData> {
  protected linkChild(child: Record) {
    child.$$parent = this;
    if (isParentRecord(child)) {
      child.changeObservable.observe(this.changeObservable.dispatch);
    }
  }

  abstract remove(child: BaseRecord<any, any>);

  protected unlinkChild(child: Record) {
    child.$$parent = this;
    if (isParentRecord(child)) {
      child.changeObservable.unobserve(this.changeObservable.dispatch);
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
    for (let i = 0, {length} = this._items; i < length; i++) {
      this._items[i].$$parent = this;
    }
  }
  get items() {
    return this._items;
  }
  push(item: Record) {
    this.linkChild(item);
    this.insert(this._items.length, item);
  }
  applyMutation(mutation: Mutation) {
    super.applyMutation(mutation);
    switch(mutation.type) {
      case MutationType.APPEND: {
        this.push($castRecord(mutation.value));
        break;
      }
      case MutationType.INSERT: {
        const beforeIndex = this._items.findIndex(item => item.id === mutation.before);
        // TODO - return conflict if before not found
        this.insert(beforeIndex, $castRecord(mutation.value));
        break;
      }
    }
    this.changeObservable.dispatch(mutation);
  }
  clone() {
    return new List(this.id, this._items.map(item => {
      return item.clone()
    }));
  }
  insert(index: number, item: Record) {
    this.linkChild(item);
    this._items.splice(index, 0, item);
    if (index < this._items.length - 1) {
      this.changeObservable.dispatch({ type: MutationType.INSERT, before: this._items[index + 1].id, value: item, timestamp: Date.now(), target: this.id });
    } else {
      this.changeObservable.dispatch({ type: MutationType.APPEND, target: this.id, value: item, timestamp: Date.now() });
    }
  }
  remove(item: Record) {
    const index = this._items.findIndex(existing => existing.id === item.id);
    if (index === -1) {
      return;
    }
    this.removeAt(index);
  }
  removeAt(index: number) {
    const item = this._items[index];
    if (!item) {
      return;
    }
    this._items.splice(index, 1);
    this.unlinkChild(item);
    this.changeObservable.dispatch({ type: MutationType.DELETE, target: item.id, timestamp: Date.now() });
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
  _getState() {
    return this._items.map(item => item.getState())
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
    for (const key in this._properties) {
      this._properties[key].$$parent = this;
    }
  }
  get properties() {
    return this._properties;
  }
  clone() {
    const clonedProperties = {};
    for (const key in this._properties) {
      clonedProperties[key] = this._properties[key];
    }
    return new Map(this.id, clonedProperties);
  }
  applyMutation(mutation: Mutation) {
    super.applyMutation(mutation);
    this.changeObservable.dispatch(mutation);
  }
  setValue(propertyName: string, value: Record) {
    if (value) {
      this.linkChild(value);
    }
    if (this._properties[propertyName]) {
      this.unlinkChild(this._properties[propertyName]);
      this.changeObservable.dispatch({ type: MutationType.DELETE, target: this._properties[propertyName].id, timestamp: Date.now() });
    }
    if (value == null) {
      delete this._properties[propertyName];
    } else {
      this._properties[propertyName] = value;
    }
    this.changeObservable.dispatch({ type: MutationType.MAP_SET, target: this.id, propertyName, value, timestamp: Date.now() });
  }
  remove(value: Record) {
    for (const propertyName in this._properties) {
      const item = this._properties[propertyName];
      if (item.id === value.id) {
        this.removeValue(propertyName);
        break;
      }
    }
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
  _getState() {
    const state = {};
    for (const key in this._properties) {
      state[key] = this._properties[key].getState();
    }
    return state;
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
  clone() {
    return new Primitive(this.id, this._value);
  }
  applyMutation(mutation: Mutation) {
    super.applyMutation(mutation);
    this.changeObservable.dispatch(mutation);
  }
  _toJSON() {
    return {
      id: this.id,
      type: this.type,
      value: this._value
    }
  }
  _getState() {
    return this.value;
  }
}

export type Record = Map | List | Primitive;
export type RecordData = MapData | ListData | PrimitiveData;
export type RecordCreator = (value: Object) => Record;

export const $recordCreator = (generateId: () => string): RecordCreator => {
  const createRecord = (value: Object) => {
    if (Array.isArray(value)) {
      return new List(generateId(), value.map(createRecord));
    } else if (value && typeof value === "object") {
      if (value.constructor !== Object) {
        throw new Error(`Unable to use ${value.constructor.name} in CRDT document. value must only extend Object, Array, String, Boolean, or Number.`);
      }
      const properties = {};
      for (const key in value) {
        properties[key] = createRecord(value[key]);
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

  return createRecord;
}

export const $deserializeRecord = (item: RecordData) => {
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
        properties[key] = $deserializeRecord(item.properties[key]);
      }
      return new Map(item.id, properties);
    }
    case RecordType.LIST: {
      return new List(item.id, item.items.map($deserializeRecord));
    }
  }
}

const $castRecord = (record: RecordData) => {
  return record instanceof BaseRecord ? record : $deserializeRecord(record);
}