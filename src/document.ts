import { Observable, ObservableHandler } from "./observable";
import { CRDTMutation } from "./crdt";
import { diff } from "./ot";
import { Table, crdtItemCreator } from "./items";

let _documentCount = 0;

export class Document<TState> {
  private _changeObserver = new Observable<CRDTMutation[]>();
  private _currentState: TState;
  private _table: Table;
  private _itemCount: number = 0;
  private _idSeed: string = String(_documentCount++);
  
  constructor(initialState: TState) {
    this._currentState = initialState;
    this._table = new Table(crdtItemCreator(this._generateId)(initialState));
  }
  onChange(handler: ObservableHandler<CRDTMutation[]>) {
    return this._changeObserver.observe(handler);
  }
  getStateMap() {
    return this._table.getRoot();
  }
  update(newState: TState) {
    const ots = diff(this._currentState, newState);
    // TODO - apply OTs to 
    // TODO - return mutations
  }
  getState() {
    return this.getState();
  }
  private _generateId = () => {
    return `${this._idSeed}${++this._itemCount}`;
  }
}