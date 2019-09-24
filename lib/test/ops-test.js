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
            ["MOVE_LIST_ITEM", "MOVE_LIST_ITEM"]
        ],
        [
            ["a", "b", "b"],
            ["b", "a", "a"],
            ["MOVE_LIST_ITEM", "REPLACE_LIST_ITEM"]
        ],
        [
            { a: "b" },
            { a: "c" },
            ["MAP_SET"]
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
        // basic convergence test
        it("can converge on two docs that share the same operations", function () {
            var doc1 = __1.Document.initialize(a);
            var doc2 = doc1.clone();
            chai_1.expect(doc2.toJSON()).to.eql(doc1.toJSON());
            var mutations1 = doc1.updateState(b);
            var mutations2 = doc2.updateState(b);
            // need to apply mutations to both to deterministically figure out the winner
            doc2.applyMutations(mutations1);
            doc1.applyMutations(mutations2);
        });
    }));
});
//# sourceMappingURL=ops-test.js.map