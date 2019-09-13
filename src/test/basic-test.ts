import { expect } from "chai";
import { Document } from "../index";

describe(__filename + "#", () => {
  it("can create a simple document from a vanilla object", () => {    
    const doc = Document.fromState({
      firstName: "Joe",
      lastName: "Shmo"
    });
  });
  it("change a simple document", () => {  
    const state = {
      firstName: "Joe",
      lastName: "Shmo"
    }  
    const doc = Document.fromState(state);
    doc.update({...state, firstName: "Jeff"})
  });

  it("can deserialize a document", () => {
    const state = {
      firstName: "Joe",
      lastName: "Shmo"
    }  
    const doc = Document.fromState(state);
    expect(doc.getState()).to.eql(state);
    const doc2 = Document.deserialize(doc.toJSON());
    expect(doc2.getState()).to.eql(state);
  });
});
