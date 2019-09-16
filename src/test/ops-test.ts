import {Document} from "..";
import {expect} from "chai";
import { clearMutationTimestamp } from "./utils";
describe(__filename + "#", () => {
  [
    [
      [1, 1, 1], 
      [1, 2, 1], 
      ["INSERT","DELETE"]
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

  ].forEach((([a, b, ops]) => {
    it(`can merge ${JSON.stringify(a)} to ${JSON.stringify(b)}`, () => {
      const doc = Document.initialize(a);
      const replica = Document.deserialize(doc.toJSON());
      expect(replica.toJSON()).to.eql(doc.toJSON());
      const mutations = doc.updateState(b);
      expect(doc.getState()).to.eql(b);
      replica.applyMutations(mutations);
      expect(replica.toJSON()).to.eql(doc.toJSON());
      expect(mutations.map(mutation => mutation.type)).to.eql(ops);
    });

    // basic convergence test
    it(`can converge on two docs that share the same operations`, () => {
      const doc1 = Document.initialize(a);
      const doc2 = Document.initialize(b);
      const mutations = doc1.updateState(b);
      doc2.updateState(b);
      doc2.applyMutations(mutations);
      expect(doc2.toJSON()).to.eql(doc1.toJSON());
    });
  }))
});