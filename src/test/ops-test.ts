import {Document} from "..";
import {expect} from "chai";
describe(__filename + "#", () => {
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
      ["MOVE_LIST_ITEM", "DELETE", "INSERT"]
    ],
    [
      { a: "b" }, 
      { a: "c" },
      ["MAP_SET"]
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
      const doc2 = doc1.clone();
      expect(doc2.toJSON()).to.eql(doc1.toJSON());
      const mutations1 = doc1.updateState(b);
      const mutations2 = doc2.updateState(b);

      // need to apply mutations to both to deterministically figure out the winner
      doc2.applyMutations(mutations1);
      doc1.applyMutations(mutations2);
    });
  }))
});