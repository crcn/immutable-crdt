import { RecordData } from "./records";

export enum MutationType {
  INSERT = "INSERT",
  APPEND = "APPEND",
  DELETE = "DELETE",
  UPDATE = "UPDATE",
  MAP_SET = "MAP_SET",
};

export type BaseMutation<TType extends MutationType> = {
  type: TType,
  timestamp: number
};

export type Insert = {
  before: string;
  value: RecordData;
} & BaseMutation<MutationType.INSERT>;

export type Append = {
  parent: string;
  value: RecordData;
} & BaseMutation<MutationType.APPEND>;

export type Delete = {
  ref: string;
} & BaseMutation<MutationType.DELETE>;

export type MapSet = {
  ref: string;
  propertyName: string;
  value: RecordData;
} & BaseMutation<MutationType.MAP_SET>;

export type Mutation = Insert | Append | Delete | MapSet;
