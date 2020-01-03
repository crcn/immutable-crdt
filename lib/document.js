"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mutations_1 = require("./mutations");
const errors_1 = require("./errors");
const ot_1 = require("./ot");
const immutable_ot_1 = require("immutable-ot");
const records_1 = require("./records");
const table_1 = require("./table");
class Document {
    constructor(options) {
        this._options = options;
    }
    updateState(newState) {
        const mirrorRecord = this._mirror.getRoot();
        // first capture the operational transforms between the old & new state. Note that we use _currentState
        // since it's usually coming from an external source -- diffing should be faster.
        const ots = immutable_ot_1.diff(mirrorRecord.getState(), newState, { adapter: this._options.adapter });
        const mutations = [];
        const onMutation = (mutation) => mutations.push(mutation);
        // collects mutations as operational transforms are applied to the state mirror record
        mirrorRecord.changeObservable.observe(onMutation);
        // apply the operational transforms to the mirror record
        ot_1.patchRecord(mirrorRecord, ots, this._createRecord);
        mirrorRecord.changeObservable.unobserve(onMutation);
        this._mutations.push(...mutations);
        // return the CRDT mutations which can later be used against other documents
        return mutations;
    }
    toJSON() {
        return this._mirror.getRoot().toJSON();
    }
    getState() {
        return this._mirror.getRoot().getState();
    }
    applyMutations(mutations) {
        this._mutations = mutations_1.sortMutations(this._mutations.concat(mutations));
        const snapshot = this._snapshot.clone();
        const results = [];
        for (const mutation of this._mutations) {
            const target = snapshot.getItem(mutation.targetId);
            if (!target) {
                results.push(new errors_1.TargetNotFoundError(`target ${mutation.targetId} not found`));
            }
            else {
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
    _construct(record, createRecord) {
        this._createRecord = createRecord;
        this._mutations = [];
        this._snapshot = new table_1.Table(record.clone());
        this._mirror = this._snapshot.clone();
    }
    getRecord(id) {
        return this._snapshot.getItem(id);
    }
}
exports.Document = Document;
/**
 * Returns a new document from vanilla state object. Note that this should happen
 * at the time of `initialState` creation.
 */
Document.initialize = (initialState, options) => {
    const _options = Object.assign({}, records_1.DEFAULT_RECORD_OPTIONS, options);
    const createRecord = records_1.$recordCreator(options);
    const doc = new Document(_options);
    doc._construct(createRecord(initialState || {}), createRecord);
    return doc;
};
/**
 */
Document.deserialize = (data, options) => {
    const _options = Object.assign({}, records_1.DEFAULT_RECORD_OPTIONS, options);
    const record = records_1.$deserializeRecord(data, _options);
    const doc = new Document(_options);
    doc._construct(record, records_1.$recordCreator(options));
    return doc;
};
//# sourceMappingURL=document.js.map