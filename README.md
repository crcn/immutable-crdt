CRDT library for immutable apps. Here's a simple:

```javascript
import {createDocument} from "immutable-crdt";

let person = {
  firstName: "a",
  lastName: "b"
};

const doc = createDocument(person);
const mutations = doc.update({...person, firstName: "blah", lastName: "blah"});

const doc2 = createDocument(person);
doc2.applyMutations(mutations);

console.log(doc2.getState());
```


TODOS:

- [ ] history
- [ ] snapshotting state for performance
- [ ] benchmark testing
- [ ] persistence
- [ ] conflict resolution

Caveats:

- Diffing method doesn't work for certain scenarios such as `incrementing`