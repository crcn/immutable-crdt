"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var immutable_ot_1 = require("immutable-ot");
var records_1 = require("./records");
exports.patchRecord = function (root, mutations, createRecord) {
    for (var _i = 0, mutations_1 = mutations; _i < mutations_1.length; _i++) {
        var mutation = mutations_1[_i];
        var target = root;
        for (var i = 0, n = mutation.path.length; i < n; i++) {
            var pathPart = mutation.path[i];
            if (target instanceof records_1.Map) {
                target = target.properties[pathPart];
            }
            else if (target instanceof records_1.List) {
                target = target.items[pathPart];
            }
        }
        if (mutation.type === immutable_ot_1.MutationType.REPLACE) {
            var parent_1 = target.$$parent;
            var replacement = createRecord(mutation.value);
            if (parent_1 instanceof records_1.List) {
                parent_1.replace(parent_1.indexOf(target), replacement);
            }
            else if (parent_1 instanceof records_1.Map) {
                parent_1.setValue(parent_1.getKey(target), replacement);
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