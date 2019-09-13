CRDT library for immutable apps. Here's a simple:

```javascript
import {Document} from "immutable-crdt";

let person = {
  firstName: "a",
  lastName: "b"
};

const doc2 = Document.initialize(person);
const doc = Document.initialize(person);
const mutations = doc.updateState({...person, firstName: "blah", lastName: "blah"});

doc2.applyMutations(mutations);
```


TODOS:

- [ ] remove ID check 
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