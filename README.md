CRDT library for immutable apps. Here's a simple:

```javascript
import {createDocument} from "immutable-crdt";

let person = {
  firstName: "a",
  lastName: "b"
};

const doc2 = Document.fromState(person);
const doc = Document.fromState(person);
const mutations = doc.update({...person, firstName: "blah", lastName: "blah"});

doc2.applyMutations(mutation);
```


TODOS:

- [ ] history
- [ ] cache mutations that
- [ ] snapshotting state for performance
- [ ] benchmark testing
- [ ] persistence
- [ ] conflict resolution
- [ ] pubnub examples
- [ ] prevent applied mutations from being 

Caveats:

- Diffing method doesn't work for certain scenarios such as `incrementing`