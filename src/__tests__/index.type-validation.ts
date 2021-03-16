/**
 * This file is not intended to be run, but to test the type definitiions by:
 * - showing errors in the IDE where there should be errors
 * - showing the inferred correct type in the IDE by hovering over items.
 *
 * To stop the file highlighted by the IDE as being in error we add the line // @ts-nocheck at the start of the file.
 * Comment this out (eg by adding an extra "///") to display the errors while testing.
 */

// @ts-nocheck - COMMENT OUT THIS LINE TO SEE THE ERRORS

import {concatJoin} from '../index';
import {of} from 'rxjs';




// CHECK THAT TYPE ERRORS ARE CORRECTLY GENERATED IF PARAMETERS ARE INVALID
concatJoin(1);
concatJoin('a');  // No error - a string has an iterator so matches standard ObservableInput
concatJoin(true);
concatJoin({a: 1});
concatJoin({a: 'a'}); // No error - a string has an iterator so matches standard ObservableInput
concatJoin({a: true});
concatJoin(([a])=>of('a'));


// We need 6 different types to test each of the variants of the function signature that go up to F

const string$ = of('a');
const number$ = of(1);
const boolean$ = of(true);
const arrString$ = of(['a']);
const arrNumber$ = of([1]);
const object$ = of({a:'a'});

// CHECK THE RETURN TYPE (hover over 'result') AND THE INFERRED PARAMETER TYPES OF FACTORY FUNCTIONS
// Note that by repeating the parameter in the body we suppress the error "unused parameter"

concatJoin().subscribe(result /*hover: []*/ => result);
concatJoin({}).subscribe(result /*hover: []*/ => result);;

concatJoin(
    string$,
    ([s/*string*/]  ) => {s; return number$},
).subscribe(result /*hover: [string, number]*/ => result);

concatJoin(
    string$,
    ([s/* string]*/]  ) => {s; return number$},
    ([s/* string*/, n /* number */]  ) => {s; n; return boolean$},
).subscribe(result /*hover`: [string, number, boolean]]*/ => result);

concatJoin(
    string$,
    ([s/* string]*/]  ) => {s; return number$},
    ([s/* string*/, n /* number */]  ) => {s; n; return boolean$},
    ([s/* string*/, n /* number */, b /* boolean */]  ) => {s; n; return arrString$},
).subscribe(result /*hover`: [string, number, boolean, string[] ]]*/ => result);

concatJoin(
    string$,
    ([s/* string]*/]  ) => {s; return number$},
    ([s/* string*/, n /* number */]  ) => {s; n; return boolean$},
    ([s/* string*/, n /* number */, b /* boolean */]  ) => {s; n; b; return arrString$},
    ([s/* string*/, n /* number */, b /* boolean */, as /* string[] */]  ) => {s; n; b; as; return arrNumber$},
).subscribe(result /*hover`: [string, number, boolean, string[], number[] ]]*/ => result);

concatJoin(
    string$,
    ([s/* string]*/]  ) => {s; return number$},
    ([s/* string*/, n /* number */]  ) => {s; n; return boolean$},
    ([s/* string*/, n /* number */, b /* boolean */]  ) => {s; n; b; return arrString$},
    ([s/* string*/, n /* number */, b /* boolean */, as /* string[] */]  ) => {s; n; b; as; return arrNumber$},
    ([s/* string*/, n /* number */, b /* boolean */, as /* string[] */, an /* number[] */]  ) => {s; n; b; as; an; return object$},
).subscribe(result /*hover`: [string, number, boolean, string[], number[], {a:string} ]]*/ => result);

concatJoin(
    {s: string$}
).subscribe(result /*hover: {s:string} */ => result);

concatJoin(
    {s: string$},
    {n: ({s /* hover: string*/ })=>{s; return number$}},
).subscribe(result /*hover: {s:string, n:number} */ => result);

concatJoin(
    {s: string$},
    {n: ({s /* string*/ })=>{s; return number$}},
    {b: ({s /* hover: string*/, n /* hover: number*/ })=>{s; n; return boolean$}},
).subscribe(result /*hover: {s:string, n:number, b:boolean} */ => result);

concatJoin(
    {s: string$},
    {n: ({s /* string*/ })=>{s; return number$}},
    {b: ({s /* string*/, n /* number*/ })=>{s; n; return boolean$}},
    {as: ({s /* hover: string*/, n /* hover: number*/, b /* hover: boolean*/ })=>{s; n; b; return arrString$}},
).subscribe(result /*hover: {s:string, n:number, b:boolean, as:string[]} */ => result);

concatJoin(
    {s: string$},
    {n: ({s /* string*/ })=>{s; return number$}},
    {b: ({s /* string*/, n /* number*/ })=>{s; n; return boolean$}},
    {as: ({s /* string*/, n /* number*/, b /* boolean*/ })=>{s; n; b; return arrString$}},
    {an: ({s /* hover: string*/, n /* hover: number*/, b /* hover: boolean*/, as /* hover: string[]*/ })=>{s; n; b; as; return arrNumber$}},
).subscribe(result /*hover: {s:string, n:number, b:boolean, as:string[], an:number[]} */ => result);

concatJoin(
    {s: string$},
    {n: ({s /* string*/ })=>{s; return number$}},
    {b: ({s /* string*/, n /* number*/ })=>{s; n; return boolean$}},
    {as: ({s /* string*/, n /* number*/, b /* boolean*/ })=>{s; n; b; return arrString$}},
    {an: ({s /* string*/, n /* number*/, b /* boolean*/, as /* string[]*/ })=>{s; n; b; as; return arrNumber$}},
    {obj: ({s /* hover: string*/, n /* hover: number*/, b /* hover: boolean*/, as /* hover: string[]*/ , an /* hover: number[] */})=>{s; n; b; as; an; return object$}},
).subscribe(result /*hover: {s:string, n:number, b:boolean, as:string[], an:number[], obj: {a:string} */ => result);
