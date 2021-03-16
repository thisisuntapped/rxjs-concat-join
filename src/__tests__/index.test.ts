import {TestScheduler} from 'rxjs/testing';
import {concat, from, merge, of} from 'rxjs';
import {concatAll, concatMap, delay, toArray} from 'rxjs/operators';
import {concatJoin} from '../index';


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

    describe('concatJoin', () => {

        it('should emit [] if no input', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: []};

                const obs = concatJoin();
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('collate final output when inputs all simple observable', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: ['a', 'b']};

                const obs = concatJoin(e1, e2);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('collate final output when inputs all factories', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: ['a', 'b']};

                const obs = concatJoin(()=>e1, ()=>e2);

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('use array-style result-so-far, mixing observables and factories', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: ['a', 'b', ['a', 'b']]};

                const obs = concatJoin(
                    e1,
                    ()=>e2,
                    ([r1, r2])=>of([r1, r2]),
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('collate final output when inputs all objects of simple observable', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b'}};

                const obs = concatJoin(
                    {a: e1},
                    {b: e2},
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('collate final output when inputs all objects of factories', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b'}};

                const obs = concatJoin(
                    {a: ()=>e1},
                    {b: ()=>e2},
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('use object-style result-so-far, mixing observables and factories', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b', c:'bb'}};

                const obs = concatJoin(
                    {a: e1},
                    {b: ()=>e2},
                    {c: ({b})=>of(b + b)},
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('allow object values to have multiple properties which are forkedJoined and merged into the output', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--(a|)');
                const e2 =  cold('--(b|)');
                const e3 =  cold('--(c|)');
                const expected = '----(z|))'; const expectedValues = {z: {a:'a', b:'b', c:'c'}};

                const obs = concatJoin(
                    {a: e1, b: e2},
                    {c: e3},
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('allow empty object', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: {}};

                const obs = concatJoin({});

                expectObservable(obs).toBe(expected, expectedValues);
            });
            });

        it('allow object values to be empty', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const expected = '(z|))'; const expectedValues = {z: {}};

                const obs = concatJoin(
                    {},
                    {},
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

    });

});
