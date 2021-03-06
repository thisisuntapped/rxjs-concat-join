import {concatAll, last, map, tap} from 'rxjs/operators';
import {defer, forkJoin, from, Observable, of} from 'rxjs';
import {ObservableInput, UnaryFunction} from 'rxjs/internal/types';

// Observable, or Factory that derives an Observable from a single value
type ObsOrFactory<P extends any[], R> = ObservableInput<R> | UnaryFunction<P, ObservableInput<R>>

// Objects whose values are ObsOrFactory
// Note that if we use the actual ObsOtFactory, rather than duplicating the content, we do not the same type tooltip
type ObjOfObsOrFactory<P, T> = {[K in keyof T]: (ObservableInput<T[K]> | UnaryFunction<P, ObservableInput<T[K]>>)}



/* tslint:disable:max-line-length */

// Versions with values joined into an array
export function concatJoin(): Observable<[]>;
export function concatJoin<A>(source1: ObsOrFactory<[],A>): Observable<[A]>;
export function concatJoin<A, B>(source1: ObsOrFactory<[],A>, source2: ObsOrFactory<[A],B>): Observable<[A,B]>;
export function concatJoin<A, B, C>(source1: ObsOrFactory<[],A>, source2: ObsOrFactory<[A],B>, source3: ObsOrFactory<[A,B],C>): Observable<[A,B,C]>;
export function concatJoin<A, B, C, D>(source1: ObsOrFactory<[],A>, source2: ObsOrFactory<[A],B>, source3: ObsOrFactory<[A,B],C>, source4: ObsOrFactory<[A,B,C],D>): Observable<[A,B,C,D]>;
export function concatJoin<A, B, C, D, E>(source1: ObsOrFactory<[],A>, source2: ObsOrFactory<[A],B>, source3: ObsOrFactory<[A,B],C>, source4: ObsOrFactory<[A,B,C],D>, source5: ObsOrFactory<[A,B,C,D],E>): Observable<[A,B,C,D,E]>;
export function concatJoin<A, B, C, D, E, F>(source1: ObsOrFactory<[],A>, source2: ObsOrFactory<[A],B>, source3: ObsOrFactory<[A,B],C>, source4: ObsOrFactory<[A,B,C],D>, source5: ObsOrFactory<[A,B,C,D],E>, source6: ObsOrFactory<[A,B,C,D,E],F>): Observable<[A,B,C,D,E,F]>;

// Versions with values joined into an object
// Note that if we do not use the variable T, and simply put the A&B&C in the function result (which is logically), the
// tooltips are not as clear
export function concatJoin<A>(sources1: ObjOfObsOrFactory<{}, A>) : Observable<A>
export function concatJoin<A, B, T extends A&B>(sources1: ObjOfObsOrFactory<{}, A>, sources2: ObjOfObsOrFactory<A, B>) : Observable<{ [K in keyof T]: T[K] }>
export function concatJoin<A, B, C, T extends A&B&C>(sources1: ObjOfObsOrFactory<{}, A>, sources2: ObjOfObsOrFactory<A, B>, sources3: ObjOfObsOrFactory<A&B,C>) : Observable<{ [K in keyof T]: T[K] }>
export function concatJoin<A, B, C, D, T extends A&B&C&D>(sources1: ObjOfObsOrFactory<{}, A>, sources2: ObjOfObsOrFactory<A, B>, sources3: ObjOfObsOrFactory<A&B,C>, sources4: ObjOfObsOrFactory<A&B&C,D>) : Observable<{ [K in keyof T]: T[K] }>
export function concatJoin<A, B, C, D, E, T extends A&B&C&D&E>(sources1: ObjOfObsOrFactory<{}, A>, sources2: ObjOfObsOrFactory<A, B>, sources3: ObjOfObsOrFactory<A&B,C>, sources4: ObjOfObsOrFactory<A&B&C,D>, sources5: ObjOfObsOrFactory<A&B&C&D,E>) : Observable<{ [K in keyof T]: T[K] }>
export function concatJoin<A, B, C, D, E, F, T extends A&B&C&D&E&F>(sources1: ObjOfObsOrFactory<{}, A>, sources2: ObjOfObsOrFactory<A, B>, sources3: ObjOfObsOrFactory<A&B,C>, sources4: ObjOfObsOrFactory<A&B&C,D>, sources5: ObjOfObsOrFactory<A&B&C&D,E>, sources6: ObjOfObsOrFactory<A&B&C&D&E,F>) : Observable<{ [K in keyof T]: T[K] }>

/* tslint:enable:max-line-length */

export function concatJoin(...elements: (ObsOrFactory<any, any> | ObjOfObsOrFactory<any, any>)[] ) {
    return concatJoinFromArray(elements);
}

export function concatJoinFromArray(elements: (ObsOrFactory<any, any> | ObjOfObsOrFactory<any, any>)[] ) {
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
                return defer ( ()=> forkJoinHandlingEmpty(
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
function isPOJO(obj: any): obj is ObjOfObsOrFactory<any, any> {
    return obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;
}

// Utility function - same as forkJoin except that when the input is an empty array or object it emits
// an empty result
function forkJoinHandlingEmpty(sources: any[] | Object): Observable<any> {
    if (Array.isArray(sources) && sources.length===0) {
        return of([]);
    } else if (typeof sources ==='object' && Object.keys(sources).length===0) {
        return of ({});
    } else {
        return forkJoin(sources);
    }
}


