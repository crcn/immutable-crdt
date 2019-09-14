/**
 */

import { arraySplice } from "./utils";
import { Record, Map, List } from "./records";

type Key = string | number;

enum OTMutationType {
  INSERT,
  DELETE,
  UPDATE,
  MOVE
};

type BaseOTMutation<TType extends OTMutationType> = {
  type: TType
  path: Key[]
};

type Insert = {
  value: any;
} & BaseOTMutation<OTMutationType.INSERT>;

type Delete = {} & BaseOTMutation<OTMutationType.DELETE>;

type Update = {
  value: any;
} & BaseOTMutation<OTMutationType.UPDATE>;

type Move = {
  newPath: Key[];
} & BaseOTMutation<OTMutationType.MOVE>;

export type OTMutation = Insert | Delete | Update | Move;

export const diff = (oldItem: any, newItem: any, path: Key[] = [], operations: OTMutation[] = []) => {
  if (oldItem === newItem) {
    return operations;
  }

  if (typeof oldItem !== typeof newItem || (!oldItem || typeof oldItem !== "object")) {
    if (oldItem !== newItem) {
      operations.push(upd(newItem, path));
    }
  } if (Array.isArray(oldItem)) {
    diffArray(oldItem, newItem, path, operations);
  } else if (typeof oldItem === "object") {
    diffObject(oldItem, newItem, path, operations);
  }

  return operations;
};

const del = (path: Key[]): Delete => ({ type: OTMutationType.DELETE, path });
const ins = (value: any, path: Key[]): Insert => ({ type: OTMutationType.INSERT, value, path });
const mov = (path: Key[], newPath: Key[]): Move => ({ type: OTMutationType.MOVE, newPath, path });
const upd = (value: any, path: Key[]): Update => ({ type: OTMutationType.UPDATE, value, path });

const diffArray = (oldArray: any[], newArray: any[], path: Key[], operations: OTMutation[]) => {
  const model = oldArray.concat();

  let used = {};

  // insert, update, move
  for (let i = 0, n = newArray.length; i < n; i++) {
    const newItem = newArray[i];
    let oldItem;
    for (let j = 0, n2 = oldArray.length; j < n2; j++) {
      if (used[j])  {
        continue;
      }
      const item = oldArray[j];
      if (newItem === item) {
        oldItem = item;
        used[j] = 1;
        break;
      }
    }
    const newChildPath = [...path, i];

    if (i >= model.length) {
      operations.push(ins(newItem, newChildPath));
    // does not exist
    } else if (oldItem == null) {
      const replItem = oldArray[i];

      let existing;
      for (let k = i, n = newArray.length; k < n; k++) {
        const item = newArray[k];
        if (replItem === item) {
          existing = replItem;
          break;
        }
      }

      // if the item exists, then just insert the new item -- we'll get to it eventually
      if (existing) {
        model.splice(i, 0, newItem);
      } else {
        // otherwise, remove the item since it doesn't exist
        model.splice(i, 1, newItem);
        operations.push(del(newChildPath));
      }

      operations.push(ins(newItem, newChildPath));

    // exists
    } else {
      const oldIndex = model.indexOf(oldItem, i);
      if (oldIndex !== i) {
        model.splice(oldIndex, 1);
        model.splice(i, 0, oldItem);
        operations.push(mov([...path, oldIndex], newChildPath));
      }

      diff(oldItem, newItem, newChildPath, operations);
    }
  }

  // delete
  const lastNewArrayIndex = newArray.length;
  for (let j = lastNewArrayIndex, {length} = model; j < length; j++) {
    operations.push(del([...path, lastNewArrayIndex]));
  }

  return operations;
};


const diffObject = (oldItem: any, newItem: any, path: Key[], operations: OTMutation[]) => {
  for (const key in oldItem) {
    if (newItem[key] == null && oldItem[key] != null) {
      operations.push(del([...path, key]));
    } else {
      diff(oldItem[key], newItem[key], [...path, key], operations);
    }
  }

  for (const key in newItem) {
    if (oldItem[key] == null) {
      operations.push(ins(newItem[key], [...path, key]));
    }
  }

  return operations;
};

export const patchRecord = (item: Record, mutations: OTMutation[], createRecord: (value: any) => Record) => {
  for (const mutation of mutations) {
    let parent: Record = item;
    for (let i = 0, n = mutation.path.length - 1; i < n; i++) {
      const pathPart = mutation.path[i];
      if (parent instanceof Map) {
        parent = parent.properties[pathPart];
      } else if (parent instanceof List) {
        parent = parent.items[pathPart];
      }
    }


    const property = mutation.path[mutation.path.length - 1];

    if (parent instanceof List && typeof property === "number") { 
      switch (mutation.type) {
        case OTMutationType.DELETE: {
          parent.removeAt(property);
          break;
        }
        case OTMutationType.UPDATE: {
          parent.removeAt(property);
          parent.insert(property, createRecord(mutation.value));
          break;
        }
        case OTMutationType.INSERT: {
          parent.insert(property, createRecord(mutation.value));
          break;
        }
        case OTMutationType.MOVE: {
          const item = parent.items[property];
          parent.remove(item);
          parent.insert(Number(mutation.newPath[mutation.newPath.length - 1]), item);
          break;
        }
      }
    } else if (parent instanceof Map && typeof property === "string") {
      switch (mutation.type) {
        case OTMutationType.DELETE: {
          parent.removeValue(property);
          break;
        }
        case OTMutationType.INSERT:
        case OTMutationType.UPDATE: {
          parent.setValue(property, createRecord(mutation.value));
          break;
        }
        case OTMutationType.MOVE: {
          const item = parent.getValue(property);
          parent.removeValue(property);
          parent.setValue(String(mutation.newPath[mutation.newPath.length - 1]), item);
          break;
        }
      }
    }
  }
}