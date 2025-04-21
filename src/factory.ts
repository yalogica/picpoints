import { Node } from '@/node';
import { Util } from '@/util';


const GET = 'get';
const SET = 'set';

interface GetSet<Type, This> {
    (): Type;
    (v: Type): This;
}

/**
 * Enforces that a type is a string.
 */
type EnforceString<T> = T extends string ? T : never;

/**
 * Represents a class.
 */
type Constructor = abstract new (...args: any) => any;

/**
 * An attribute of an instance of the provided class. Attributes names be strings.
 */
type Attr<T extends Constructor> = EnforceString<keyof InstanceType<T>>;

/**
 * A function that is called after a setter is called.
 */
type AfterFunc = (attr: string) => void;

/**
 * Extracts the type of a GetSet.
 */
type ExtractGetSet<T> = T extends GetSet<infer U, any> ? U : never;

/**
 * Extracts the type of a GetSet class attribute.
 */
type Value<T extends Constructor, U extends Attr<T>> = ExtractGetSet<InstanceType<T>[U]>;

/**
 * A function that validates a value.
 */
type ValidatorFunc<T> = (val: ExtractGetSet<T>, attr: string) => T;

export const Factory = {
  /**
   * Adds getter and setter methods for a specified attribute to a given node instance.
   *
   * This function dynamically creates getter and setter methods for the specified attribute on the node instance.
   * If the getter or setter methods already exist, they will not be overwritten. The getter returns the attribute's value
   * or the default value if the attribute is undefined. The setter validates the value using the provided validator function
   * (if any) before setting the attribute and calls the after function (if provided) after setting the value.
   * If the initialize flag is true, the attribute will be initialized with its current value after the getter and setter
   * are added.
   */
  addGetterSetter<T extends Constructor, U extends Attr<T>>(
      node: InstanceType<T>,
      attr: U,
      def?: Value<T, U>,
      validator?: ValidatorFunc<Value<T, U>>,
      after?: AfterFunc,
      initialize?: boolean
  ): void {
    const methodName = Util.capitalize(attr);
    const getMethodName = GET + methodName;
    const setMethodName = SET + methodName;

    let getMethod = node[getMethodName];
    if (typeof getMethod !== 'function') {
      getMethod = function(this: Node) {
        const val = this._attrs[attr];
        return val === undefined ? def : val;
      }
    }

    let setMethod = node[setMethodName];
    if (typeof setMethod !== 'function') {
      setMethod = function(this: Node, val: any) {
        if (validator && val !== undefined && val !== null) {
          val = validator.call(this, val, attr);
        }
  
        this.setAttr(attr, val);

        if (after) {
          after.call(this, attr);
        }
      };
    }

    Object.defineProperty(node, attr, {
      get: getMethod,
      set: setMethod,
      enumerable: true,
      configurable: true
    });

    if (initialize) {
      node[attr] = node[attr];
    }
  },
  addGetterSetterAndInitialize<T extends Constructor, U extends Attr<T>>(
    node: InstanceType<T>,
    attr: U,
    def?: Value<T, U>,
    validator?: ValidatorFunc<Value<T, U>>,
    after?: AfterFunc,
  ): void {
    Factory.addGetterSetter(node, attr, def, validator, after, true);
  }
};