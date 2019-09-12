import { expect } from "chai";
import { Document } from "../index";

describe(__filename + "#", () => {
  it("can create a simple document from a vanilla object", () => {    
    const doc = new Document({
      firstName: "Joe",
      lastName: "Shmo"
    });

    console.log(doc.getStateMap().toJSON());
  });
});
