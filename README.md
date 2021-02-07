# rxjs-sequence

rxjs-sequence provides the RxJS operator *inSequence*, which is directly equivalent to *forkJoin* except that the requests are made in sequence instead of in parallel.  The results are collated into an array or object as for *forkJoin*.

rxjs-sequence also provides ithe corresponding *inParallel* as a synonym for *forkJoin* that corresonds to *inSequence*.

*inSequence* and *inParallel* have one other key difference from forkJoin: if the set of requests is empty then an empty array or object of results is emited (it isn't with forkJoin) so that downstream processing still occurs.

Typically the reason for performing requests in sequence is that the results of earlier requests are used as inputs to later requests.  This is sometimes referred to as "chaining" requests.  Chaining requires a fair amount of boilerplate using raw RxJS.  A solution to simplify this common requirement is also provided.

# Example Usage

Examples of using *inSequence* and *inParallel* in exactly the same way as *forkJoin*:
```
obs1$ = of(1);
obs2$ = of(2);
obs3$ = of(3);

inSequence([]).subscribe(console.log);
// outputs: []

inSequence([obs1$, obs2$, obs3$]).subscribe(console.log);
// outputs: [1, 2, 3]

inParallel([]).subscribe(console.log);
// outputs: []

inParallel([obs1$, obs2$, obs3$]).subscribe(console.log);
// outputs: [1, 2, 3]

inParallel({}).subscribe(console.log);
// outputs: {}

inParallel({a: obs1$, b: obs2$, c: obs3$}).subscribe(console.log);
// outputs: {a: 1, b: 2, c: 3}

```

Next is an examples of using *inSequence* with an object.  Note that we cannot use exactly the same approach as *forkJoin* because we want to guarantee the order of requests, which is not possible with an object.  Instead we pass an array of objects and the outputs are merged into a single object:
```
inSequence([
  {result1: obs1$}, 
  {result2: obs2$}, 
  {result3: obs3$}
]).subscribe(console.log);
// outputs: {result1: 1, result2: 2, result3: 3} 
```

Example of a sequence where the 3rd request is dependendent on the 2nd.  The array that is passed into the 3rd request is the collation of the results of all    previous requests in the sequence up to that point.  This exactly the same as the array returned when the whole function is complete (with fewer values).   
```
inSequence([
  obs1$, 
  obs2$, 
  ([,result2])=>of(result2+1)
]).subscribe(console.log);
// outputs: [1, 2, 3] 
```

The equivalent approach with objects:
```
inSequence([
  {result1: obs1$}, 
  {result2: obs2$}, 
  {result3: ({result2})=>of(result2+1)}
]).subscribe(console.log);
// outputs: {result1: 1, result2: 2, result3: 3} 
```

Finally, we can nest parallel groups wihin the overall sequence and the results will be automatically expanded to provide a single array or object of results.  In this way changing whether requests are made in seques or parallel has no impact outside the outer operator call.
```
inParallel([
  {result1: obs1$},
  inSequence([
    {result2: obs2$}, 
    {result3: ({result2})=>of(result2+1)},
   ]),
]).subscribe(console.log);
// outputs: {result1: 1, result2: 2, result3: 3} 
```
