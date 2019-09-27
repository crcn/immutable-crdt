import { RecordData } from "./records";
import { getIDParts } from "./utils";

export enum MutationType {
  INSERT = "INSERT",
  DELETE = "DELETE",
  REPLACE_LIST_ITEM = "REPLACE_LIST_ITEM",
  MOVE_LIST_ITEM = "MOVE_LIST_ITEM",
  MAP_SET = "MAP_SET",
  MAP_UNSET = "MAP_UNSET",
};

export type BaseMutation<TType extends MutationType> = {
  id: string;
  type: TType,
  targetId: string
};

export type Insert = {
  beforeId: string;
  value: RecordData;
} & BaseMutation<MutationType.INSERT>;

export type ReplaceListItem = {
  itemId: string;
  value: RecordData;
} & BaseMutation<MutationType.REPLACE_LIST_ITEM>;

export type MoveListItem = {
  itemId: string;
  beforeId: string;
} & BaseMutation<MutationType.MOVE_LIST_ITEM>;


export type Delete = BaseMutation<MutationType.DELETE>;

export type MapSet = {
  propertyName: string;
  value: RecordData;
} & BaseMutation<MutationType.MAP_SET>;

export type MapUnset = {
  oldValueId: string;
  propertyName: string;
} & BaseMutation<MutationType.MAP_UNSET>;

export type Mutation = Insert | Delete | MapSet | MapUnset | ReplaceListItem | MoveListItem;

export const sortMutations = (mutations: Mutation[]) => {
  return [...mutations].sort((a, b) => {
    const aParts = getIDParts(a.id);
    const bParts = getIDParts(b.id);

    if (aParts.timestamp !== bParts.timestamp) {
      return aParts.timestamp > bParts.timestamp ? 1 : -1;
    }

    if (aParts.counter !== bParts.counter) {
      return aParts.counter > bParts.counter ? 1 : -1;
    }

    return aParts.machineID + aParts.processID > bParts.machineID + bParts.processID ? 1 : -1;
  })
};