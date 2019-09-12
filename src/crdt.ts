import { BaseItemShape } from "./items";

export enum CRDTMutationType {
  INSERT = "INSERT",
  APPEND = "APPEND",
  DELETE = "DELETE",
  UPDATE = "UPDATE",
  MAP_SET = "MAP_SET",
};

export type BaseCRDTMutation<TType extends CRDTMutationType> = {
  type: TType
};

export type Insert = {
  before: string;
  value: BaseItemShape;
} & BaseCRDTMutation<CRDTMutationType.INSERT>;

export type Append = {
  parent: string;
  value: BaseItemShape;
} & BaseCRDTMutation<CRDTMutationType.APPEND>;

export type Delete = {
  ref: string;
} & BaseCRDTMutation<CRDTMutationType.DELETE>;

export type MapSet = {
  ref: string;
  propertyName: string;
  value: BaseItemShape;
} & BaseCRDTMutation<CRDTMutationType.MAP_SET>;

export type CRDTMutation = Insert | Append | Delete | MapSet;
