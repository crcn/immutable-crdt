"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const observable_1 = require("./observable");
const mutations_1 = require("./mutations");
const errors_1 = require("./errors");
const immutable_ot_1 = require("immutable-ot");
var RecordType;
(function (RecordType) {
    RecordType["MAP"] = "MAP";
    RecordType["LIST"] = "LIST";
    RecordType["PRIMITIVE"] = "PRIMITIVE";
})(RecordType = exports.RecordType || (exports.RecordType = {}));
class BaseRecord {
    constructor(id, type, _options, castName) {
        this._options = _options;
        this.castName = castName;
        this.changeObservable = new observable_1.Observable();
        this._onChange = () => {
            this._jsonCache = null;
            this._stateCache = null;
        };
        this.id = id;
        this.type = type;
        this.changeObservable.observe(this._onChange);
    }
    getParent() {
        return this.$$parent;
    }
    toJSON() {
        if (this._jsonCache) {
            return this._jsonCache;
        }
        return this._jsonCache = this._toJSON();
    }
    getState() {
        if (this._stateCache) {
            return this._stateCache;
        }
        return this._stateCache = this._getState();
    }
    applyMutation(mutation) {
        switch (mutation.type) {
            case mutations_1.MutationType.DELETE: {
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
    traverse(handler) {
        handler(this);
    }
}
exports.BaseRecord = BaseRecord;
class BaseParent extends BaseRecord {
    linkChild(child) {
        if (child.$$parent === this) {
            throw new Error(`cannot link child to parent twice.`);
        }
        child.$$parent = this;
        if (exports.isParentRecord(child)) {
            child.changeObservable.observe(this.changeObservable.dispatch);
        }
    }
    unlinkChild(child) {
        child.$$parent = this;
        if (exports.isParentRecord(child)) {
            child.changeObservable.unobserve(this.changeObservable.dispatch);
        }
    }
}
exports.isParentRecord = (item) => {
    return item instanceof Map || item instanceof List;
};
class List extends BaseParent {
    constructor(id, items, options, className) {
        super(id, RecordType.LIST, options, className);
        this._items = items;
        for (let i = 0, { length } = this._items; i < length; i++) {
            this.linkChild(this._items[i]);
        }
    }
    get items() {
        return this._items;
    }
    push(item) {
        this.insert(this._items.length, item);
    }
    applyMutation(mutation) {
        super.applyMutation(mutation);
        switch (mutation.type) {
            case mutations_1.MutationType.INSERT: {
                if (mutation.beforeId == null) {
                    this.push($castRecord(mutation.value, this._options));
                    break;
                }
                const beforeIndex = this._items.findIndex(item => item.id === mutation.beforeId);
                // TODO - return conflict if before not found
                this.insert(beforeIndex, $castRecord(mutation.value, this._options));
                break;
            }
            case mutations_1.MutationType.MOVE_LIST_ITEM: {
                const itemIndex = this._items.findIndex(item => item.id === mutation.itemId);
                if (itemIndex === -1) {
                    return new errors_1.TargetNotFoundError(`${mutation.itemId} does not exist`);
                }
                if (mutation.beforeId == null) {
                    this.move(itemIndex, this._items.length);
                    break;
                }
                const beforeIndex = this._items.findIndex(item => item.id === mutation.beforeId);
                if (beforeIndex === -1) {
                    return new errors_1.TargetNotFoundError(`${mutation.beforeId} does not exist`);
                }
                this.move(itemIndex, beforeIndex);
                break;
            }
            case mutations_1.MutationType.REPLACE_LIST_ITEM: {
                const itemIndex = this._items.findIndex(item => item.id === mutation.itemId);
                if (itemIndex === -1) {
                    return new errors_1.TargetNotFoundError(`${mutation.itemId} does not exist`);
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
    insert(index, item) {
        this.linkChild(item);
        const before = this._items[index];
        this._items.splice(index, 0, item);
        if (before) {
            this.changeObservable.dispatch({ id: this._options.generateId(), type: mutations_1.MutationType.INSERT, beforeId: before.id, value: item, targetId: this.id });
        }
        else {
            this.changeObservable.dispatch({ id: this._options.generateId(), type: mutations_1.MutationType.INSERT, beforeId: null, targetId: this.id, value: item, });
        }
    }
    replace(index, item) {
        const oldItem = this._items[index];
        this._items.splice(index, 1, item);
        this.changeObservable.dispatch({ id: this._options.generateId(), type: mutations_1.MutationType.REPLACE_LIST_ITEM, itemId: oldItem.id, targetId: this.id, value: item, });
    }
    indexOf(item) {
        return this._items.indexOf(item);
    }
    remove(item) {
        const index = this._items.findIndex(existing => existing.id === item.id);
        if (index === -1) {
            return;
        }
        this.removeAt(index);
    }
    move(oldIndex, newIndex) {
        const item = this._items[oldIndex];
        const before = this._items[newIndex];
        this._items.splice(oldIndex, 1);
        this._items.splice(newIndex, 0, item);
        this.changeObservable.dispatch({ id: this._options.generateId(), type: mutations_1.MutationType.MOVE_LIST_ITEM, itemId: item.id, targetId: this.id, beforeId: before && before.id, });
    }
    removeAt(index) {
        const item = this._items[index];
        if (!item) {
            return;
        }
        this._items.splice(index, 1);
        this.unlinkChild(item);
        this.changeObservable.dispatch({ id: this._options.generateId(), type: mutations_1.MutationType.DELETE, targetId: item.id });
    }
    traverse(handler) {
        super.traverse(handler);
        this.toJSON();
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
        };
    }
    _getState() {
        return this._options.adapter.castValue(this._items.map(item => item.getState()), this.castName);
    }
}
exports.List = List;
class Map extends BaseParent {
    constructor(id, properties, options, className) {
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
    applyMutation(mutation) {
        super.applyMutation(mutation);
        switch (mutation.type) {
            case mutations_1.MutationType.MAP_SET: {
                this.setValue(mutation.propertyName, $castRecord(mutation.value, this._options));
                break;
            }
            case mutations_1.MutationType.MAP_UNSET: {
                this.removeValue(mutation.propertyName);
                break;
            }
        }
    }
    getKey(value) {
        for (const key in this._properties) {
            if (this._properties[key] === value) {
                return key;
            }
        }
        return null;
    }
    setValue(propertyName, value) {
        if (value) {
            this.linkChild(value);
        }
        const oldItem = this._properties[propertyName];
        if (oldItem) {
            this.unlinkChild(oldItem);
        }
        if (value == null) {
            delete this._properties[propertyName];
            this.changeObservable.dispatch({ id: this._options.generateId(), type: mutations_1.MutationType.MAP_UNSET, oldValueId: oldItem && oldItem.id, targetId: this.id, propertyName, });
        }
        else {
            this._properties[propertyName] = value;
            this.changeObservable.dispatch({ id: this._options.generateId(), type: mutations_1.MutationType.MAP_SET, targetId: this.id, propertyName, value, });
        }
    }
    remove(value) {
        for (const propertyName in this._properties) {
            const item = this._properties[propertyName];
            if (item.id === value.id) {
                this.removeValue(propertyName);
                break;
            }
        }
    }
    removeValue(propertyName) {
        this.setValue(propertyName, undefined);
    }
    traverse(handler) {
        super.traverse(handler);
        for (const key in this._properties) {
            const value = this._properties[key];
            value.traverse(handler);
        }
    }
    getValue(key) {
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
        };
    }
    _getState() {
        const state = {};
        for (const key in this._properties) {
            state[key] = this._properties[key].getState();
        }
        return this._options.adapter.castValue(state, this.castName);
    }
}
exports.Map = Map;
class Primitive extends BaseRecord {
    constructor(id, value, options, className) {
        super(id, RecordType.PRIMITIVE, options, className);
        this._value = value;
    }
    get value() {
        return this._value;
    }
    _clone() {
        return new Primitive(this.id, this._value, this._options, this.castName);
    }
    applyMutation(mutation) {
        super.applyMutation(mutation);
        this.changeObservable.dispatch(mutation);
    }
    _toJSON() {
        return {
            id: this.id,
            type: this.type,
            value: this._value,
            castName: this.castName,
        };
    }
    _getState() {
        return this._options.adapter.castValue(this.value, this.castName);
    }
}
exports.Primitive = Primitive;
const map = (list, mapper, adapter) => {
    const newItems = [];
    adapter.each(list, (value) => newItems.push(mapper(value)));
    return newItems;
};
exports.defaultAdapter = Object.assign(Object.assign({}, immutable_ot_1.defaultAdapter), { getCastName(value) {
        return value == null ? null : value.constructor.name;
    },
    castValue(value) {
        return value;
    } });
exports.DEFAULT_RECORD_OPTIONS = {
    adapter: exports.defaultAdapter,
    generateId: utils_1.generateId
};
exports.$recordCreator = (options = {}) => {
    const _options = Object.assign({}, exports.DEFAULT_RECORD_OPTIONS, options);
    const createRecord = (value) => {
        if (_options.adapter.isList(value)) {
            return new List(_options.generateId(), map(value, createRecord, _options.adapter), _options, _options.adapter.getCastName(value));
        }
        else if (value && typeof value === "object") {
            const properties = {};
            _options.adapter.each(value, (item, key) => {
                properties[key] = createRecord(item);
            });
            return new Map(_options.generateId(), properties, _options, _options.adapter.getCastName(value));
        }
        else {
            const tov = typeof value;
            if (value == null || tov === "string" || tov === "number" || tov === "boolean") {
                return new Primitive(_options.generateId(), value, _options, _options.adapter.getCastName(value));
            }
        }
        throw new Error(`Unsupported primitive ${value}.`);
    };
    return createRecord;
};
exports.$deserializeRecord = (item, options) => {
    const { adapter } = options;
    if (item.constructor !== Object) {
        throw new Error(`deserialized object must be vanilla`);
    }
    switch (item.type) {
        case RecordType.PRIMITIVE: {
            return new Primitive(item.id, item.value, options, item.castName);
        }
        case RecordType.MAP: {
            const properties = {};
            for (const key in item.properties) {
                properties[key] = exports.$deserializeRecord(item.properties[key], options);
            }
            return new Map(item.id, properties, options, item.castName);
        }
        case RecordType.LIST: {
            return new List(item.id, item.items.map(value => exports.$deserializeRecord(value, options)), options, item.castName);
        }
    }
};
const $castRecord = (record, options) => {
    return record instanceof BaseRecord ? record.clone() : exports.$deserializeRecord(record, options);
};
//# sourceMappingURL=records.js.map