import { Observable } from "./observable";
import { Mutation, sortMutations } from "./mutations";
import {CRDTError, TargetNotFoundError} from "./errors";
import {  patchRecord } from "./ot";
import { diff, Adapter as OTDiffAdapter } from "immutable-ot";
import { $recordCreator, Record, RecordData, $deserializeRecord, RecordCreator, defaultAdapter, RecordAdapter } from "./records";
import {Table} from "./table";
import { generateId } from "./utils";

type DocumentData = {} & RecordData;


export class Document<TState> {

  private _snapshot: Table;

  private _mutations: Mutation[];


  /**
   * Creates a new record from a vanilla state value
   */

  private _createRecord: (value: any) => Record;

  /**
   * CRDT mirror of the document state
   */

  private _mirror: Table;

  private _currentState: TState;

  private _adapter: OTDiffAdapter;
  
  updateState(newState: TState): Mutation[] {

    // first capture the operational transforms between the old & new state. Note that we use _currentState
    // since it's usually coming from an external source -- diffing should be faster.
    const ots = diff(this._currentState, newState, { adapter: this._adapter });
    this._currentState = newState;

    const mirrorRecord = this._mirror.getRoot();

    const mutations = [];
    const onMutation = (mutation: Mutation) => mutations.push(mutation);


    // collects mutations as operational transforms are applied to the state mirror record
    mirrorRecord.changeObservable.observe(onMutation);    


    // apply the operational transforms to the mirror record
    patchRecord(mirrorRecord, ots, this._createRecord);
    mirrorRecord.changeObservable.unobserve(onMutation);

    this._mutations.push(...mutations);

    // return the CRDT mutations which can later be used against other documents
    return mutations;
  }
  toJSON(): DocumentData {
    return this._mirror.getRoot().toJSON();
  }
  getState() {
    return this._currentState;
  }
  applyMutations(mutations: Mutation[]) {
    this._mutations = sortMutations(this._mutations.concat(mutations));
    const snapshotMirror = this._mirror.clone();

    const results = [];

    for (const mutation of this._mutations) {
      const target = snapshotMirror.getItem(mutation.targetId);
      if (!target) {
        return new TargetNotFoundError(`target ${mutation.targetId} not found`);
      }
      const result = target.applyMutation(mutation);
      if (result) {
        results.push(result);
      }
    }

    this._mirror = snapshotMirror;

    this._resetCurrentState();

    return results;
  }
  

  clone() {
    return Document.deserialize(this.toJSON());
  }

  constructor(adapter: OTDiffAdapter) {
    this._adapter = adapter;
  }

  private _construct(record: Record, createRecord: RecordCreator) {
    this._createRecord = createRecord;
    this._mutations = [];
    this._snapshot = new Table(record.clone());
    this._mirror = this._snapshot.clone();
    this._resetCurrentState();
  }

  private _resetCurrentState() {
    this._currentState = this._mirror.getRoot().getState();
  }

  /**
   * Returns a new document from vanilla state object. Note that this should happen
   * at the time of `initialState` creation.
   */

  static initialize = <TState>(initialState?: TState, adapter: RecordAdapter = defaultAdapter) => {
    const createRecord = $recordCreator(generateId, adapter);
    const doc = new Document<TState>(adapter);
    doc._construct(createRecord(initialState || {}), createRecord);
    return doc;
  }

  /**
   */

  static deserialize = <TState>(data: DocumentData, adapter: RecordAdapter = defaultAdapter) => {
    const record = $deserializeRecord(data, adapter);
    const doc = new Document<TState>(adapter);
    doc._construct(record, $recordCreator(generateId));
    return doc;
  }
}