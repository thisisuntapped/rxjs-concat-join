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
type ObservableFromResultsSoFar = ((resultsSoFar: ResultsSoFar)=>ObservableInput<any>);
type InSequenceElement = ObservableInput<any> | ObservableFromResultsSoFar;

/* tslint:disable:max-line-length */
export function inSequence(obsOrFactories: []): Observable<[]>;
export function inSequence<A>(obsOrFactories: [ObservableInput<A>]): Observable<[A]>;
export function inSequence<A, B>(obsOrFactories: [ObservableInput<A>, ObservableInput<B> | ((priorResults: [A])=>ObservableInput<B>)]): Observable<[A, B]>;
export function inSequence<A, B, C>(obsOrFactories: [ObservableInput<A>, ObservableInput<B> | ((priorResults: [A])=>ObservableInput<B>), ObservableInput<C> | ((priorResults: [A, B])=>ObservableInput<C>)]): Observable<[A, B, C]>;
export function inSequence<A, B, C, D>(obsOrFactories: [ObservableInput<A>, ObservableInput<B> | ((priorResults: [A])=>ObservableInput<B>), ObservableInput<C> | ((priorResults: [A, B])=>ObservableInput<C>), ObservableInput<D> | ((priorResults: [A, B, C])=>ObservableInput<D>)]): Observable<[A, B, C, D]>;
export function inSequence<A, B, C, D, E>(obsOrFactories: [ObservableInput<A>, ObservableInput<B> | ((priorResults: [A])=>ObservableInput<B>), ObservableInput<C> | ((priorResults: [A, B])=>ObservableInput<C>), ObservableInput<D> | ((priorResults: [A, B, C])=>ObservableInput<D>),  ObservableInput<E> | ((priorResults: [A, B, C, D])=>ObservableInput<E>)]): Observable<[A, B, C, D, E]>;
export function inSequence<A, B, C, D, E, F>(obsOrFactories: [ObservableInput<A>, ObservableInput<B> | ((priorResults: [A])=>ObservableInput<B>), ObservableInput<C> | ((priorResults: [A, B])=>ObservableInput<C>), ObservableInput<D> | ((priorResults: [A, B, C])=>ObservableInput<D>),  ObservableInput<E> | ((priorResults: [A, B, C, D])=>ObservableInput<E>),  ObservableInput<F> | ((priorResults: [A, B, C, D, E])=>ObservableInput<F>)]): Observable<[A, B, C, D, E, F]>;
export function inSequence<A extends ObservableInput<any>[]>(sources: A): Observable<ObservedValuesFromArray<A>[]>;
/* tslint:enable:max-line-length */

export function inSequence(obsOrFactories: InSequenceElement[]) {
    if (obsOrFactories.length===0) return of([]);
    return defer(() => {
        let results: Array<any> = [];
        const appendToResults = (newResult: any) => results = [...results, newResult];
        const observables = obsOrFactories.map( obsOrFactory => {
            const obs$: Observable<any> = from((typeof obsOrFactory === 'function') ? defer(() => obsOrFactory(results)) : obsOrFactory);
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
