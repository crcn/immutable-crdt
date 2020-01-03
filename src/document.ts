
import { Mutation, sortMutations } from "./mutations";
import {TargetNotFoundError} from "./errors";
import {  patchRecord } from "./ot";
import { diff, Adapter as OTDiffAdapter } from "immutable-ot";
import { $recordCreator, Record, RecordData, $deserializeRecord, RecordCreator, defaultAdapter, RecordAdapter, RecordOptions, DEFAULT_RECORD_OPTIONS } from "./records";
import {Table} from "./table";
import { generateId } from "./utils";

type DocumentData = {} & RecordData;

type InitializeOptions = {
  adapter?: RecordAdapter,
  generateId?: typeof generateId
};


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


  private _options: RecordOptions;
  
  updateState(newState: TState): Mutation[] {

    const mirrorRecord = this._mirror.getRoot();

    // first capture the operational transforms between the old & new state. Note that we use _currentState
    // since it's usually coming from an external source -- diffing should be faster.
    const ots = diff(mirrorRecord.getState(), newState, { adapter: this._options.adapter });


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
    const snapshot = this._snapshot.clone();

    const results = [];

    for (const mutation of this._mutations) {
      const target = snapshot.getItem(mutation.targetId);
      if (!target) {
        results.push(new TargetNotFoundError(`target ${mutation.targetId} not found`));
      } else {
        const result = target.applyMutation(mutation);
        if (result) {
          results.push(result);
        }
      }
    }

    this._mirror = snapshot;
    return results;
  }
  

  clone() {
    return Document.deserialize(this.toJSON(), this._options);
  }

  constructor(options: RecordOptions) {
    this._options = options;
  }

  private _construct(record: Record, createRecord: RecordCreator) {
    this._createRecord = createRecord;
    this._mutations = [];
    this._snapshot = new Table(record.clone());
    this._mirror = this._snapshot.clone();
  }

  getRecord(id: string) {
    return this._snapshot.getItem(id);
  }


  /**
   * Returns a new document from vanilla state object. Note that this should happen
   * at the time of `initialState` creation.
   */

  static initialize = <TState>(initialState?: TState, options?: Partial<RecordOptions>) => {
    const _options = Object.assign({}, DEFAULT_RECORD_OPTIONS, options);
    const createRecord = $recordCreator(options);
    const doc = new Document<TState>(_options);
    doc._construct(createRecord(initialState || {}), createRecord);
    return doc;
  }

  /**
   */

  static deserialize = <TState>(data: DocumentData, options?: Partial<RecordOptions>) => {
    const _options = Object.assign({}, DEFAULT_RECORD_OPTIONS, options);
    const record = $deserializeRecord(data, _options);
    const doc = new Document<TState>(_options);
    doc._construct(record, $recordCreator(options));
    return doc;
  }
}