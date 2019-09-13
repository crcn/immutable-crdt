import { expect } from "chai";
import { Document } from "../index";

describe(__filename + "#", () => {
  it("can create a simple document from a vanilla object", () => {    
    const doc = new Document({
      firstName: "Joe",
      lastName: "Shmo"
    });
  });
  it("change a simple document", () => {  
    const state = {
      firstName: "Joe",
      lastName: "Shmo"
    }  
    const doc = new Document(state);
    doc.update({...state, firstName: "Jeff"})
  });
});
