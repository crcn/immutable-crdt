"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Create a snapshot every N mutations
 */
var DEFAULT_SNAPSHOT_INTERVAL = 100;
var History = /** @class */ (function () {
    function History(source, snapshotInterval) {
        var _this = this;
        if (snapshotInterval === void 0) { snapshotInterval = DEFAULT_SNAPSHOT_INTERVAL; }
        this.source = source;
        this.snapshotInterval = snapshotInterval;
        this._snapshots = [];
        this._mutations = [];
        this.onRecordChanged = function (mutation) {
            _this._mutations.push(mutation);
            if (_this._mutations.length % _this.snapshotInterval === 0) {
                // this._snapshots.push(new Snapshot(this._record.clone()));
            }
        };
        // this._record.changeObservable.observe(this.onRecordChanged);
    }
    History.prototype.getCurrentRecord = function () {
    };
    History.prototype.back = function () {
    };
    History.prototype.forward = function () {
    };
    History.prototype.toJSON = function () {
        return {
            snapshots: this._snapshots.map(function (snapshot) { return snapshot.toJSON(); }),
            mutations: this._mutations
        };
    };
    return History;
}());
exports.History = History;
var Snapshot = /** @class */ (function () {
    function Snapshot(record) {
        this.record = record;
    }
    Snapshot.prototype.toJSON = function () {
        return {
            record: this.record.toJSON()
        };
    };
    return Snapshot;
}());
//# sourceMappingURL=history.js.map