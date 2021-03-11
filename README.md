# rxjs-concat-join

The rxjs-concat-join package provides the single RxJS utility operator *concatJoin*, which is used to simplify the 
process of issuing a series of sequential requests and collecting together the results.

It is similar to *forkJoin* but the requests are issued sequentially, and the results of earlier requests can 
be used in later requests.

## Installation
***

### ES6
```
npm install rxjs-concat-join
```
```
import { concatJoin } from "rxjs-concat-join";
```

### CommonJS
```
npm install rxjs-concat-join
```
```
const { concatJoin } = require('rxjs-concat-join');
```

## Usage
***

*concatJoin* can be viewed as a combination of *concat*, *forkJoin* and *pipe*.

Like *concat* it consists of a list of observables that are subscribed to in turn, e.g.:
```
concatJoin( of(1), of(2) );
```

Like *forkJoin* the result is an observable of an array of the last value of each inner observable:  
```
concatJoin( of(1), of(2) ).subscribe(console.log);
// outputs: [1, 2]
```

A key feature of *concatJoin* is that the array of results is built up request-by-request, so that the 
results of earlier requests can be use in later requests using a factory function, e.g.:
```
concatJoin(
  of(1), 
  of(2), 
  ([,result2])=>of(result2+1)
).subscribe(console.log);
// outputs: [1, 2, 3] 
```

It is also possible to use the object notation available in *forkJoin*. Note however that properties of objects 
are not ordered, so instead we input a list of objects, while the outputs are merged into a single object:
```
concatJoin(
  {result1: of(1)}, 
  {result2: of(2)}, 
).subscribe(console.log);
// outputs: {result1: 1, result2: 2} 
```

And making use of the interim accumulated value:
```
concatJoin(
  {result1: of(1)}, 
  {result2: of(2)}, 
  {result3: ({result2})=>of(result2+1)}
).subscribe(console.log);
// outputs: {result1: 1, result2: 2, result3: 3} 
```

Finally, when using the object notation, each object is in fact passed to *forkJoin*.  In this way 
a combination of parallel and sequential requests can be constructed:
```
concatJoin(
  {result1: of(1), result2: of(2)}, 
  {result3: ({result2})=>of(result2+1)}
).subscribe(console.log);
// outputs: {result1: 1, result2: 2, result3: 3} 
// Requests 1 & 2 are issued at the same time.  Request 3 is issued when both 1 & 2 have completed. 
```
## Credits
***
*rxjs-concat-join* was developed by [Untapped](https://thisisuntapped.com/)
