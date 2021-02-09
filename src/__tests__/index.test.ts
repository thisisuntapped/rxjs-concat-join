import {TestScheduler} from 'rxjs/testing';
import {concat, from, merge, of} from 'rxjs';
import {concatAll, concatMap, delay, toArray} from 'rxjs/operators';
import {collate, inParallel, inParallelUncollated, inSequence, inSequenceUncollated} from '../index';

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

        it('collate should build a resultant array', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--a|');
                const e2 =  cold('--b|');
                const expected = '------(z|))'; const expectedValues = {z: ['a', 'b']};

                const obs = of([]).pipe(
                    collate(()=>e1),
                    collate(()=>e2),
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('collate should receive the array to date', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--a|');
                const e2 =  cold('--b|');
                const expected = '------(z|))'; const expectedValues = {z: ['a', 'b', ['a', 'b']]};

                const obs = of([]).pipe(
                    collate(()=>e1),
                    collate(()=>e2),
                    collate(([r1, r2])=>of([r1, r2])),
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('collate should provide short cut for independent requests', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--a|');
                const e2 =  cold('--b|');
                const expected = '------(z|))'; const expectedValues = {z: ['a', 'b', ['a', 'b']]};

                const obs = of([]).pipe(
                    collate(e1),
                    collate(e2),
                    collate(([r1, r2])=>of([r1, r2])),
                );

                expectObservable(obs).toBe(expected, expectedValues);
            });
        });

        it('sequence should invoke all collates', () => {
            testScheduler.run(helpers => {
                const {cold, expectObservable, expectSubscriptions} = helpers;
                const e1 =  cold('--a|');
                const e2 =  cold('--b|');
                const expected = '------(z|))'; const expectedValues = {z: ['a', 'b', ['a', 'b']]};

                const obs = inSequence([
                    e1,
                    e2,
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
                const e1 =  cold('--a|');
                const e2 =  cold('---b|');
                const expected = '-------(z|)'; const expectedValues = {z: void 0};

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
                const e1 =  cold('--a|');
                const e2 =  cold('---b|');
                const expected = '----(z|)'; const expectedValues = {z: void 0};

                const obs = inParallelUncollated([e1, e2]);
                expectObservable(obs).toBe(expected, expectedValues);
            });
        });
    });
});
