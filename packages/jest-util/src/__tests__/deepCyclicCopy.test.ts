/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import deepCyclicCopy from '../deepCyclicCopy';

it('returns the same value for primitive or function values', () => {
  const fn = () => {};

  expect(deepCyclicCopy(undefined)).toBeUndefined();
  expect(deepCyclicCopy(null)).toBeNull();
  expect(deepCyclicCopy(true)).toBe(true);
  expect(deepCyclicCopy(42)).toBe(42);
  expect(Number.isNaN(deepCyclicCopy(NaN))).toBe(true);
  expect(deepCyclicCopy('foo')).toBe('foo');
  expect(deepCyclicCopy(fn)).toBe(fn);
});

it('does not execute getters/setters, but copies them', () => {
  const fn = jest.fn();
  const obj = {
    // @ts-expect-error
    get foo() {
      fn();
    },
  };
  const copy = deepCyclicCopy(obj);

  expect(Object.getOwnPropertyDescriptor(copy, 'foo')).toBeDefined();
  expect(fn).not.toHaveBeenCalled();
});

it('copies symbols', () => {
  const symbol = Symbol('foo');
  const obj = {[symbol]: 42};

  expect(deepCyclicCopy(obj)[symbol]).toBe(42);
});

it('copies arrays as array objects', () => {
  const array = [null, 42, 'foo', 'bar', [], {}];

  expect(deepCyclicCopy(array)).toEqual(array);
  expect(Array.isArray(deepCyclicCopy(array))).toBe(true);
});

it('handles cyclic dependencies', () => {
  const cyclic: any = {a: 42, subcycle: {}};

  cyclic.subcycle.baz = cyclic;
  cyclic.bar = cyclic;

  expect(() => deepCyclicCopy(cyclic)).not.toThrow();

  const copy = deepCyclicCopy(cyclic);

  expect(copy.a).toBe(42);
  expect(copy.bar).toEqual(copy);
  expect(copy.subcycle.baz).toEqual(copy);
});

it('uses the blacklist to avoid copying properties on the first level', () => {
  const obj = {
    blacklisted: 41,
    blacklisted2: 42,
    subObj: {
      blacklisted: 43,
    },
  };

  expect(
    deepCyclicCopy(obj, {
      blacklist: new Set(['blacklisted', 'blacklisted2']),
    }),
  ).toEqual({
    subObj: {
      blacklisted: 43,
    },
  });
});

it('does not keep the prototype by default when top level is object', () => {
  // @ts-expect-error
  const sourceObject = new (function () {})();
  // @ts-expect-error
  sourceObject.nestedObject = new (function () {})();
  // @ts-expect-error
  sourceObject.nestedArray = new (function () {
    // @ts-expect-error
    this.length = 0;
  })();

  const spy = jest
    .spyOn(Array, 'isArray')
    .mockImplementation(object => object === sourceObject.nestedArray);

  const copy = deepCyclicCopy(sourceObject, {keepPrototype: false});

  expect(Object.getPrototypeOf(copy)).not.toBe(
    Object.getPrototypeOf(sourceObject),
  );
  expect(Object.getPrototypeOf(copy.nestedObject)).not.toBe(
    Object.getPrototypeOf(sourceObject.nestedObject),
  );
  expect(Object.getPrototypeOf(copy.nestedArray)).not.toBe(
    Object.getPrototypeOf(sourceObject.nestedArray),
  );

  expect(Object.getPrototypeOf(copy)).toBe(Object.getPrototypeOf({}));
  expect(Object.getPrototypeOf(copy.nestedObject)).toBe(
    Object.getPrototypeOf({}),
  );
  expect(Object.getPrototypeOf(copy.nestedArray)).toBe(
    Object.getPrototypeOf([]),
  );

  spy.mockRestore();
});

it('does not keep the prototype by default when top level is array', () => {
  const spy = jest.spyOn(Array, 'isArray').mockImplementation(() => true);

  // @ts-expect-error
  const sourceArray = new (function () {
    // @ts-expect-error
    this.length = 0;
  })();

  const copy = deepCyclicCopy(sourceArray);
  expect(Object.getPrototypeOf(copy)).not.toBe(
    Object.getPrototypeOf(sourceArray),
  );

  expect(Object.getPrototypeOf(copy)).toBe(Object.getPrototypeOf([]));
  spy.mockRestore();
});

it('does not keep the prototype of arrays when keepPrototype = false', () => {
  const spy = jest.spyOn(Array, 'isArray').mockImplementation(() => true);

  // @ts-expect-error
  const sourceArray = new (function () {
    // @ts-expect-error
    this.length = 0;
  })();

  const copy = deepCyclicCopy(sourceArray, {keepPrototype: false});
  expect(Object.getPrototypeOf(copy)).not.toBe(
    Object.getPrototypeOf(sourceArray),
  );

  expect(Object.getPrototypeOf(copy)).toBe(Object.getPrototypeOf([]));
  spy.mockRestore();
});

it('keeps the prototype of arrays when keepPrototype = true', () => {
  const spy = jest.spyOn(Array, 'isArray').mockImplementation(() => true);

  // @ts-expect-error
  const sourceArray = new (function () {
    // @ts-expect-error
    this.length = 0;
  })();

  const copy = deepCyclicCopy(sourceArray, {keepPrototype: true});
  expect(Object.getPrototypeOf(copy)).toBe(Object.getPrototypeOf(sourceArray));

  spy.mockRestore();
});

it('does not keep the prototype for objects when keepPrototype = false', () => {
  // @ts-expect-error
  const sourceobject = new (function () {})();
  // @ts-expect-error
  sourceobject.nestedObject = new (function () {})();
  // @ts-expect-error
  sourceobject.nestedArray = new (function () {
    // @ts-expect-error
    this.length = 0;
  })();

  const spy = jest
    .spyOn(Array, 'isArray')
    .mockImplementation(object => object === sourceobject.nestedArray);

  const copy = deepCyclicCopy(sourceobject, {keepPrototype: false});

  expect(Object.getPrototypeOf(copy)).not.toBe(
    Object.getPrototypeOf(sourceobject),
  );
  expect(Object.getPrototypeOf(copy.nestedObject)).not.toBe(
    Object.getPrototypeOf(sourceobject.nestedObject),
  );
  expect(Object.getPrototypeOf(copy.nestedArray)).not.toBe(
    Object.getPrototypeOf(sourceobject.nestedArray),
  );
  expect(Object.getPrototypeOf(copy)).toBe(Object.getPrototypeOf({}));
  expect(Object.getPrototypeOf(copy.nestedObject)).toBe(
    Object.getPrototypeOf({}),
  );
  expect(Object.getPrototypeOf(copy.nestedArray)).toBe(
    Object.getPrototypeOf([]),
  );

  spy.mockRestore();
});

it('keeps the prototype for objects when keepPrototype = true', () => {
  // @ts-expect-error
  const sourceObject = new (function () {})();
  // @ts-expect-error
  sourceObject.nestedObject = new (function () {})();
  // @ts-expect-error
  sourceObject.nestedArray = new (function () {
    // @ts-expect-error
    this.length = 0;
  })();

  const spy = jest
    .spyOn(Array, 'isArray')
    .mockImplementation(object => object === sourceObject.nestedArray);

  const copy = deepCyclicCopy(sourceObject, {keepPrototype: true});

  expect(Object.getPrototypeOf(copy)).toBe(Object.getPrototypeOf(sourceObject));
  expect(Object.getPrototypeOf(copy.nestedObject)).toBe(
    Object.getPrototypeOf(sourceObject.nestedObject),
  );
  expect(Object.getPrototypeOf(copy.nestedArray)).toBe(
    Object.getPrototypeOf(sourceObject.nestedArray),
  );
  spy.mockRestore();
});
