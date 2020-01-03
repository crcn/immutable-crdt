import { KeyValue, generateId } from "./utils";
import { Observable } from "./observable";
import { Mutation, MutationType } from "./mutations";
import { TargetNotFoundError } from "./errors";
import {Adapter as OTDiffAdapter, defaultAdapter as defaultOTDiffAdapter} from "immutable-ot";

export enum RecordType {
  MAP = "MAP",
  LIST = "LIST",
  PRIMITIVE = "PRIMITIVE"
}

export type BaseRecordData<TType extends RecordType> = {
  id: string;
  type: TType;
  castName: string;
};

type ItemTraverser = (item: BaseRecord<any, any>) => void;

export abstract class BaseRecord<TType extends RecordType, TData extends BaseRecordData<TType>> implements BaseRecordData<RecordType> {
  readonly id: string;
  readonly type: TType;
  $$parent: BaseParent<any, any>;
  private _jsonCache?: TData;
  private _stateCache?: any;
  readonly changeObservable = new Observable<Mutation>();
  constructor(id: string, type: TType, protected _options: RecordOptions, readonly castName: string) {
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
  getPath(): string[] {
    const parent = this.$$parent;
    if (!parent) {
      return [];
    }

    return [...parent.getPath(), parent.getKey(this)];
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
  clone() {
    const clone = this._clone();
    clone._jsonCache = this._jsonCache;
    clone._stateCache = this._stateCache;
    return clone;
  }
  protected abstract _clone();
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
    if (child.$$parent === this) {
      throw new Error(`cannot link child to parent twice.`);
    }
    child.$$parent = this;
    if (isParentRecord(child)) {
      child.changeObservable.observe(this.changeObservable.dispatch);
    }
  }

  abstract remove(child: BaseRecord<any, any>);
  abstract getKey(item: BaseRecord<any, any>);

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
  constructor(id: string, items: Record[], options: RecordOptions, className: string) {
    super(id, RecordType.LIST, options, className);
    this._items = items;
    for (let i = 0, {length} = this._items; i < length; i++) {
      this.linkChild(this._items[i]);
    }
  }
  get items() {
    return this._items;
  }
  getKey(item: Record) {
    return this._items.indexOf(item);
  }
  push(item: Record) {
    this.insert(this._items.length, item);
  }
  applyMutation(mutation: Mutation) {
    super.applyMutation(mutation);
    switch(mutation.type) {
      case MutationType.INSERT: {
        if (mutation.beforeId == null) {
          this.push($castRecord(mutation.value, this._options));
          break;
        }

        const beforeIndex = this._items.findIndex(item => item.id === mutation.beforeId);
        // TODO - return conflict if before not found
        this.insert(beforeIndex, $castRecord(mutation.value, this._options));
        break;
      }
      case MutationType.MOVE_LIST_ITEM: {
        const itemIndex = this._items.findIndex(item => item.id === mutation.itemId);
        if (itemIndex === -1) {
          return new TargetNotFoundError(`${mutation.itemId} does not exist`);
        }

        if (mutation.beforeId == null) {
          this.move(itemIndex, this._items.length);
          break;
        }

        const beforeIndex = this._items.findIndex(item => item.id === mutation.beforeId);

        if (beforeIndex === -1) {
          return new TargetNotFoundError(`${mutation.beforeId} does not exist`);
        }
        
        this.move(itemIndex, beforeIndex);
        break;
      }
      case MutationType.REPLACE_LIST_ITEM: {
        const itemIndex = this._items.findIndex(item => item.id === mutation.itemId);
        if (itemIndex === -1) {
          return new TargetNotFoundError(`${mutation.itemId} does not exist`);
        }
        this.replace(itemIndex, $castRecord(mutation.value, this._options));
        break;
      }
    }
  }
  _clone() {
    return new List(this.id, this._items.map(item => {
      return item.clone();
    }), this._options, this.castName);
  }
  insert(index: number, item: Record) {
    this.linkChild(item);
    const before = this._items[index];
    this._items.splice(index, 0, item);

    if (before) {
      this.changeObservable.dispatch({ id: this._options.generateId(), type: MutationType.INSERT, beforeId: before.id, value: item,  targetId: this.id, targetPath: this.getPath() });
    } else {
      this.changeObservable.dispatch({  id: this._options.generateId(), type: MutationType.INSERT, beforeId: null, targetId: this.id, value: item, targetPath: this.getPath()  });
    }
  }
  replace(index: number, item: Record) {
    const oldItem = this._items[index];
    this._items.splice(index, 1, item);
    this.changeObservable.dispatch({  id: this._options.generateId(), type: MutationType.REPLACE_LIST_ITEM, itemId: oldItem.id, targetId: this.id, value: item, targetPath: this.getPath() });
  }
  indexOf(item: Record) {
    return this._items.indexOf(item);
  }
  remove(item: Record) {
    const index = this._items.findIndex(existing => existing.id === item.id);
    if (index === -1) {
      return;
    }
    this.removeAt(index);
  }
  move(oldIndex: number, newIndex: number) {
    const item = this._items[oldIndex];
    const before = this._items[newIndex];
    this._items.splice(oldIndex, 1);
    this._items.splice(newIndex, 0, item);
    this.changeObservable.dispatch({  id: this._options.generateId(), type: MutationType.MOVE_LIST_ITEM, itemId: item.id, targetId: this.id, beforeId: before && before.id, targetPath: this.getPath()  });
  }
  removeAt(index: number) {
    const item = this._items[index];
    if (!item) {
      return;
    }
    const itemPath = item.getPath();
    this._items.splice(index, 1);
    this.unlinkChild(item);
    this.changeObservable.dispatch({ id: this._options.generateId(),  type: MutationType.DELETE, targetId: item.id, targetPath: itemPath });
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
      items: this._items.map(item => item.toJSON()),
      castName: this.castName,
    }
  }
  _getState() {
    return this._options.adapter.castValue(this._items.map(item => item.getState()), this.castName);
  }
}

type MapData = {
  properties: KeyValue<RecordData>;
} & BaseRecordData<RecordType.MAP>;

export class Map extends BaseParent<RecordType.MAP, MapData> implements MapData {
  _properties: KeyValue<Record>;
  constructor(id: string, properties: KeyValue<Record>, options: RecordOptions,  className: string) {
    super(id, RecordType.MAP, options, className);
    this._properties = properties;
    for (const key in this._properties) {
      this.linkChild(this._properties[key]);
    }
  }
  get properties() {
    return this._properties;
  }
  _clone() {
    const clonedProperties = {};
    for (const key in this._properties) {
      clonedProperties[key] = this._properties[key].clone();
    }
    return new Map(this.id, clonedProperties, this._options, this.castName);
  }
  applyMutation(mutation: Mutation) {
    super.applyMutation(mutation);
    switch(mutation.type) {
      case MutationType.MAP_SET: {
        this.setValue(mutation.propertyName, $castRecord(mutation.value, this._options));
        break;
      }
      case MutationType.MAP_UNSET: {
        this.removeValue(mutation.propertyName);
        break;
      }
    }
  }
  getKey(value: Record) {
    for (const key in this._properties) {
      if (this._properties[key] === value) {
        return key;
      }
    }
    return null;
  }
  setValue(propertyName: string, value: Record) {
    if (value) {
      this.linkChild(value);
    }
    const oldItem = this._properties[propertyName];

    if (oldItem) {
      this.unlinkChild(oldItem);
    }

    if (value == null) {
      delete this._properties[propertyName];
      this.changeObservable.dispatch({  id: this._options.generateId(), type: MutationType.MAP_UNSET, oldValueId: oldItem && oldItem.id,  targetId: this.id, propertyName, targetPath: this.getPath() });
    } else {
      this._properties[propertyName] = value;
      this.changeObservable.dispatch({  id: this._options.generateId(), type: MutationType.MAP_SET, targetId: this.id, propertyName, value, targetPath: this.getPath() });
    }
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
      castName: this.castName,
    }
  }
  _getState() {
    const state = {};
    for (const key in this._properties) {
      state[key] = this._properties[key].getState();
    }
    return this._options.adapter.castValue(state, this.castName);
  }
}

type PrimitiveValue = string | number | boolean | undefined | null;

export type PrimitiveData = {
  id: string;
  value: PrimitiveValue;
} & BaseRecordData<RecordType.PRIMITIVE>

export class Primitive extends BaseRecord<RecordType.PRIMITIVE, PrimitiveData> implements PrimitiveData {
  _value: PrimitiveValue;
  constructor(id: string, value: PrimitiveValue, options: RecordOptions, className: string) {
    super(id, RecordType.PRIMITIVE, options, className);
    this._value = value;
  }
  get value() {
    return this._value;
  }
  _clone() {
    return new Primitive(this.id, this._value, this._options, this.castName);
  }
  applyMutation(mutation: Mutation) {
    super.applyMutation(mutation);
    this.changeObservable.dispatch(mutation);
  }
  _toJSON() {
    return {
      id: this.id,
      type: this.type,
      value: this._value,
      castName: this.castName,
    }
  }
  _getState() {
    return this._options.adapter.castValue(this.value, this.castName);
  }
}

export type Record = Map | List | Primitive;
export type RecordData = MapData | ListData | PrimitiveData;
export type RecordCreator = (value: Object) => Record;

const map = (list: any, mapper: any, adapter: OTDiffAdapter) => {
  const newItems = [];
  adapter.each(list, (value) => newItems.push(mapper(value)));
  return newItems;
};

export type RecordAdapter = {
  getCastName(value): string;
  castValue(value, as: string): any;
} & OTDiffAdapter;

export type RecordOptions = {
  adapter: RecordAdapter,
  generateId: () => string,
}


export const defaultAdapter = {
  ...defaultOTDiffAdapter,
  getCastName(value) {
    return value == null ? null : value.constructor.name;
  },
  castValue(value) {
    return value;
  }
};

export const DEFAULT_RECORD_OPTIONS = {
  adapter: defaultAdapter,
  generateId
};


export const $recordCreator = (options: Partial<RecordOptions> = {}): RecordCreator => {
  const _options = Object.assign({}, DEFAULT_RECORD_OPTIONS, options);
  const createRecord = (value: Object) => {
    if (_options.adapter.isList(value)) {
      return new List(_options.generateId(), map(value, createRecord, _options.adapter), _options, _options.adapter.getCastName(value));
    } else if (value && typeof value === "object") {
      const properties = {};
      _options.adapter.each(value, (item, key) => {
        properties[key] = createRecord(item);
      });
      return new Map(_options.generateId(), properties, _options, _options.adapter.getCastName(value));
    } else {
      const tov = typeof value;
      if (value == null || tov === "string" || tov === "number" || tov === "boolean") {
        return new Primitive(_options.generateId(), value as PrimitiveValue, _options, _options.adapter.getCastName(value));
      }
    }
    throw new Error(`Unsupported primitive ${value}.`);
  };

  return createRecord;
}

export const $deserializeRecord = (item: RecordData, options: RecordOptions) => {
  const {adapter} = options;
  if (item.constructor !== Object) {
    throw new Error(`deserialized object must be vanilla`);
  }
  switch(item.type) {
    case RecordType.PRIMITIVE: {
      return new Primitive(item.id, item.value, options, item.castName);
    }
    case RecordType.MAP: {
      const properties = {};
      for (const key in item.properties) {
        properties[key] = $deserializeRecord(item.properties[key], options);
      }
      return new Map(item.id, properties, options, item.castName);
    }
    case RecordType.LIST: {
      return new List(item.id, item.items.map(value => $deserializeRecord(value, options)), options, item.castName);
    }
  }
}

const $castRecord = (record: RecordData, options: RecordOptions) => {
  return record instanceof BaseRecord ? record.clone() : $deserializeRecord(record, options);
}