import { Observable } from "./observable";
import { Mutation } from "./mutations";
import { diff, patchRecord } from "./ot";
import { $recordCreator, Record, RecordData, $deserializeRecord, RecordCreator } from "./records";
import {Table} from "./table";

type DocumentData = {} & RecordData;


export class Document<TState> {

  /**
   * Maintains an ID reference of each record for quick access
   * when updates happen.
   */

  private _table: Table;

  /**
   * Creates a new record from a vanilla state value
   */

  private _createRecord: (value: any) => Record;

  /**
   * CRDT mirror of the document state
   */

  private _mirror: Record;
  
  updateState(newState: TState) {

    // first capture the operational transforms between the old & new state
    
    const ots = diff(this._mirror.getState(), newState);
    const mutations = [];
    const onMutation = (mutation: Mutation) => mutations.push(mutation);

    // collects mutations as operational transforms are applied to the state mirror record
    this._mirror.changeObservable.observe(onMutation);    

    // apply the operational transforms to the mirror record
    patchRecord(this._mirror, ots, this._createRecord);
    this._mirror.changeObservable.unobserve(onMutation);

    // return the CRDT mutations which can later be used against other documents
    return mutations;
  }
  toJSON(): DocumentData {
    return this._mirror.toJSON();
  }
  getState() {
    return this._mirror.getState();
  }
  applyMutation(mutation: Mutation) {
    this._table.getItem(mutation.target).applyMutation(mutation);
  }
  applyMutations(mutations: Mutation[]) {
    mutations.forEach(mutation => this.applyMutation(mutation));
  }
  private _construct(record: Record, createRecord: RecordCreator) {
    this._createRecord = createRecord;
    this._mirror = record;
    this._table = new Table(this._mirror);
  }

  /**
   * Returns a new document from vanilla state object. Note that this should happen
   * at the time of `initialState` creation.
   */

  static initialize = <TState>(initialState?: TState) => {
    const createRecord = $recordCreator(generateId);
    const doc = new Document<TState>();
    doc._construct(createRecord(initialState || {}), createRecord);
    return doc;
  }

  /**
   * 
   */

  static deserialize = <TState>(data: DocumentData) => {
    const record = $deserializeRecord(data);
    const doc = new Document<TState>();
    doc._construct(record, $recordCreator(generateId));
    return doc;
  }
}

const seed = `${Math.round(Math.random() * 9999)}`;
let _idCount = 0;

const generateId = () => {
  return `${seed}${++_idCount}`;
}