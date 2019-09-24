"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var __1 = require("..");
var utils_1 = require("immutable-ot/lib/test/utils");
describe(__filename + "#", function () {
    __spreadArrays([
        // failed first
        [
            { "type": 1, "attributes": [], "children": [] },
            { "type": 0, "value": "d" }
        ],
        [
            {
                "type": 1,
                "attributes": [
                    {},
                    {
                        "name": "i",
                        "value": "c"
                    },
                    {
                        "name": "a",
                        "value": "a"
                    },
                    {
                        "name": "g",
                        "value": "e"
                    }
                ],
                "children": []
            },
            {
                "type": 1,
                "attributes": [
                    {
                        "name": "i",
                        "value": "c"
                    },
                    {
                        "name": "l",
                        "value": "e"
                    },
                    {
                        "name": "k",
                        "value": "g"
                    },
                    {
                        "name": "k",
                        "value": "k"
                    },
                    {
                        "name": "i",
                        "value": "b"
                    },
                    {
                        "name": "f",
                        "value": "f"
                    }
                ],
                "children": [
                    {
                        "type": 0,
                        "value": "g"
                    },
                    {
                        "type": 1,
                        "attributes": [
                            {
                                "name": "m",
                                "value": "g"
                            },
                            {
                                "name": "m",
                                "value": "m"
                            },
                            {
                                "name": "d",
                                "value": "m"
                            },
                            {
                                "name": "f",
                                "value": "l"
                            },
                            {
                                "name": "d",
                                "value": "m"
                            }
                        ],
                        "children": [
                            {
                                "type": 1,
                                "attributes": [
                                    {
                                        "name": "j",
                                        "value": "f"
                                    },
                                    {
                                        "name": "c",
                                        "value": "m"
                                    },
                                    {
                                        "name": "j",
                                        "value": "i"
                                    }
                                ],
                                "children": []
                            }
                        ]
                    }
                ]
            }
        ],
        [
            { "type": 1, "attributes": [{ "name": "k", "value": "g" }], "children": [{ "type": 1, "attributes": [{ "name": "k", "value": "e" }, { "name": "e", "value": "l" }], "children": [] }, { "type": 1, "attributes": [{ "name": "b", "value": "j" }], "children": [{ "type": 0, "value": "f" }] }] },
            { "type": 1, "attributes": [{ "name": "h", "value": "f" }, { "name": "c", "value": "b" }], "children": [{ "type": 1, "attributes": [{ "name": "e", "value": "a" }], "children": [{ "type": 0, "value": "m" }, { "type": 0, "value": "l" }] }, { "type": 0, "value": "d" }] }
        ]
    ], Array
        .from({ length: 100 })
        .map(function () { return [
        utils_1.generateRandomNode(7, 7, 7),
        utils_1.generateRandomNode(7, 7, 7)
    ]; })).forEach(function (_a) {
        var aState = _a[0], bState = _a[1];
        it("Can diff & patch " + JSON.stringify(aState) + " to " + JSON.stringify(bState), function () {
            var aDoc = __1.Document.initialize(aState);
            var bDoc = aDoc.clone();
            var bMutations = bDoc.updateState(bState);
            aDoc.applyMutations(bMutations);
            chai_1.expect(aDoc.toJSON()).to.eql(bDoc.toJSON());
        });
    });
});
//# sourceMappingURL=fuzzy-test.js.map