"use strict";
/**
 * Keeps track of the CRDT model tree & all references within it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var mutations_1 = require("./mutations");
var Table = /** @class */ (function () {
    function Table(root) {
        var _this = this;
        this._onRootChange = function (mutation) {
            switch (mutation.type) {
                case mutations_1.MutationType.DELETE: {
                    delete _this._items[mutation.target];
                    break;
                }
                case mutations_1.MutationType.MAP_SET:
                case mutations_1.MutationType.APPEND:
                case mutations_1.MutationType.INSERT: {
                    _this._items[mutation.value.id] = mutation.value;
                    break;
                }
            }
        };
        this._items = {};
        this._root = root;
        this._root.changeObservable.observe(this._onRootChange);
        this._root.traverse(function (item) {
            _this._items[item.id] = item;
        });
    }
    Table.prototype.getItem = function (id) {
        return this._items[id];
    };
    Table.prototype.getRoot = function () {
        return this._root;
    };
    return Table;
}());
exports.Table = Table;
//# sourceMappingURL=table.js.map