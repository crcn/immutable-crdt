"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var chai_1 = require("chai");
describe(__filename + "#", function () {
    [
        [
            [1, 1, 1],
            [1, 2, 1],
            ["INSERT", "DELETE"]
        ],
        [
            ["a", "b", "c"],
            ["c", "b", "a"],
            ["DELETE", "INSERT", "DELETE", "INSERT"]
        ],
        [
            ["a", "b", "b"],
            ["b", "a", "a"],
            ["DELETE", "INSERT", "DELETE", "APPEND"]
        ],
    ].forEach((function (_a) {
        var a = _a[0], b = _a[1], ops = _a[2];
        it("can merge " + JSON.stringify(a) + " to " + JSON.stringify(b), function () {
            var doc = __1.Document.initialize(a);
            var replica = __1.Document.deserialize(doc.toJSON());
            chai_1.expect(replica.toJSON()).to.eql(doc.toJSON());
            var mutations = doc.updateState(b);
            chai_1.expect(doc.getState()).to.eql(b);
            replica.applyMutations(mutations);
            chai_1.expect(replica.toJSON()).to.eql(doc.toJSON());
            chai_1.expect(mutations.map(function (mutation) { return mutation.type; })).to.eql(ops);
        });
    }));
});
//# sourceMappingURL=ops-test.js.map