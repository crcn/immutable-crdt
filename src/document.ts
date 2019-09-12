import { Observable, ObservableHandler } from "./observable";
import { CRDTMutation } from "./crdt";
import { diff } from "./ot";
import { Table, crdtItemCreator } from "./items";

let _documentCount = 0;

export class Document<TState> {
  _changeObserver = new Observable<CRDTMutation[]>();
  _currentState: TState;
  _table: Table;
  _itemCount: number = 0;
  _idSeed: string = String(_documentCount++);
  
  constructor(initialState: TState) {
    this._currentState = initialState;
    this._table = new Table(crdtItemCreator(this._generateId)(initialState));
  }
  onChange(handler: ObservableHandler<CRDTMutation[]>) {
    return this._changeObserver.observe(handler);
  }
  update(newState: TState) {
    const ots = diff(this._currentState, newState);
    // TODO - apply OTs to 
    // TODO - return mutations
  }
  getState() {
    return this.getState();
  }
  _generateId = () => {
    return `${this._idSeed}${++this._itemCount}`;
  }
}