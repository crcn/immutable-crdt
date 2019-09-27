/**
 * Keeps track of the CRDT model tree & all references within it.
 */

import {KeyValue} from "./utils";
import {Record} from "./records";
import {Mutation, MutationType} from "./mutations";

export class Table {
  private _items: KeyValue<Record>;
  private _root: Record;
  constructor(root: Record) {
    this._items = {};
    this._root = root;
    this._root.changeObservable.observe(this._onRootChange);
    this._root.traverse((item) => {
      this._items[item.id] = item as Record;
    });
  }
  getItem(id: string): Record {
    return this._items[id];
  }
  getRoot() {
    return this._root;
  }
  clone() {
    return new Table(this._root.clone());
  }
  private _onRootChange = (mutation: Mutation) => {
    switch(mutation.type) {
      case MutationType.DELETE: {
        const value = this._items[mutation.targetId];
        if (value != null) {
          value.traverse(item => {
            delete this._items[item.id];
          });
        }
        break;
      }
      case MutationType.REPLACE_LIST_ITEM: {
        this._items[mutation.itemId].traverse(item => {
          delete this._items[item.id];
        });
        (mutation.value as Record).traverse(item => {
          this._items[item.id] = item as Record;
        });
        break;
      }
      case MutationType.MAP_UNSET: {
        const value = this._items[mutation.oldValueId];
        if (value != null) {
          value.traverse(item => {
            delete this._items[item.id];
          });
        }
        break;
      }
      case MutationType.MAP_SET:
      case MutationType.INSERT: {
        const value = mutation.value as Record;
        value.traverse(item => {
          this._items[item.id] = item as Record;
        });
        break;
      }
    }
  };
}
