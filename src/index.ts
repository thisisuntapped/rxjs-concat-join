import {concatAll, last, map, mapTo, mergeMap, tap} from 'rxjs/operators';
import {concat, defer, forkJoin, from, Observable, ObservedValueOf, of} from 'rxjs';
import {ObservableInput, ObservedValuesFromArray} from 'rxjs/internal/types';

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
 * inSequence has the same signature as inParallel, except that it does not all for the passing of an object (
 * because the requests are performed in the defined order, and the order of properties of an object cannot be
 * guaranteed according to the language definition).
 *
 *
 */


type ResultsSoFar = any[];
type ObservableFromResultsSoFar<T> = ((resultsSoFar: ResultsSoFar)=>ObservableInput<T>);
type InSequenceElement<T> = ObservableInput<T> | ObservableFromResultsSoFar<T>;

/* tslint:disable:max-line-length */
export function inSequence(elements: []): Observable<[]>;
export function inSequence<A>(elements: [InSequenceElement<A>]): Observable<[A]>;
export function inSequence<A, B>(elements: [InSequenceElement<A>, InSequenceElement<B>]): Observable<[A, B]>;
export function inSequence<A, B, C>(elements: [InSequenceElement<A>, InSequenceElement<B>, InSequenceElement<C>]): Observable<[A, B, C]>;
export function inSequence<A, B, C, D>(elements: [InSequenceElement<A>, InSequenceElement<B>, InSequenceElement<C>, InSequenceElement<D>]): Observable<[A, B, C, D]>;
export function inSequence<A, B, C, D, E>(elements: [InSequenceElement<A>, InSequenceElement<B>, InSequenceElement<C>, InSequenceElement<D>, InSequenceElement<E>]): Observable<[A, B, C, D, E]>;
export function inSequence<A, B, C, D, E, F>(elements: [InSequenceElement<A>, InSequenceElement<B>, InSequenceElement<C>, InSequenceElement<D>, InSequenceElement<E>, InSequenceElement<F>]): Observable<[A, B, C, D, E, F]>;
export function inSequence<A extends ObservableInput<any>[]>(sources: A): Observable<ObservedValuesFromArray<A>[]>;
/* tslint:enable:max-line-length */

export function inSequence(elements: any[]) {
    if (elements.length===0) return of([]);
    return defer(() => {
        let results: Array<any> = [];
        const appendToResults = (newResult: any) => results = [...results, newResult];
        const observables = elements.map( element => {
            const obs$: Observable<any> = from(
                (typeof element === 'function') ?
                    defer(() => element(results)) :
                    element
            );
            return obs$.pipe(
              tap(appendToResults)
            );
        })
        return from(observables).pipe(concatAll(), last(), map(_ => results));
    });
}

export function inSequenceUncollated(observables: ObservableInput<any>[]): Observable<void> {
    return observables.length>0? concat(...observables).pipe(last(), mapTo(void 0)) : of(void 0);
}

export function inParallelUncollated(observables: ObservableInput<any>[]): Observable<void> {
    return inParallel(observables).pipe(mapTo(void 0));
}
