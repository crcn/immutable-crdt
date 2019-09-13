import { Observable } from "./observable";
import { Mutation } from "./mutations";
import { diff, patchRecord } from "./ot";
import { $recordCreator, Record, RecordData, $deserializeRecord, RecordCreator } from "./records";
import {Table} from "./table";

type DocumentData = {} & RecordData;


export class Document<TState> {
  private _table: Table;
  private _createRecord: (value: any) => Record;
  private _record: Record;
  
  update(newState: TState) {
    const ots = diff(this._record.getState(), newState);
    patchRecord(this._record, ots, this._createRecord);
  }
  toJSON(): DocumentData {
    return this._record.toJSON();
  }
  getState() {
    return this._record.getState();
  }
  applyMutation(mutation: Mutation) {
    this._table.getItem(mutation.target).applyMutation(mutation);
  }
  private _initialize(record: Record, createRecord: RecordCreator) {
    this._createRecord = createRecord;
    this._record = record;
    this._table = new Table(this._record);
  }

  static fromState = <TState>(initialState: TState) => {
    const createRecord = $recordCreator(generateId);
    const doc = new Document<TState>();
    doc._initialize(createRecord(initialState), createRecord);
    return doc;
  }

  static deserialize = <TState>(data: DocumentData) => {
    const record = $deserializeRecord(data);
    const doc = new Document<TState>();
    doc._initialize(record, $recordCreator(generateId));
    return doc;
  }
}

const seed = `${Math.round(Math.random() * 9999)}`;
let _idCount = 0;

const generateId = () => {
  return `${seed}${++_idCount}`;
}