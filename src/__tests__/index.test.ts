import {TestScheduler} from 'rxjs/testing';
import {combineLatest, concat, forkJoin, from, merge, of} from 'rxjs';
import {concatAll, concatMap, delay, toArray} from 'rxjs/operators';
import {inParallel, inParallelUncollated, inSequence, inSequenceUncollated} from '../index';

describe('rxjs-sequence', () => {
    let testScheduler: TestScheduler;

    beforeEach(() => {
        testScheduler = new TestScheduler((actual, expected) => {
            // asserting the two objects are equal
            // console.log("EXPECTED: ", JSON.stringify(expected, null, 2));
            // console.log("ACTUAL: ", JSON.stringify(actual, null, 2));
            expect(actual).toEqual(expected);
        });
    });

    describe('confirm behaviour of standard rxjs', () => {

        it('should concat when parameters supplied as a list', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 = cold('-a|');
                const e2 = cold('-b|');
                const expected = '-a-b|';
                const subs1 = '^-!';
                const subs2 = '--^-!';

                expectObservable(concat(e1, e2)).toBe(expected);
                expectSubscriptions(e1.subscriptions).toBe(subs1);
                expectSubscriptions(e2.subscriptions).toBe(subs2);
            });
        });

        it('collate concat values', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 = cold('-a|');
                const e2 = cold('-b|');
                const expected = '----(c|)'; // c= [a,b]
                const subs1 = '^-!';
                const subs2 = '--^-!';

                expectObservable(concat(e1, e2).pipe(toArray())).toBe(expected, {c: ['a', 'b']});
                expectSubscriptions(e1.subscriptions).toBe(subs1);
                expectSubscriptions(e2.subscriptions).toBe(subs2);
            });
        });

        it('collate concat values from array', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 = cold('-a|');
                const e2 = cold('-b|');
                const expected = '----(c|)'; // c= [a,b]
                const subs1 = '^-!';
                const subs2 = '--^-!';

                expectObservable(concat(...[e1, e2]).pipe(toArray())).toBe(expected, {c: ['a', 'b']});
                expectSubscriptions(e1.subscriptions).toBe(subs1);
                expectSubscriptions(e2.subscriptions).toBe(subs2);
            });
        });

        it('collate concat values from array using from/concatAll', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 = cold(' -a|');
                const e2 = cold(' -b|');
                const expected = '----(c|)'; // c= [a,b]
                const subs1 = '   ^-!';
                const subs2 = '   --^-!';

                expectObservable(from([e1, e2]).pipe(concatAll(), toArray())).toBe(expected, {c: ['a', 'b']});
                expectSubscriptions(e1.subscriptions).toBe(subs1);
                expectSubscriptions(e2.subscriptions).toBe(subs2);
            });
        });

        /**
         * This test demonstrates that the concatMap does not cause the 2nd stream to wait, because it
         * is a completely different stream.  concatMap only holds off subscribing to the next observable
         * within the same stream.
         */
        it('should ignore which type of map', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 = cold('  ----a|');
                const e2 = cold('  ----b|');
                const expecteda = '--------b|';  // for a single sequence
                const expectedb = '--------bb|'; // 2 merged sequences, the 2nd offset by 1

                const obsFactory = () => e1.pipe(concatMap(() => e2));
                expectObservable(obsFactory()).toBe(expecteda);
                expectObservable(merge(obsFactory(), obsFactory().pipe(delay(1)))).toBe(expectedb);
            });
        });

    });

    describe('inParallel', () => {

        it('should emit [] for input []', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: []};

                const obs = inParallel([]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('should emit {} for input {}', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: {}};

                const obs = inParallel({});
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('should pass through any other input to forkJoin', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--a|');
                const e2 =  cold('---b|');
                const expected = '----(z|)'; const expectedValues = {z: ['a', 'b']};

                const obs = inParallel([e1, e2]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });
    });

    describe('inSequence', () => {

        it('collate final output when inputs all simple observable', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: ['a', 'b']};

                const obs = inSequence([e1, e2]);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('collate final output when inputs all functions', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: ['a', 'b']};

                const obs = inSequence([()=>e1, ()=>e2]);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('use result-so-far within the sequence', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: ['a', 'b', ['a', 'b']]};

                const obs = inSequence([
                    e1,
                    ()=>e2,
                    ([r1, r2])=>of([r1, r2]),
                ]);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('should emit [] for input []', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: []};

                const obs = inSequence([]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('should emit {} for input [{}]', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: {}};

                const obs = inSequence([{}]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('array of objects of observable', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b'}};

                const obs = inSequence([
                    {a: e1},
                    {b: e2},
                ]);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('array of objects of function', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b'}};

                const obs = inSequence([
                    {a: ()=>e1},
                    {b: ()=>e2},
                ]);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('array of objects of differing observable and function', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b'}};

                const obs = inSequence([
                    {a: e1},
                    {b: ()=>e2},
                ]);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('array of objects with later one receiving resuts so far', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b', c:'bb'}};

                const obs = inSequence([
                    {a: e1},
                    {b: ()=>e2},
                    {c: ({b})=>of(b + b)},
                ]);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('array of objects with multiple values', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const e3 =  cold('--(c|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b', c:'c'}};

                const obs = inSequence([
                    {a: e1, b: e2},
                    {c: e3},
                ]);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        // UNCOMMENT THE FOLLOWING TEST AND CONFIRM THAT ANNOTATED CALLS TO inSequence GENERATE A COMPILATION ERROR
        // it('should get a compilation error with invalud inputs to inSequence', () => {
        //     let obs;
        //     obs = inSequence([1]);
        //     obs = inSequence(['a']);  // No error - a string has an iterator so matches standard ObservableInput
        //     obs = inSequence([true]);
        //     obs = inSequence({a: of('a')});
        //     obs = inSequence([{a: 1}]);
        //     obs = inSequence([{a: 'a'}]); // No error - a string has an iterator so matches standard ObservableInput
        //     obs = inSequence([{a: true}]);
        // });

        // UNCOMMENT THE FOLLOWING TESTs AND CONFIRM THAT ANNOTATED LINES GENERATE A COMPILATION ERROR
        it('should pass on the correct derived types', () => {

            inSequence([
                of('a'),
                ([a]) => {
                    const s: string = a;
                    const n: number = a;  // this should generate a compilation error
                    return of(1)
                },
            ]).subscribe(result => {
                const s0: string = result[0];
                const i0: number = result[0];  // this should generate a compilation error
                const s1: string = result[1];  // this should generate a compilation error
                const i1: number = result[1];
            });

            inSequence([
                {a: of('a')},
            ]).subscribe(result => {
                const s1: string = result.a;
                const i1: number = result.a;  // this should generate a compilation error
                const s2: string = result.b;  // this should generate a compilation error
            });

            inSequence([
                {a: of(1)},
            ]).subscribe(result => {
                const s1: string = result.a;  // this should generate a compilation error
                const i1: number = result.a;
                const s2: string = result.b;  // this should generate a compilation error
            });

            inSequence([
                {a: of('a')},
                {b: of(1)},
            ]).subscribe(result => {
                const s1: string = result.a;
                const i1: number = result.a;  // this should generate a compilation error
                const s2: string = result.b;  // this should generate a compilation error
                const i2: number = result.b;
                const s3: string = result.c;  // this should generate a compilation error
            });

            inSequence([
                {a: of('a')},
                {b: ({a}) => {
                    const s: string = a;
                    const n: number = a;  // this should generate a compilation error
                    return of(1);
                }},
            ]).subscribe(result => {
                const s1: string = result.a;
                const i1: number = result.a;  // this should generate a compilation error
                const s2: string = result.b;  // this should generate a compilation error
                const i2: number = result.b;
                const s3: string = result.c;  // this should generate a compilation error
            });
        });
    });

    describe('inSequenceUncollated', () => {

        it('should emit event for input []', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: void 0};

                const obs = inSequenceUncollated([]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('should emit event when all inner observables complete', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('---(b|)');
                const expected = '-----(z|)'; const expectedValues = {z: void 0};

                const obs = inSequenceUncollated([e1, e2]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });
    });

    describe('inParallelUncollated', () => {

        it('should emit event for input []', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: void 0};

                const obs = inParallelUncollated([]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('should emit event when all inner observables complete', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('---(b|)');
                const expected = '---(z|)'; const expectedValues = {z: void 0};

                const obs = inParallelUncollated([e1, e2]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });
    });



});
