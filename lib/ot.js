"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_ot_1 = require("immutable-ot");
const records_1 = require("./records");
exports.patchRecord = (root, mutations, createRecord) => {
    for (const mutation of mutations) {
        let target = root;
        for (let i = 0, n = mutation.path.length; i < n; i++) {
            const pathPart = mutation.path[i];
            if (target instanceof records_1.Map) {
                target = target.properties[pathPart];
            }
            else if (target instanceof records_1.List) {
                target = target.items[pathPart];
            }
        }
        if (mutation.type === immutable_ot_1.MutationType.REPLACE) {
            const parent = target.$$parent;
            const replacement = createRecord(mutation.value);
            if (parent instanceof records_1.List) {
                parent.replace(parent.indexOf(target), replacement);
            }
            else if (parent instanceof records_1.Map) {
                parent.setValue(parent.getKey(target), replacement);
            }
        }
        if (target instanceof records_1.List) {
            switch (mutation.type) {
                case immutable_ot_1.MutationType.REMOVE: {
                    target.removeAt(mutation.index);
                    break;
                }
                case immutable_ot_1.MutationType.INSERT: {
                    target.insert(mutation.index, createRecord(mutation.value));
                    break;
                }
                case immutable_ot_1.MutationType.MOVE: {
                    target.move(mutation.oldIndex, mutation.newIndex);
                    break;
                }
            }
        }
        else if (target instanceof records_1.Map) {
            switch (mutation.type) {
                case immutable_ot_1.MutationType.SET: {
                    target.setValue(mutation.propertyName, createRecord(mutation.value));
                    break;
                }
                case immutable_ot_1.MutationType.UNSET: {
                    target.removeValue(mutation.propertyName);
                    break;
                }
            }
        }
    }
};
//# sourceMappingURL=ot.js.map