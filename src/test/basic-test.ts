import { expect } from "chai";
import { Document } from "../index";

describe(__filename + "#", () => {
  it("can create a simple document from a vanilla object", () => {    
    const doc = Document.initialize({
      firstName: "Joe",
      lastName: "Shmo"
    });
  });
  it("change a simple document", () => {  
    const state = {
      firstName: "Joe",
      lastName: "Shmo"
    }  
    const doc = Document.initialize(state);
    doc.updateState({...state, firstName: "Jeff"})
  });

  it("can deserialize a document", () => {
    const state = {
      firstName: "Joe",
      lastName: "Shmo"
    }  
    const doc = Document.initialize(state);
    expect(doc.getState()).to.eql(state);
    const doc2 = Document.deserialize(doc.toJSON());
    expect(doc2.getState()).to.eql(state);
  });
});
