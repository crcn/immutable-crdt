import { arraySplice } from "./utils";


type Key = string | number;

export enum OTOperationType {
  INSERT,
  DELETE,
  UPDATE,
  MOVE
};

export type BaseOperation<TType extends OTOperationType> = {
  type: TType
  path: Key[]
};

export type Insert = {
  value: any;
} & BaseOperation<OTOperationType.INSERT>;

export type Delete = {} & BaseOperation<OTOperationType.DELETE>;

export type Update = {
  value: any;
} & BaseOperation<OTOperationType.UPDATE>;

export type Move = {
  newPath: Key[];
} & BaseOperation<OTOperationType.MOVE>;

export type Operation = Insert | Delete | Update | Move;

let _opCount = 0;
let _opSeed = String(Math.round(Math.random() * 9999)) + String(Date.now());

const generateId = () => {
  return `${_opSeed}${_opCount++}`;
};

export const diff = (oldItem: any, newItem: any, path: Key[] = [], operations: Operation[] = []) => {
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

const del = (path: Key[]): Delete => ({ type: OTOperationType.DELETE, path });
const ins = (value: any, path: Key[]): Insert => ({ type: OTOperationType.INSERT, value, path });
const mov = (newPath: Key[], path: Key[]): Move => ({ type: OTOperationType.MOVE, newPath, path });
const upd = (value: any, path: Key[]): Update => ({ type: OTOperationType.UPDATE, value, path });

const diffArray = (oldArray: any[], newArray: any[], path: Key[], operations: Operation[]) => {
  const oldHash = arrayToHash(oldArray);
  const newHash = arrayToHash(newArray);
  const model = oldArray.concat();

  // insert, update, move
  for (let i = 0, {length} = newArray; i < length; i++) {
    const newItem = newArray[i];
    const newItemId = newItem && newItem.id || i;
    const oldItem = oldHash[newItemId];
    const newChildPath = [...path, i];

    if (i >= model.length) {
      operations.push(ins(newItem, newChildPath));
    // does not exist
    } else if (oldItem == null) {
      const replItem = oldArray[i];
      const replItemId = replItem && replItem.id || i;

      // if the item exists, then just insert the new item -- we'll get to it eventually
      if (newHash.hasOwnProperty(replItemId)) {
        model.splice(i, 0, newItem);
      } else {

        // otherwise, remove the item since it doesn't exist
        model.splice(i, 1, newItem);
        operations.push(del(newChildPath));
      }

      operations.push(ins(newItem, newChildPath));

    // exists
    } else {
      const oldIndex = model.indexOf(oldItem);
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

const diffObject = (oldItem: any, newItem: any, path: Key[], operations: Operation[]) => {
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


const arrayToHash = (ary: any) => {
  const hash = {};
  for (let i = 0, {length} = ary; i < length; i++) {
    const item = ary[i];
    hash[item && item.id || i] = item;
  }
  return hash;
}

export const patch2 = (oldItem: any, operations: Operation[]) => operations.reduce((oldItem, operation) => {  
  let parent = oldItem;
  for (let i = 0, n = operation.path.length - 1; i < n; i++) {
    parent = parent[operation.path[i]];
  }

  const property = operation.path[operation.path.length - 1];

  switch(operation.type) {
    case OTOperationType.DELETE: {
      if (typeof property === "number") {
        parent = arraySplice(parent, property, 1);
      } else {
        parent = {...parent};
        delete parent[property];
      }
      break;
    } 
    case OTOperationType.UPDATE: {
      if (typeof property === "number") {
        parent = arraySplice(parent, property, 1, operation.value);
      } else {
        parent = {...parent, [property]: operation.value};
      }
      break;
    }
    case OTOperationType.INSERT: {
      if (typeof property === "number") {
        parent = arraySplice(parent, property, 0, operation.value);
      } else {
        parent = {...parent, [property]: operation.value};
      }
      break;
    }
    case OTOperationType.MOVE: {
      const value = parent[property];
      const newProperty = operation.newPath[operation.newPath.length - 1];
      if (typeof property === "number") {
        parent = arraySplice(parent, property, 1);
        parent = arraySplice(parent, Number(newProperty), 0, value);
      } else {
        parent = {...parent};
        delete parent[property];
        parent[newProperty] = value;
      }
    }
  }

  return updatedNestedValue(oldItem, parent, operation.path.slice(0, operation.path.length - 1), 0);
}, oldItem);

const updatedNestedValue = (ancestor: any, value: any, path: Key[], depth: number) => {
  if (depth === path.length) {
    return value;
  }

  const property = path[depth];

  if (Array.isArray(ancestor)) {
    const index = Number(path[depth]);
    return arraySplice(ancestor, index, 1, updatedNestedValue(ancestor[index], value, path, depth + 1));
  }

  return {
    ...ancestor,
    [property]: updatedNestedValue(ancestor[property], value, path, depth)
  };
};