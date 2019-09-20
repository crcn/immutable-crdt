import { RecordData } from "./records";

export enum MutationType {
  INSERT = "INSERT",
  APPEND = "APPEND",
  DELETE = "DELETE",
  REPLACE_LIST_ITEM = "REPLACE_LIST_ITEM",
  MOVE_LIST_ITEM = "MOVE_LIST_ITEM",
  MAP_SET = "MAP_SET",
};

export type BaseMutation<TType extends MutationType> = {
  id: string;
  type: TType,
  targetId: string,
  timestamp: number
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

export type Mutation = Insert | Delete | MapSet | ReplaceListItem | MoveListItem;

export const sortMutations = (mutations: Mutation[]) => {
  return [...mutations].sort((a, b) => {
    if (a.timestamp > b.timestamp) {
      return 1;

    // unlikely, but 
    } else if (a.timestamp === b.timestamp) {
      return a.id > b.id ? 1 : -1;
    } 
    return -1;
  })
};