"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var immutable_1 = require("immutable");
var __1 = require("..");
var chai_1 = require("chai");
var immutable_ot_1 = require("immutable-ot");
var Element = immutable_1.Record({
    tagName: null,
    attributes: immutable_1.List(),
    children: immutable_1.List()
});
var Attribute = immutable_1.Record({
    key: null,
    value: null
});
var Text = immutable_1.Record({
    value: null
});
var classes = {
    Element: Element,
    Attribute: Attribute,
    Text: Text
};
var adapter = {
    isList: function (value) { return immutable_1.List.isList(value) || immutable_ot_1.defaultAdapter.isList(value); },
    isMap: function (value) { return value && typeof value === "object" && !immutable_1.List.isList(value) || immutable_ot_1.defaultAdapter.isMap(value); },
    each: function (value, iterator) {
        if (immutable_1.List.isList(value)) {
            for (var i = 0, n = value.size; i < n; i++) {
                if (iterator(value.get(i), i) === false) {
                    break;
                }
            }
            return;
        }
        else if (value.constructor !== Object) {
            for (var key in value.toObject()) {
                if (iterator(value.get(key), key) === false) {
                    break;
                }
            }
            return;
        }
        return immutable_ot_1.defaultAdapter.each(value, iterator);
    },
    getCastName: function (value) {
        for (var key in classes) {
            if (value instanceof classes[key]) {
                return key;
            }
        }
        return value.constructor.name;
    },
    castValue: function (value, as) {
        var clazz = classes[as];
        return clazz ? clazz(value) : value;
    },
    get: function (object, key) { return object.get ? object.get(key) : object[key]; }
};
describe(__filename + "#", function () {
    it("can diff & patch a simple immutable structure", function () {
        var div = Element({
            tagName: "div",
            children: immutable_1.List([
                Text({ value: "hello" })
            ])
        });
        var doc = __1.Document.initialize(div, adapter);
        var newDiv = div.updateIn(["children"], function (children) {
            return children.push(Text({ value: "world" }));
        });
        doc.updateState(newDiv);
        chai_1.expect(doc.getState().toJS()).to.eql(newDiv.toJS());
    });
});
//# sourceMappingURL=immuable-js-test.js.map