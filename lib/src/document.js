"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ot_1 = require("./ot");
var records_1 = require("./records");
var table_1 = require("./table");
var Document = /** @class */ (function () {
    function Document() {
    }
    Document.prototype.updateState = function (newState) {
        // first capture the operational transforms between the old & new state
        var ots = ot_1.diff(this._mirror.getState(), newState);
        var mutations = [];
        var onMutation = function (mutation) { return mutations.push(mutation); };
        // collects mutations as operational transforms are applied to the state mirror record
        this._mirror.changeObservable.observe(onMutation);
        // apply the operational transforms to the mirror record
        ot_1.patchRecord(this._mirror, ots, this._createRecord);
        this._mirror.changeObservable.unobserve(onMutation);
        // return the CRDT mutations which can later be used against other documents
        return mutations;
    };
    Document.prototype.toJSON = function () {
        return this._mirror.toJSON();
    };
    Document.prototype.getState = function () {
        return this._mirror.getState();
    };
    Document.prototype.applyMutation = function (mutation) {
        this._table.getItem(mutation.target).applyMutation(mutation);
    };
    Document.prototype.applyMutations = function (mutations) {
        var _this = this;
        mutations.forEach(function (mutation) { return _this.applyMutation(mutation); });
    };
    Document.prototype._construct = function (record, createRecord) {
        this._createRecord = createRecord;
        this._mirror = record;
        this._table = new table_1.Table(this._mirror);
    };
    /**
     * Returns a new document from vanilla state object. Note that this should happen
     * at the time of `initialState` creation.
     */
    Document.initialize = function (initialState) {
        var createRecord = records_1.$recordCreator(generateId);
        var doc = new Document();
        doc._construct(createRecord(initialState || {}), createRecord);
        return doc;
    };
    /**
     */
    Document.deserialize = function (data) {
        var record = records_1.$deserializeRecord(data);
        var doc = new Document();
        doc._construct(record, records_1.$recordCreator(generateId));
        return doc;
    };
    return Document;
}());
exports.Document = Document;
var seed = "" + Math.round(Math.random() * 9999);
var _idCount = 0;
var generateId = function () {
    return "" + seed + ++_idCount;
};
//# sourceMappingURL=document.js.map