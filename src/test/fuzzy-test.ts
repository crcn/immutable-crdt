import { expect } from "chai";
import { Document } from "..";
import { generateRandomNode } from "immutable-ot/lib/test/utils"; 

describe(__filename + "#", () => {

  [
    // failed first
    [
      {"type":1,"attributes":[],"children":[]},
      {"type":0,"value":"d"}
    ],
    [
      {
        "type": 1,
        "attributes": [
          {},
          {
            "name": "i",
            "value": "c"
          },
          {
            "name": "a",
            "value": "a"
          },
          {
            "name": "g",
            "value": "e"
          }
        ],
        "children": []
      },
      {
        "type": 1,
        "attributes": [
          {
            "name": "i",
            "value": "c"
          },
          {
            "name": "l",
            "value": "e"
          },
          {
            "name": "k",
            "value": "g"
          },
          {
            "name": "k",
            "value": "k"
          },
          {
            "name": "i",
            "value": "b"
          },
          {
            "name": "f",
            "value": "f"
          }
        ],
        "children": [
          {
            "type": 0,
            "value": "g"
          },
          {
            "type": 1,
            "attributes": [
              {
                "name": "m",
                "value": "g"
              },
              {
                "name": "m",
                "value": "m"
              },
              {
                "name": "d",
                "value": "m"
              },
              {
                "name": "f",
                "value": "l"
              },
              {
                "name": "d",
                "value": "m"
              }
            ],
            "children": [
              {
                "type": 1,
                "attributes": [
                  {
                    "name": "j",
                    "value": "f"
                  },
                  {
                    "name": "c",
                    "value": "m"
                  },
                  {
                    "name": "j",
                    "value": "i"
                  }
                ],
                "children": []
              }
            ]
          }
        ]
      }
    ],
    [
      {"type":1,"attributes":[{"name":"k","value":"g"}],"children":[{"type":1,"attributes":[{"name":"k","value":"e"},{"name":"e","value":"l"}],"children":[]},{"type":1,"attributes":[{"name":"b","value":"j"}],"children":[{"type":0,"value":"f"}]}]},
      {"type":1,"attributes":[{"name":"h","value":"f"},{"name":"c","value":"b"}],"children":[{"type":1,"attributes":[{"name":"e","value":"a"}],"children":[{"type":0,"value":"m"},{"type":0,"value":"l"}]},{"type":0,"value":"d"}]}
    ],

    // next, new fuzzies
    ...Array
      .from({ length: 100 })
      .map(() => [
        generateRandomNode(7, 7, 7), 
        generateRandomNode(7, 7, 7)
      ])
  ]
  .forEach(([aState, bState]) => {
    it(`Can diff & patch ${JSON.stringify(aState)} to ${JSON.stringify(bState)}`,  () => {
      const aDoc = Document.initialize(aState);
      const bDoc = aDoc.clone();
      
      const bMutations = bDoc.updateState(bState);


      aDoc.applyMutations(bMutations);

      expect(aDoc.toJSON()).to.eql(bDoc.toJSON());
    });
  });
});
