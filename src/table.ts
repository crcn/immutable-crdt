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
        delete this._items[mutation.targetId];
        break;
      }

      case MutationType.REPLACE_LIST_ITEM: {
        delete this._items[mutation.itemId];
        this._items[mutation.value.id] = mutation.value as Record;
        break;
      }
      case MutationType.MAP_UNSET: {
        
        delete this._items[mutation.oldValueId];
        break;
      }
      case MutationType.MAP_SET:
      case MutationType.INSERT: {
        if (mutation.value == null) {
          delete this._items[mutation.value.id];
        } else {
          this._items[mutation.value.id] = mutation.value as Record;
        }
        break;
      }
    }
  };
}
