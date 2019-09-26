import {Record, List} from "immutable";
import {Document} from "..";
import {expect} from "chai";
import { defaultAdapter } from "immutable-ot";
import { RecordAdapter } from "../records";

const Element = Record({
  tagName: null,
  attributes: List(),
  children: List()
});

const Attribute = Record({
  key: null,
  value: null
});

const Text = Record({
  value: null
});

const classes = {
  Element,
  Attribute,
  Text
};

const adapter: RecordAdapter = {
  isList: value => List.isList(value) || defaultAdapter.isList(value),
  getListLength: value => value.size,
  isMap: value => value && typeof value === "object" && !List.isList(value) || defaultAdapter.isMap(value),
  each(value, iterator) {
    if (List.isList(value)) {
      for (let i = 0, n = value.size; i < n; i++) {
        if (iterator(value.get(i), i) === false) {
          break;
        }
      }
      return;
    } else if (value.constructor !== Object) {
      for (const key in value.toObject()) {
        if (iterator(value.get(key), key) === false) {
          break;
        }
      }
      return;
    }
    return defaultAdapter.each(value, iterator);
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
}

describe(__filename + "#", () => {
  it("can diff & patch a simple immutable structure", () => {
    const div = Element({
      tagName: "div",
      children: List([
        Text({ value: "hello"})
      ])
    });

    const doc = Document.initialize(div, { adapter });

    const newDiv = div.updateIn(["children"], (children) => {
      return children.push(Text({ value: "world" }));
    });

    doc.updateState(newDiv);

    expect(doc.getState().toJS()).to.eql(newDiv.toJS());
  });
});