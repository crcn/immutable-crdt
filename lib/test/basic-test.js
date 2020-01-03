"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("../index");
describe(__filename + "#", () => {
    it("can create a simple document from a vanilla object", () => {
        const doc = index_1.Document.initialize({
            firstName: "Joe",
            lastName: "Shmo"
        });
    });
    it("change a simple document", () => {
        const state = {
            firstName: "Joe",
            lastName: "Shmo"
        };
        const doc = index_1.Document.initialize(state);
        doc.updateState(Object.assign(Object.assign({}, state), { firstName: "Jeff" }));
    });
    it("can deserialize a document", () => {
        const state = {
            firstName: "Joe",
            lastName: "Shmo"
        };
        const doc = index_1.Document.initialize(state);
        chai_1.expect(doc.getState()).to.eql(state);
        const doc2 = index_1.Document.deserialize(doc.toJSON());
        chai_1.expect(doc2.getState()).to.eql(state);
    });
    it("can return the path of a nested record", () => {
        const state = {
            a: {
                b: "c",
                d: [1, 2, 3, 4]
            }
        };
        const newState = {
            a: {
                b: "cc",
                d: [5, 6, 7, 8]
            }
        };
        const doc = index_1.Document.initialize(state);
        const mutations = doc.updateState(newState);
        chai_1.expect(mutations[8].value.getPath()).to.eql(['a', 'b']);
        chai_1.expect(mutations[7].value.getPath()).to.eql(['a', 'd', 3]);
    });
});
//# sourceMappingURL=basic-test.js.map