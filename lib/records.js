"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var observable_1 = require("./observable");
var mutations_1 = require("./mutations");
var errors_1 = require("./errors");
var RecordType;
(function (RecordType) {
    RecordType["MAP"] = "MAP";
    RecordType["LIST"] = "LIST";
    RecordType["PRIMITIVE"] = "PRIMITIVE";
})(RecordType = exports.RecordType || (exports.RecordType = {}));
var BaseRecord = /** @class */ (function () {
    function BaseRecord(id, type) {
        var _this = this;
        this.changeObservable = new observable_1.Observable();
        this._onChange = function () {
            _this._jsonCache = null;
            _this._stateCache = null;
        };
        this.id = id;
        this.type = type;
        this.changeObservable.observe(this._onChange);
    }
    BaseRecord.prototype.getParent = function () {
        return this.$$parent;
    };
    BaseRecord.prototype.toJSON = function () {
        if (this._jsonCache) {
            return this._jsonCache;
        }
        return this._jsonCache = this._toJSON();
    };
    BaseRecord.prototype.getState = function () {
        if (this._stateCache) {
            return this._stateCache;
        }
        return this._stateCache = this._getState();
    };
    BaseRecord.prototype.applyMutation = function (mutation) {
        switch (mutation.type) {
            case mutations_1.MutationType.DELETE: {
                this.$$parent.remove(this);
                break;
            }
        }
    };
    BaseRecord.prototype.clone = function () {
        var clone = this._clone();
        clone._jsonCache = this._jsonCache;
        clone._stateCache = this._stateCache;
        return clone;
    };
    BaseRecord.prototype.traverse = function (handler) {
        handler(this);
    };
    return BaseRecord;
}());
exports.BaseRecord = BaseRecord;
var BaseParent = /** @class */ (function (_super) {
    __extends(BaseParent, _super);
    function BaseParent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BaseParent.prototype.linkChild = function (child) {
        if (child.$$parent === this) {
            throw new Error("cannot link child to parent twice.");
        }
        child.$$parent = this;
        if (exports.isParentRecord(child)) {
            child.changeObservable.observe(this.changeObservable.dispatch);
        }
    };
    BaseParent.prototype.unlinkChild = function (child) {
        child.$$parent = this;
        if (exports.isParentRecord(child)) {
            child.changeObservable.unobserve(this.changeObservable.dispatch);
        }
    };
    return BaseParent;
}(BaseRecord));
exports.isParentRecord = function (item) {
    return item instanceof Map || item instanceof List;
};
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List(id, items) {
        var _this = _super.call(this, id, RecordType.LIST) || this;
        _this._items = items;
        for (var i = 0, length_1 = _this._items.length; i < length_1; i++) {
            _this.linkChild(_this._items[i]);
        }
        return _this;
    }
    Object.defineProperty(List.prototype, "items", {
        get: function () {
            return this._items;
        },
        enumerable: true,
        configurable: true
    });
    List.prototype.push = function (item) {
        this.insert(this._items.length, item);
    };
    List.prototype.applyMutation = function (mutation) {
        _super.prototype.applyMutation.call(this, mutation);
        switch (mutation.type) {
            case mutations_1.MutationType.INSERT: {
                if (mutation.beforeId == null) {
                    this.push($castRecord(mutation.value));
                    break;
                }
                var beforeIndex = this._items.findIndex(function (item) { return item.id === mutation.beforeId; });
                // TODO - return conflict if before not found
                this.insert(beforeIndex, $castRecord(mutation.value));
                break;
            }
            case mutations_1.MutationType.MOVE_LIST_ITEM: {
                var itemIndex = this._items.findIndex(function (item) { return item.id === mutation.itemId; });
                if (itemIndex === -1) {
                    return new errors_1.TargetNotFoundError(mutation.itemId + " does not exist");
                }
                if (mutation.beforeId == null) {
                    this.move(itemIndex, this._items.length);
                    break;
                }
                var beforeIndex = this._items.findIndex(function (item) { return item.id === mutation.beforeId; });
                if (beforeIndex === -1) {
                    return new errors_1.TargetNotFoundError(mutation.beforeId + " does not exist");
                }
                this.move(itemIndex, beforeIndex);
                break;
            }
            case mutations_1.MutationType.REPLACE_LIST_ITEM: {
                var itemIndex = this._items.findIndex(function (item) { return item.id === mutation.itemId; });
                if (itemIndex === -1) {
                    return new errors_1.TargetNotFoundError(mutation.itemId + " does not exist");
                }
                this.replace(itemIndex, $castRecord(mutation.value));
                break;
            }
        }
    };
    List.prototype._clone = function () {
        return new List(this.id, this._items.map(function (item) {
            return item.clone();
        }));
    };
    List.prototype.insert = function (index, item) {
        this.linkChild(item);
        var before = this._items[index];
        this._items.splice(index, 0, item);
        if (before) {
            this.changeObservable.dispatch({ id: utils_1.generateId(), type: mutations_1.MutationType.INSERT, beforeId: before.id, value: item, targetId: this.id });
        }
        else {
            this.changeObservable.dispatch({ id: utils_1.generateId(), type: mutations_1.MutationType.INSERT, beforeId: null, targetId: this.id, value: item, });
        }
    };
    List.prototype.replace = function (index, item) {
        var oldItem = this._items[index];
        this._items.splice(index, 1, item);
        this.changeObservable.dispatch({ id: utils_1.generateId(), type: mutations_1.MutationType.REPLACE_LIST_ITEM, itemId: oldItem.id, targetId: this.id, value: item, });
    };
    List.prototype.indexOf = function (item) {
        return this._items.indexOf(item);
    };
    List.prototype.remove = function (item) {
        var index = this._items.findIndex(function (existing) { return existing.id === item.id; });
        if (index === -1) {
            return;
        }
        this.removeAt(index);
    };
    List.prototype.move = function (oldIndex, newIndex) {
        var item = this._items[oldIndex];
        var before = this._items[newIndex];
        this._items.splice(oldIndex, 1);
        this._items.splice(newIndex, 0, item);
        this.changeObservable.dispatch({ id: utils_1.generateId(), type: mutations_1.MutationType.MOVE_LIST_ITEM, itemId: item.id, targetId: this.id, beforeId: before && before.id, });
    };
    List.prototype.removeAt = function (index) {
        var item = this._items[index];
        if (!item) {
            return;
        }
        this._items.splice(index, 1);
        this.unlinkChild(item);
        this.changeObservable.dispatch({ id: utils_1.generateId(), type: mutations_1.MutationType.DELETE, targetId: item.id });
    };
    List.prototype.traverse = function (handler) {
        _super.prototype.traverse.call(this, handler);
        this.toJSON();
        for (var _i = 0, _a = this._items; _i < _a.length; _i++) {
            var item = _a[_i];
            item.traverse(handler);
        }
    };
    List.prototype._toJSON = function () {
        return {
            id: this.id,
            type: this.type,
            items: this._items.map(function (item) { return item.toJSON(); })
        };
    };
    List.prototype._getState = function () {
        return this._items.map(function (item) { return item.getState(); });
    };
    return List;
}(BaseParent));
exports.List = List;
var Map = /** @class */ (function (_super) {
    __extends(Map, _super);
    function Map(id, properties) {
        var _this = _super.call(this, id, RecordType.MAP) || this;
        _this._properties = properties;
        for (var key in _this._properties) {
            _this.linkChild(_this._properties[key]);
        }
        return _this;
    }
    Object.defineProperty(Map.prototype, "properties", {
        get: function () {
            return this._properties;
        },
        enumerable: true,
        configurable: true
    });
    Map.prototype._clone = function () {
        var clonedProperties = {};
        for (var key in this._properties) {
            clonedProperties[key] = this._properties[key];
        }
        return new Map(this.id, clonedProperties);
    };
    Map.prototype.applyMutation = function (mutation) {
        _super.prototype.applyMutation.call(this, mutation);
        switch (mutation.type) {
            case mutations_1.MutationType.MAP_SET: {
                this.setValue(mutation.propertyName, $castRecord(mutation.value));
                break;
            }
            case mutations_1.MutationType.MAP_UNSET: {
                this.removeValue(mutation.propertyName);
                break;
            }
        }
    };
    Map.prototype.getKey = function (value) {
        for (var key in this._properties) {
            if (this._properties[key] === value) {
                return key;
            }
        }
        return null;
    };
    Map.prototype.setValue = function (propertyName, value) {
        if (value) {
            this.linkChild(value);
        }
        var oldItem = this._properties[propertyName];
        if (oldItem) {
            this.unlinkChild(oldItem);
        }
        if (value == null) {
            delete this._properties[propertyName];
            this.changeObservable.dispatch({ id: utils_1.generateId(), type: mutations_1.MutationType.MAP_UNSET, oldValueId: oldItem && oldItem.id, targetId: this.id, propertyName: propertyName, });
        }
        else {
            this._properties[propertyName] = value;
            this.changeObservable.dispatch({ id: utils_1.generateId(), type: mutations_1.MutationType.MAP_SET, targetId: this.id, propertyName: propertyName, value: value, });
        }
    };
    Map.prototype.remove = function (value) {
        for (var propertyName in this._properties) {
            var item = this._properties[propertyName];
            if (item.id === value.id) {
                this.removeValue(propertyName);
                break;
            }
        }
    };
    Map.prototype.removeValue = function (propertyName) {
        this.setValue(propertyName, undefined);
    };
    Map.prototype.traverse = function (handler) {
        _super.prototype.traverse.call(this, handler);
        for (var key in this._properties) {
            var value = this._properties[key];
            value.traverse(handler);
        }
    };
    Map.prototype.getValue = function (key) {
        return this._properties[key];
    };
    Map.prototype._toJSON = function () {
        var properties = {};
        for (var key in this._properties) {
            properties[key] = this._properties[key].toJSON();
        }
        return {
            id: this.id,
            type: this.type,
            properties: properties,
        };
    };
    Map.prototype._getState = function () {
        var state = {};
        for (var key in this._properties) {
            state[key] = this._properties[key].getState();
        }
        return state;
    };
    return Map;
}(BaseParent));
exports.Map = Map;
var Primitive = /** @class */ (function (_super) {
    __extends(Primitive, _super);
    function Primitive(id, value) {
        var _this = _super.call(this, id, RecordType.PRIMITIVE) || this;
        _this._value = value;
        return _this;
    }
    Object.defineProperty(Primitive.prototype, "value", {
        get: function () {
            return this._value;
        },
        enumerable: true,
        configurable: true
    });
    Primitive.prototype._clone = function () {
        return new Primitive(this.id, this._value);
    };
    Primitive.prototype.applyMutation = function (mutation) {
        _super.prototype.applyMutation.call(this, mutation);
        this.changeObservable.dispatch(mutation);
    };
    Primitive.prototype._toJSON = function () {
        return {
            id: this.id,
            type: this.type,
            value: this._value
        };
    };
    Primitive.prototype._getState = function () {
        return this.value;
    };
    return Primitive;
}(BaseRecord));
exports.Primitive = Primitive;
exports.$recordCreator = function (generateId) {
    var createRecord = function (value) {
        if (Array.isArray(value)) {
            return new List(generateId(), value.map(createRecord));
        }
        else if (value && typeof value === "object") {
            if (value.constructor !== Object) {
                throw new Error("Unable to use " + value.constructor.name + " in CRDT document. value must only extend Object, Array, String, Boolean, or Number.");
            }
            var properties = {};
            for (var key in value) {
                properties[key] = createRecord(value[key]);
            }
            return new Map(generateId(), properties);
        }
        else {
            var tov = typeof value;
            if (!tov || tov === "string" || tov === "number" || tov === "boolean") {
                return new Primitive(generateId(), value);
            }
        }
        throw new Error("Unsupported primitive " + value + ".");
    };
    return createRecord;
};
exports.$deserializeRecord = function (item) {
    if (item.constructor !== Object) {
        throw new Error("deserialized object must be vanilla");
    }
    switch (item.type) {
        case RecordType.PRIMITIVE: {
            return new Primitive(item.id, item.value);
        }
        case RecordType.MAP: {
            var properties = {};
            for (var key in item.properties) {
                properties[key] = exports.$deserializeRecord(item.properties[key]);
            }
            return new Map(item.id, properties);
        }
        case RecordType.LIST: {
            return new List(item.id, item.items.map(exports.$deserializeRecord));
        }
    }
};
var $castRecord = function (record) {
    return record instanceof BaseRecord ? record.clone() : exports.$deserializeRecord(record);
};
//# sourceMappingURL=records.js.map