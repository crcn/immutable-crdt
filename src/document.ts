import { Observable, ObservableHandler } from "./observable";
import { Mutation } from "./mutations";
import { diff, patchRecord } from "./ot";
import { recordCreator, Record } from "./records";
import {Table} from "./table";

let _documentCount = 0;

export class Document<TState> {
  private _changeObserver = new Observable<Mutation[]>();
  private _currentState: TState;
  private _table: Table;
  private _itemCount: number;
  private _idSeed: string;
  private _createRecord: (value: any) => Record;
  private _root: Record;
  
  constructor(initialState: TState) {
    this._currentState = initialState;
    this._itemCount = 0;
    this._idSeed = String(_documentCount++);
    this._createRecord = recordCreator(this._generateId);
    this._root = this._createRecord(initialState);
    this._table = new Table(this._root);
  }
  onChange(handler: ObservableHandler<Mutation[]>) {
    return this._changeObserver.observe(handler);
  }
  getStateMap() {
    return this._table.getRoot();
  }
  update(newState: TState) {
    const ots = diff(this._currentState, newState);
    patchRecord(this._root, ots, this._createRecord);
    console.log(this._root.toJSON());
  }
  toJSON() {

  }
  getState() {
    return this.getState();
  }
  private _generateId = () => {
    return `${this._idSeed}${++this._itemCount}`;
  }
}