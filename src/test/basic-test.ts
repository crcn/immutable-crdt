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

    const doc = Document.initialize(state);
    const mutations = doc.updateState(newState);
    expect((mutations[8] as any).value.getPath()).to.eql(['a', 'b']);
    expect((mutations[7] as any).value.getPath()).to.eql(['a', 'd', 3]);
  });
});
