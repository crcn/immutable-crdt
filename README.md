CRDT library for immutable apps. Here's a simple:

```javascript
import {createDocument} from "immutable-crdt";

let person = {
  firstName: "a",
  lastName: "b"
};

const doc2 = Document.fromState(person);
const doc = Document.create(person);
doc.changeObservable.observe(mutation => {
  doc2.applyMutation(mutation);
}); 
const mutations = doc.update({...person, firstName: "blah", lastName: "blah"});


console.log(doc2.getState());
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