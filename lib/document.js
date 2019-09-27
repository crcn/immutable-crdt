"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mutations_1 = require("./mutations");
var errors_1 = require("./errors");
var ot_1 = require("./ot");
var immutable_ot_1 = require("immutable-ot");
var records_1 = require("./records");
var table_1 = require("./table");
var Document = /** @class */ (function () {
    function Document(options) {
        this._options = options;
    }
    Document.prototype.updateState = function (newState) {
        var _a;
        // first capture the operational transforms between the old & new state. Note that we use _currentState
        // since it's usually coming from an external source -- diffing should be faster.
        var ots = immutable_ot_1.diff(this._currentState, newState, { adapter: this._options.adapter });
        this._currentState = newState;
        var mirrorRecord = this._mirror.getRoot();
        var mutations = [];
        var onMutation = function (mutation) { return mutations.push(mutation); };
        // collects mutations as operational transforms are applied to the state mirror record
        mirrorRecord.changeObservable.observe(onMutation);
        // apply the operational transforms to the mirror record
        ot_1.patchRecord(mirrorRecord, ots, this._createRecord);
        mirrorRecord.changeObservable.unobserve(onMutation);
        (_a = this._mutations).push.apply(_a, mutations);
        // return the CRDT mutations which can later be used against other documents
        return mutations;
    };
    Document.prototype.toJSON = function () {
        return this._mirror.getRoot().toJSON();
    };
    Document.prototype.getState = function () {
        return this._currentState;
    };
    Document.prototype.applyMutations = function (mutations) {
        this._mutations = mutations_1.sortMutations(this._mutations.concat(mutations));
        var snapshot = this._snapshot.clone();
        var results = [];
        for (var _i = 0, _a = this._mutations; _i < _a.length; _i++) {
            var mutation = _a[_i];
            var target = snapshot.getItem(mutation.targetId);
            if (!target) {
                results.push(new errors_1.TargetNotFoundError("target " + mutation.targetId + " not found"));
            }
            else {
                var result = target.applyMutation(mutation);
                if (result) {
                    results.push(result);
                }
            }
        }
        this._mirror = snapshot;
        this._resetCurrentState();
        return results;
    };
    Document.prototype.clone = function () {
        return Document.deserialize(this.toJSON(), this._options);
    };
    Document.prototype._construct = function (record, createRecord) {
        this._createRecord = createRecord;
        this._mutations = [];
        this._snapshot = new table_1.Table(record.clone());
        this._mirror = this._snapshot.clone();
        this._resetCurrentState();
    };
    Document.prototype._resetCurrentState = function () {
        this._currentState = this._mirror.getRoot().getState();
    };
    /**
     * Returns a new document from vanilla state object. Note that this should happen
     * at the time of `initialState` creation.
     */
    Document.initialize = function (initialState, options) {
        var _options = Object.assign({}, records_1.DEFAULT_RECORD_OPTIONS, options);
        var createRecord = records_1.$recordCreator(options);
        var doc = new Document(_options);
        doc._construct(createRecord(initialState || {}), createRecord);
        return doc;
    };
    /**
     */
    Document.deserialize = function (data, options) {
        var _options = Object.assign({}, records_1.DEFAULT_RECORD_OPTIONS, options);
        var record = records_1.$deserializeRecord(data, _options);
        var doc = new Document(_options);
        doc._construct(record, records_1.$recordCreator(options));
        return doc;
    };
    return Document;
}());
exports.Document = Document;
//# sourceMappingURL=document.js.map