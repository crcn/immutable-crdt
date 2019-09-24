"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
describe(__filename + "#", function () {
    it("can converge on a simple delete", function () {
        var state = [1, 2, 3];
        var doc1 = __1.Document.initialize(state);
        var doc2 = __1.Document.initialize(state);
        var mutations = doc1.updateState([2, 3]);
        doc2.updateState([2, 3]);
        console.log(mutations);
    });
});
//# sourceMappingURL=converge-test.js.map