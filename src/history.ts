import {Record, RecordData} from "./records";
import { Mutation } from "./mutations";

/**
 * Create a snapshot every N mutations
 */

const DEFAULT_SNAPSHOT_INTERVAL = 100;

type HistoryData = {
  snapshots: SnapshotData[],
  mutations: Mutation[]
};

export class History {
  private _record: Record;
  private _snapshots: Snapshot[] = [];
  private _mutations: Mutation[] = [];
  constructor(readonly source: Record, readonly snapshotInterval = DEFAULT_SNAPSHOT_INTERVAL) {
    this._record.changeObserver.observe(this.onRecordChanged);
  }
  onRecordChanged = (mutation: Mutation) => { 
    this._mutations.push(mutation);
    if (this._mutations.length % this.snapshotInterval === 0) {
      this._snapshots.push(new Snapshot(this._record.toJSON()));
    }
  }
  toJSON(): HistoryData {
    return {
      snapshots: this._snapshots.map(snapshot => snapshot.toJSON()),
      mutations: this._mutations
    };
  }
}

type SnapshotData = {
  record: RecordData
};

class Snapshot {
  constructor(readonly record: RecordData) {

  }
  toJSON(): SnapshotData {
    return {
      record: this.record
    };
  }
}