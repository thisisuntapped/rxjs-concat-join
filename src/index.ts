import {concatAll, last, map, mapTo, mergeMap, tap} from 'rxjs/operators';
import {concat, defer, forkJoin, from, Observable, ObservedValueOf, of, throwError} from 'rxjs';
import {ObservableInput, ObservedValuesFromArray, UnaryFunction} from 'rxjs/internal/types';

/**
 * inParallel is a wrapper for forkJoin, with exactly the same signature options.  It differs only in
 * that it emits an empty array or object if the input array or object is empty.
 *
 * Note that to replicate the signatures for forkJoin we need to include types that are internal to
 * rxjs.
 */

/* tslint:disable:max-line-length */
export function inParallel(sources: []): Observable<[]>;
export function inParallel<A>(sources: [ObservableInput<A>]): Observable<[A]>;
export function inParallel<A, B>(sources: [ObservableInput<A>, ObservableInput<B>]): Observable<[A, B]>;
export function inParallel<A, B, C>(sources: [ObservableInput<A>, ObservableInput<B>, ObservableInput<C>]): Observable<[A, B, C]>;
export function inParallel<A, B, C, D>(sources: [ObservableInput<A>, ObservableInput<B>, ObservableInput<C>, ObservableInput<D>]): Observable<[A, B, C, D]>;
export function inParallel<A, B, C, D, E>(sources: [ObservableInput<A>, ObservableInput<B>, ObservableInput<C>, ObservableInput<D>, ObservableInput<E>]): Observable<[A, B, C, D, E]>;
export function inParallel<A, B, C, D, E, F>(sources: [ObservableInput<A>, ObservableInput<B>, ObservableInput<C>, ObservableInput<D>, ObservableInput<E>, ObservableInput<F>]): Observable<[A, B, C, D, E, F]>;
export function inParallel<A extends ObservableInput<any>[]>(sources: A): Observable<ObservedValuesFromArray<A>[]>;
export function inParallel(sourcesObject: {}): Observable<{}>;
export function inParallel<T, K extends keyof T>(sourcesObject: T): Observable<{ [K in keyof T]: ObservedValueOf<T[K]> }>;

/* tslint:enable:max-line-length */

// tslint:disable-next-line:ban-types
export function inParallel(sources: any[] | Object): Observable<any> {
    if (Array.isArray(sources) && sources.length===0) {
        return of([]);
    } else if (typeof sources ==='object' && Object.keys(sources).length===0) {
        return of ({});
    } else {
        return forkJoin(sources);
    }
}

/**
 * inSequence has the same signature as inParallel, except that it does not allow for the passing of an object (
 * because the requests are performed in the defined order, and the order of properties of an object cannot be
 * guaranteed according to the language definition).
 *
 *
 */

// Describes a simple object with string keys mapping to objects of the same type
type MapToValueType<T> = {[key: string]: T}
function testMapToValueType<T>(prm: MapToValueType<T>): void{}
testMapToValueType({a: 4, b: 'b'});

type ObservableFromResultsSoFarAsArray<T> = (resultsSoFar: any[]) => ObservableInput<T>;
function testObservableFromResultsSoFarAsArray<T>(prm: ObservableFromResultsSoFarAsArray<T>): void{}
testObservableFromResultsSoFarAsArray( (a: number[])=> of(a[0]));

type ObservableFromResultsSoFarAsArray2<Prm extends any[], Res> = (resultsSoFar: Prm) => ObservableInput<Res>;
function testObservableFromResultsSoFarAsArray2<Prm extends any[], Res>(prm: ObservableFromResultsSoFarAsArray2<Prm, Res>): void{}
testObservableFromResultsSoFarAsArray2( (a: number[])=> of('a'));

type ObservableOrObservableFromResultsSoFarAsArray<T> = ObservableInput<T> | ObservableFromResultsSoFarAsArray<T>;
type ObservableOrObservableFromResultsSoFarAsArray2<A extends any[],T> = ObservableInput<T> | ObservableFromResultsSoFarAsArray2<A,T>;
function testObservableOrObservableFromResultsSoFarAsArray2<Prm extends any[], Res>(prm: ObservableOrObservableFromResultsSoFarAsArray2<Prm, Res>): void{}
testObservableOrObservableFromResultsSoFarAsArray2( of('a'));
testObservableOrObservableFromResultsSoFarAsArray2( (a: number[])=> of('a'));

function testObservableOrObservableFromResultsSoFarAsArrayX<Res>( f: (a: [number, string]) => Res): void{}
testObservableOrObservableFromResultsSoFarAsArrayX( ([a, b])=> of('a'));

function testInSequence<A, B, C>(elements: [ObsOrArrFunc<A>, ObservableOrObservableFromResultsSoFarAsArray2<[A],B>, ObservableOrObservableFromResultsSoFarAsArray2<[A,B],C> ]): void{}
testInSequence([of(1), ([a]) => of(1), ([a, b])=>of(1) ]);

type ObservableOrObservableFromResultsSoFarAsArray3<A extends any[],T> = T extends ObservableInput<infer U> ? U : T extends ObservableFromResultsSoFarAsArray2<A, infer U> ? U : never;
type ObsOrArrFunc<T> = ObservableOrObservableFromResultsSoFarAsArray<T>; // synonym to reduce verbosity
type ObsOrArrFunc2<A extends any[],T> = ObservableOrObservableFromResultsSoFarAsArray2<A, T>; // synonym to reduce verbosity
type ObsOrArrFunc3<A extends any[],T> = ObservableOrObservableFromResultsSoFarAsArray3<A, T>; // synonym to reduce verbosity

type ObservableFromResultsSoFarAsObject<T> = ( (resultsSoFar: MapToValueType<any>) => ObservableInput<T>);
type ObservableFromResultsSoFarAsObject2<T, A> = ( (resultsSoFar: MapToValueType<A>) => ObservableInput<T>);
type ObservableOrObservableFromResultsSoFarAsObject<T> = ObservableInput<T> | ObservableFromResultsSoFarAsObject<T>;
type ObservableOrObservableFromResultsSoFarAsObject2<T, A> = ObservableInput<T> | ObservableFromResultsSoFarAsObject2<T, A>;
type ObsOrObjFunc<T> = ObservableOrObservableFromResultsSoFarAsObject<T>; // synonym to reduce verbosity
type ObsOrObjFunc2<T, A> = ObservableOrObservableFromResultsSoFarAsObject2<T, A>; // synonym to reduce verbosity
type MapToObsOrObjFunc<T> = MapToValueType<ObsOrObjFunc<T>>;
type MapToObsOrObjFunc2<T, A> = MapToValueType<ObsOrObjFunc2<T, A>>;

type Obj = MapToObsOrObjFunc<any> // short synonym for object form InSequence element
type Obj2<T, A> = MapToObsOrObjFunc2<T, A> // short synonym for object form InSequence element
type ObjResultX<T, A> = { [P in keyof T]: T[P] extends ObservableInput<infer U> ? U : T[P] extends ObservableFromResultsSoFarAsObject<infer U>? U :never}
type ObjResult<T> = Observable<{ [P in keyof T]: T[P] extends ObservableInput<infer U> ? U : T[P] extends ObservableFromResultsSoFarAsObject<infer U>? U :never}>



/* tslint:disable:max-line-length */
export function inSequence(): Observable<[]>;
export function inSequence<A>(source1: ObsOrArrFunc2<any, A>): Observable<[A]>;
export function inSequence<A, B>(source1: ObsOrArrFunc<A>, source2: ObsOrArrFunc<B>): Observable<[A,B]>;
export function inSequence<A, B, C>(source1: ObsOrArrFunc<A>, source2: ObsOrArrFunc<B>, source3: ObsOrArrFunc<C>): Observable<[A,B, C]>;
// // export function inSequence<A, B>(elements: [ObsOrArrFunc<A>, ObsOrArrFunc<B>]): Observable<[A, B]>;
//
// export function inSequence<A, B, C>(elements: [ObsOrArrFunc<A>, ObsOrArrFunc2<[A],B>, ObsOrArrFunc2<[A,B],C> ]): Observable<[A,B,C]>;
//
// // export function inSequence<A, B, C>(elements: [ObsOrArrFunc<A>, ObsOrArrFunc<B>, ObsOrArrFunc<C>]): Observable<[A, B, C]>;
// export function inSequence<A, B, C, D>(elements: [ObsOrArrFunc<A>, ObsOrArrFunc<B>, ObsOrArrFunc<C>, ObsOrArrFunc<D>]): Observable<[A, B, C, D]>;
// export function inSequence<A, B, C, D, E>(elements: [ObsOrArrFunc<A>, ObsOrArrFunc<B>, ObsOrArrFunc<C>, ObsOrArrFunc<D>, ObsOrArrFunc<E>]): Observable<[A, B, C, D, E]>;
// export function inSequence<A, B, C, D, E, F>(elements: [ObsOrArrFunc<A>, ObsOrArrFunc<B>, ObsOrArrFunc<C>, ObsOrArrFunc<D>, ObsOrArrFunc<E>, ObsOrArrFunc<F>]): Observable<[A, B, C, D, E, F]>;
//
export function inSequence<A extends Obj>(sources1: A) : ObjResult<A>
export function inSequence<A extends Obj, B extends Obj, T extends A&B>(sources1: A, sources2: B) : ObjResult<A&B>
export function inSequence<A extends Obj, B extends Obj, C extends Obj>(sources1: A, sources2: B, sources3: C) : ObjResult<A&B&C>
// export function inSequence<A extends Obj, B extends Obj, C extends Obj, D extends Obj, T extends A&B&C&D>(elements: [A, B, C, D]) : ObjResult<T>
// export function inSequence<A extends Obj, B extends Obj, C extends Obj, D extends Obj, E extends Obj, T extends A&B&C&D&E>(elements: [A, B, C, D, E]) : ObjResult<T>
// export function inSequence<A extends Obj, B extends Obj, C extends Obj, D extends Obj, E extends Obj, F extends Obj, T extends A&B&C&D&E&F>(elements: [A, B, C, D, E, F]) : ObjResult<T>


export function inSequence(elements: MapToObsOrObjFunc<any>[]): any;
/* tslint:enable:max-line-length */

export function inSequence(...elements: (ObsOrArrFunc<any> | MapToObsOrObjFunc<any>)[] ) {
    return inSequenceFromArray(elements);
}

export function inSequenceFromArray(elements: (ObsOrArrFunc<any> | MapToObsOrObjFunc<any>)[] ) {
    if (elements.length===0) return of([]);

    // defer so that we can use local variables that are scoped correctly
    return defer(() => {

        // All elements must be pojos or not.  Use the 1st element to determine which.
        let resultTypeIsObject = isPOJO(elements[0]);
        let resultsAsArray: Array<any> = [];
        let resultsAsObject = {};

        const appendToArray = (newResult: any) =>
            resultsAsArray = [...resultsAsArray, newResult];

        const appendToObject = (newResult: any) =>
            resultsAsObject = {...resultsAsObject, ...newResult};

        // Convert the sequence of different element types (observables, functions that take the results-so-far and
        // return observables, and objects and convert them in to proper observables.
        const observables = elements.map( element => {
            if (isPOJO(element)) {

                if (!resultTypeIsObject) throw new Error("Mismatch in sequence element types");

                // Use defer to use the value of results-so-far at the point of subscription for all inner
                // functions at once
                return defer ( ()=> inParallel(
                    // replace all values for the object with proper observables, ie if its a function then call
                    // the function with the results-so-far.
                    Object.fromEntries(Object.entries(element).map(([k, obsOrFunc]) =>
                        [k, typeof obsOrFunc === 'function' ? obsOrFunc(resultsAsObject) : obsOrFunc]
                    ))
                )).pipe(
                    last(),
                    tap(appendToObject)
                );

            } else {

                if (resultTypeIsObject) throw new Error("Mismatch in sequence element types");

                return from(
                    typeof element === 'function'?
                        // Use defer to use the value of results-so-far at the point of subscription
                        defer(() => element(resultsAsArray)) :
                        element
                ).pipe(
                    last(),
                    tap(appendToArray)
                );
            }
        })

        return from(observables).pipe(
            concatAll(),
            last(),
            map(_ => resultTypeIsObject? resultsAsObject : resultsAsArray)
        );
    });
}


// This utility function is copied from the RxJS implementation of forkJoin
function isPOJO(obj: any): obj is MapToObsOrObjFunc<any> {
    return obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
}

export function inSequenceUncollated(observables: ObservableInput<any>[]): Observable<void> {
    return observables.length>0? concat(...observables).pipe(last(), mapTo(void 0)) : of(void 0);
}

export function inParallelUncollated(observables: ObservableInput<any>[]): Observable<void> {
    return inParallel(observables).pipe(mapTo(void 0));
}

of(10).pipe()
