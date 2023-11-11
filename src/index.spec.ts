import { it, expect } from 'vitest';
import Route from '.';
import { describe } from 'node:test';

describe('static route', () => {
  const route = new Route('/foo');

  it('should initialize', () => {
    expect(route.format).toBe('/foo');
    expect(route.paramNames).toEqual([]);
    expect(route.isStatic).toBe(true);
  });

  it('should match', () => {
    expect(route.match('/foo')).toEqual(true);
    expect(route.match('/bar')).toEqual(false);
  });

  it('should parse', () => {
    expect(route.parse('/foo')).toEqual({});
    expect(route.parse('/bar')).toEqual(null);
  });

  it('should compile', () => {
    expect(() => route.compile({})).toThrowError('expected no parameters for static url: /foo');
    expect(() => route.compile({ foo: 'bar' } as any)).toThrowError(
      'expected no parameters for static url: /foo'
    );
    expect(route.compile()).toBe('/foo');
  });
});

describe('route with a single param', () => {
  const route = new Route('/foo/{bar}');
  it('should initialize', () => {
    expect(route.format).toBe('/foo/{bar}');
    expect(route.paramNames).toEqual(['bar']);
    expect(route.isStatic).toBe(false);
  });

  it('should match', () => {
    expect(route.match('/foo/abc')).toEqual(true);
    expect(route.match('/foo/abc/def')).toEqual(false);
  });

  it('should parse', () => {
    expect(route.parse('/foo/abc')).toEqual({ bar: 'abc' });
    expect(route.parse('/foo/abc/def')).toEqual(null);
  });

  it('should compile', () => {
    expect(() => route.compile()).toThrowError(
      'expected parameters for non-static url: /foo/{bar}'
    );
    expect(() => route.compile({} as any)).toThrowError(
      'expected {bar} in parameters for url: /foo/{bar}'
    );
    expect(route.compile({ bar: 'abc' })).toBe('/foo/abc');
  });

  it('should throw', () => {});
});

describe('route with multiple params', () => {
  const route = new Route('/foo/{bar}/{baz}');
  it('should initialize', () => {
    expect(route.format).toBe('/foo/{bar}/{baz}');
    expect(route.paramNames).toEqual(['bar', 'baz']);
    expect(route.isStatic).toBe(false);
  });

  it('should match', () => {
    expect(route.match('/foo/abc/def')).toEqual(true);
    expect(route.match('/foo/abc')).toEqual(false);
  });

  it('should parse', () => {
    expect(route.parse('/foo/abc/def')).toEqual({ bar: 'abc', baz: 'def' });
    expect(route.parse('/foo/abc')).toEqual(null);
  });

  it('should compile', () => {
    expect(() => route.compile()).toThrowError(
      'expected parameters for non-static url: /foo/{bar}/{baz}'
    );
    expect(() => route.compile({ bar: 'abc' } as any)).toThrowError(
      'expected {baz} in parameters for url: /foo/{bar}/{baz}'
    );
    expect(route.compile({ bar: 'abc', baz: 'def' })).toBe('/foo/abc/def');
  });
});
