
import {Mutation as OTMutation, MutationType as OTMutationType, replace} from "immutable-ot";
import { Record, List, Map } from "./records";

export const patchRecord = (root: Record, mutations: OTMutation[], createRecord: (value: any) => Record) => {
  for (const mutation of mutations) {
    let target: Record = root;
    for (let i = 0, n = mutation.path.length; i < n; i++) {
      const pathPart = mutation.path[i];
      if (target instanceof Map) {
        target = target.properties[pathPart];
      } else if (target instanceof List) {
        target = target.items[pathPart];
      }
    }

    if (mutation.type === OTMutationType.REPLACE) {
      const parent = target.$$parent;
      const replacement = createRecord(mutation.value);
      if (parent instanceof List) {
        parent.replace(parent.indexOf(target), replacement);
      } else if (parent instanceof Map) {
        parent.setValue(parent.getKey(target), replacement);
      }
    }

    if (target instanceof List) { 
      switch (mutation.type) {
        case OTMutationType.REMOVE: {
          target.removeAt(mutation.index);
          break;
        }
        case OTMutationType.INSERT: {
          target.insert(mutation.index, createRecord(mutation.value));
          break;
        }
        case OTMutationType.MOVE: {
          target.move(mutation.oldIndex, mutation.newIndex);
          break;
        }
      }
    } else if (target instanceof Map) {
      switch (mutation.type) {
        case OTMutationType.SET: {
          target.setValue(mutation.propertyName, createRecord(mutation.value));
          break;
        }
        case OTMutationType.UNSET: {
          target.removeValue(mutation.propertyName);
          break;
        }
      }
    }
  }

}