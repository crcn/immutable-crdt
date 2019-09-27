"use strict";
/**
 * Keeps track of the CRDT model tree & all references within it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const mutations_1 = require("./mutations");
class Table {
    constructor(root) {
        this._onRootChange = (mutation) => {
            switch (mutation.type) {
                case mutations_1.MutationType.DELETE: {
                    const value = this._items[mutation.targetId];
                    if (value != null) {
                        value.traverse(item => {
                            delete this._items[item.id];
                        });
                    }
                    break;
                }
                case mutations_1.MutationType.REPLACE_LIST_ITEM: {
                    this._items[mutation.itemId].traverse(item => {
                        delete this._items[item.id];
                    });
                    mutation.value.traverse(item => {
                        this._items[item.id] = item;
                    });
                    break;
                }
                case mutations_1.MutationType.MAP_UNSET: {
                    const value = this._items[mutation.oldValueId];
                    if (value != null) {
                        value.traverse(item => {
                            delete this._items[item.id];
                        });
                    }
                    break;
                }
                case mutations_1.MutationType.MAP_SET:
                case mutations_1.MutationType.INSERT: {
                    const value = mutation.value;
                    value.traverse(item => {
                        this._items[item.id] = item;
                    });
                    break;
                }
            }
        };
        this._items = {};
        this._root = root;
        this._root.changeObservable.observe(this._onRootChange);
        this._root.traverse((item) => {
            this._items[item.id] = item;
        });
    }
    getItem(id) {
        return this._items[id];
    }
    getRoot() {
        return this._root;
    }
    clone() {
        return new Table(this._root.clone());
    }
}
exports.Table = Table;
//# sourceMappingURL=table.js.map