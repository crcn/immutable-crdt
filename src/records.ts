import { KeyValue, generateId } from "./utils";
import { Observable } from "./observable";
import { Mutation, MutationType, Insert, MoveListItem } from "./mutations";
import { TargetNotFoundError } from "./errors";

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
      this.linkChild(this._items[i]);
    }
  }
  get items() {
    return this._items;
  }
  push(item: Record) {
    this.insert(this._items.length, item);
  }
  applyMutation(mutation: Mutation) {
    super.applyMutation(mutation);
    switch(mutation.type) {
      case MutationType.INSERT: {
        if (mutation.beforeId == null) {
          this.push($castRecord(mutation.value));
          break;
        }

        const beforeIndex = this._items.findIndex(item => item.id === mutation.beforeId);
        // TODO - return conflict if before not found
        this.insert(beforeIndex, $castRecord(mutation.value));
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
        this.replace(itemIndex, $castRecord(mutation.value));
        break;
      }
    }
  }
  _clone() {
    return new List(this.id, this._items.map(item => {
      return item.clone();
    }));
  }
  insert(index: number, item: Record) {
    this.linkChild(item);
    const before = this._items[index];
    this._items.splice(index, 0, item);

    if (before) {
      this.changeObservable.dispatch({ id: generateId(), type: MutationType.INSERT, beforeId: before.id, value: item,  targetId: this.id });
    } else {
      this.changeObservable.dispatch({  id: generateId(), type: MutationType.INSERT, beforeId: null, targetId: this.id, value: item,  });
    }
  }
  replace(index: number, item: Record) {
    const oldItem = this._items[index];
    this._items.splice(index, 1, item);
    this.changeObservable.dispatch({  id: generateId(), type: MutationType.REPLACE_LIST_ITEM, itemId: oldItem.id, targetId: this.id, value: item,  });
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
    this.changeObservable.dispatch({  id: generateId(), type: MutationType.MOVE_LIST_ITEM, itemId: item.id, targetId: this.id, beforeId: before && before.id,  });
  }
  removeAt(index: number) {
    const item = this._items[index];
    if (!item) {
      return;
    }
    this._items.splice(index, 1);
    this.unlinkChild(item);
    this.changeObservable.dispatch({ id: generateId(),  type: MutationType.DELETE, targetId: item.id });
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
      this.linkChild(this._properties[key]);
    }
  }
  get properties() {
    return this._properties;
  }
  _clone() {
    const clonedProperties = {};
    for (const key in this._properties) {
      clonedProperties[key] = this._properties[key];
    }
    return new Map(this.id, clonedProperties);
  }
  applyMutation(mutation: Mutation) {
    super.applyMutation(mutation);
    switch(mutation.type) {
      case MutationType.MAP_SET: {
        this.setValue(mutation.propertyName, $castRecord(mutation.value));
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
      this.changeObservable.dispatch({  id: generateId(), type: MutationType.MAP_UNSET, oldValueId: oldItem && oldItem.id,  targetId: this.id, propertyName,  });
    } else {
      this._properties[propertyName] = value;
      this.changeObservable.dispatch({  id: generateId(), type: MutationType.MAP_SET, targetId: this.id, propertyName, value,  });
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
  _clone() {
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
  return record instanceof BaseRecord ? record.clone() : $deserializeRecord(record);
}