import { Observable } from "./observable";
import { Mutation, sortMutations } from "./mutations";
import {CRDTError, TargetNotFoundError} from "./errors";
import {  patchRecord } from "./ot";
import { diff } from "immutable-ot";
import { $recordCreator, Record, RecordData, $deserializeRecord, RecordCreator } from "./records";
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
  
  updateState(newState: TState): Mutation[] {

    const mirrorRecord = this._mirror.getRoot();

    // first capture the operational transforms between the old & new state
    const ots = diff(mirrorRecord.getState(), newState);
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
    return this._mirror.getRoot().getState();
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

    return results;
  }

  clone() {
    return Document.deserialize(this.toJSON());
  }
  private _construct(record: Record, createRecord: RecordCreator) {
    this._createRecord = createRecord;
    this._mutations = [];
    this._snapshot = new Table(record.clone());
    this._mirror = this._snapshot.clone();
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
   */

  static deserialize = <TState>(data: DocumentData) => {
    const record = $deserializeRecord(data);
    const doc = new Document<TState>();
    doc._construct(record, $recordCreator(generateId));
    return doc;
  }
}