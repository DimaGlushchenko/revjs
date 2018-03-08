# RevJS - Rev up your data-driven JS app development!

RevJS is a rapid application development toolkit designed to simplify creation
of data-driven JS apps.

The RevJS suite of modules aims to provide the following functionality:
 * Data models & model metadata
 * Fully customiseable field types and validation
 * Data persistence to a variety of databases, and simple in-memory data storage
   to speed up initial app development
 * Customiseable, automatically generated GraphQL API
 * Helpers for various front-end frameworks for rendering, validating and
   submitting form data

This project will shortly be in BETA. Watch this space!! :)
You can see what we're currently working on our
[Trello Board](https://trello.com/b/4H5uL73T/revjs)

The basic idea is, this code:

```typescript
// Pseudo code - example needs updating - will do soon!
// See revjs.org for working samples
import * as rev from 'rev-models';

class Person {
    @rev.IntegerField()
        id: number;    
    @rev.TextField({label: 'Name'})
        name: string;
    @rev.EmailField({label: 'Email', required: false})
        email: string;
}

rev.register(Person)

let bob = new Person({
    id: 1,
    name: 'Bob',
    email: 'bob@bob.com'
});

rev.create(bob);

```

...plus a small amount of configuration, gives you:

 * Create, Read, Update, Delete access to Person records from a database

 * A full GraphQL API for front-end integration

 * Fully-customiseable, automatically generated forms for a variety of UI frameworks

 * Data-validation and other model methods shared between client and server (write once, validate everywhere :) )
