"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
const __1 = require("..");
const chai_1 = require("chai");
const immutable_ot_1 = require("immutable-ot");
const Element = immutable_1.Record({
    tagName: null,
    attributes: immutable_1.List(),
    children: immutable_1.List()
});
const Attribute = immutable_1.Record({
    key: null,
    value: null
});
const Text = immutable_1.Record({
    value: null
});
const classes = {
    Element,
    Attribute,
    Text
};
const adapter = {
    isList: value => immutable_1.List.isList(value) || immutable_ot_1.defaultAdapter.isList(value),
    getListLength: value => value.size,
    isMap: value => value && typeof value === "object" && !immutable_1.List.isList(value) || immutable_ot_1.defaultAdapter.isMap(value),
    each(value, iterator) {
        if (immutable_1.List.isList(value)) {
            for (let i = 0, n = value.size; i < n; i++) {
                if (iterator(value.get(i), i) === false) {
                    break;
                }
            }
            return;
        }
        else if (value.constructor !== Object) {
            for (const key in value.toObject()) {
                if (iterator(value.get(key), key) === false) {
                    break;
                }
            }
            return;
        }
        return immutable_ot_1.defaultAdapter.each(value, iterator);
    },
    typeEquals(a, b) {
        return immutable_ot_1.defaultAdapter.typeEquals(a, b);
    },
    equals(a, b) {
        return a === b;
    },
    diffable(a, b) {
        return true;
    },
    getCastName(value) {
        for (const key in classes) {
            if (value instanceof classes[key]) {
                return key;
            }
        }
        return value.constructor.name;
    },
    castValue(value, as) {
        const clazz = classes[as];
        return clazz ? clazz(value) : value;
    },
    get: (object, key) => object.get ? object.get(key) : object[key]
};
describe(__filename + "#", () => {
    it("can diff & patch a simple immutable structure", () => {
        const div = Element({
            tagName: "div",
            children: immutable_1.List([
                Text({ value: "hello" })
            ])
        });
        const doc = __1.Document.initialize(div, { adapter });
        const newDiv = div.updateIn(["children"], (children) => {
            return children.push(Text({ value: "world" }));
        });
        doc.updateState(newDiv);
        chai_1.expect(doc.getState().toJS()).to.eql(newDiv.toJS());
    });
});
//# sourceMappingURL=immuable-js-test.js.map