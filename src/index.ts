const PARAM_MATCHER = /\{([^{}]+)\}/g;
const PARAM_REGEX_STRING = '([^/]+)';

export type ExtractParamNames<Format extends string> =
  Format extends `${string}{${infer Param}}${infer Rest}`
    ? [Param, ...ExtractParamNames<Rest>]
    : Format extends `${string}{${infer Param}}`
    ? [Param]
    : [];

export type ExtractParamObject<Format extends string> =
  Format extends `${string}{${infer Param}}${infer Rest}`
    ? {
        [key in Param]: string;
      } & ExtractParamObject<Rest>
    : Format extends `${string}{${infer Param}}`
    ? { [key in Param]: string }
    : {};

class Route<
  Format extends string,
  ParamNames extends string[] = ExtractParamNames<Format>,
  ParamObject extends Record<string, string> = ExtractParamObject<Format>,
  IsStatic extends boolean = ParamNames['length'] extends 0 ? true : false,
> {
  public readonly format: Format;
  public readonly paramNames: ParamNames;
  public readonly isStatic: IsStatic;
  public readonly regex: RegExp;

  /**
   * Create a new route.
   * @param format The format of the route.
   * @example
   * const route = new Route('/foo');
   * // static route with no parameters
   * @example
   * const route = new Route('/foo/{bar}');
   * // dynamic route with a single parameter
   * @example
   * const route = new Route('/foo/{bar}/{baz}');
   * // dynamic route with multiple parameters
   */
  public constructor(format: Format) {
    const paramNames = [] as string[];
    const regexString = format.replaceAll(PARAM_MATCHER, (matchedParam) => {
      const paramName = matchedParam.slice(1, -1);
      paramNames.push(paramName);
      return PARAM_REGEX_STRING;
    });

    this.format = format;
    this.paramNames = paramNames as ParamNames;
    this.isStatic = (paramNames.length === 0) as IsStatic;
    this.regex = new RegExp(`^${regexString}$`);
  }

  /**
   * Test whether a path matches the route.
   * @param path The path to match against.
   * @returns a boolean indicating whether the path matches the route.
   * @example
   * const route = new Route('/foo');
   * // static route with no parameters
   *
   * route.match('/foo');
   * // this will match
   *
   * route.match('/bar');
   * // this will not match
   * @example
   * const route = new Route('/foo/{bar}');
   * // dynamic route with a single parameter
   *
   * route.match('/foo/abc')
   * // this will match
   *
   * route.match('/foo/abc/def')
   * // this will not match
   * @example
   * const route = new Route('/foo/{bar}/{baz}');
   * // dynamic route with multiple parameters
   *
   * route.match('/foo/abc/def');
   * // this will match
   *
   * route.match('/foo/abc');
   * // this will not match
   */
  public match(path: string): boolean {
    return this.regex.test(path);
  }

  /**
   * Parse a path into parameters.
   * @param path the path to parse.
   * @returns if the path matches the route, an object containing the parameters, otherwise null.
   * @example
   * const route = new Route('/foo');
   * // static route with no parameters
   *
   * route.parse('/foo');
   * // this will return an empty object {}
   *
   * route.parse('/bar');
   * // this will return null
   * @example
   * const route = new Route('/foo/{bar}');
   * // dynamic route with a single parameter
   *
   * route.parse('/foo/abc');
   * // this will return { bar: 'abc' }
   *
   * route.parse('/foo/abc/def');
   * // this will return null
   * @example
   * const route = new Route('/foo/{bar}/{baz}');
   * // dynamic route with multiple parameters
   *
   * route.parse('/foo/abc/def');
   * // this will return { bar: 'abc', baz: 'def' }
   *
   * route.parse('/foo/abc');
   * // this will return null
   */
  public parse(path: string): ParamObject | null {
    const match = path.match(this.regex);
    if (!match) {
      return null;
    }

    const params = {} as Record<string, string>;
    for (let i = 1; i < match.length; i++) {
      const segment = match[i];
      const paramName = this.paramNames[i - 1];
      params[paramName] = segment;
    }

    return params as ParamObject;
  }

  /**
   * Compile a path from the route.
   * @param params the parameters of the route.
   * @returns a path with the parameters replaced.
   * @example
   * const route = new Route('/foo');
   * // static route with no parameters
   *
   * route.compile();
   * // this will return '/foo'
   *
   * route.compile({});
   * // this will throw because no input is expected
   * @example
   * const route = new Route('/foo/{bar}');
   * // dynamic route with a single parameter
   *
   * route.compile();
   * // this will throw because no parameters are provided
   *
   * route.compile({});
   * // this will throw because 'bar' is missing
   *
   * route.compile({ bar: 'abc' });
   * // this will return '/foo/abc'
   * @example
   * const route = new Route('/foo/{bar}/{baz}');
   * // dynamic route with multiple parameters
   *
   * route.compile();
   * // this will throw because no parameters are provided
   *
   * route.compile({});
   * // this will throw because no parameters are provided
   *
   * route.compile({ bar: 'abc' });
   * // this will throw because 'baz' is missing
   *
   * route.compile({ baz: 'def' });
   * // this will throw because 'bar' is missing
   *
   * route.compile({ bar: 'abc', baz: 'def' });
   * // this will return '/foo/abc/def'
   */
  public compile(): IsStatic extends true ? Format : never;
  public compile(params: ParamObject): IsStatic extends false ? string : never;
  public compile(params: ParamObject | undefined = undefined): string {
    if (this.isStatic) {
      if (params) {
        throw new Error(`expected no parameters for static url: ${this.format}`);
      }

      return this.format;
    }

    if (!params) {
      throw new Error(`expected parameters for non-static url: ${this.format}`);
    }

    return this.format.replaceAll(PARAM_MATCHER, (matchedParam) => {
      const paramName = matchedParam.slice(1, -1);
      if (!params[paramName]) {
        throw new Error(`expected {${paramName}} in parameters for url: ${this.format}`);
      }

      return params[paramName];
    });
  }
}

export default Route;
export { Route };
