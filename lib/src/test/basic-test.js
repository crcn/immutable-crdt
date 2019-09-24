"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var index_1 = require("../index");
describe(__filename + "#", function () {
    it("can create a simple document from a vanilla object", function () {
        var doc = index_1.Document.initialize({
            firstName: "Joe",
            lastName: "Shmo"
        });
    });
    it("change a simple document", function () {
        var state = {
            firstName: "Joe",
            lastName: "Shmo"
        };
        var doc = index_1.Document.initialize(state);
        doc.updateState(__assign(__assign({}, state), { firstName: "Jeff" }));
    });
    it("can deserialize a document", function () {
        var state = {
            firstName: "Joe",
            lastName: "Shmo"
        };
        var doc = index_1.Document.initialize(state);
        chai_1.expect(doc.getState()).to.eql(state);
        var doc2 = index_1.Document.deserialize(doc.toJSON());
        chai_1.expect(doc2.getState()).to.eql(state);
    });
});
//# sourceMappingURL=basic-test.js.map