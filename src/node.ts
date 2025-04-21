import { HappyMap } from '@/happymap';
import { coreNodeAdd, coreNodeRemove } from './core';
import { Util } from '@/util';
import { NodeType } from '@/types';
import { Factory } from '@/factory';
import { customAlphabet } from 'nanoid';


export interface NodeConfig {
  id?: string;
  name?: string;
  className?: string | string[];
};

export const nodeOnAdd = Symbol('onAdd');
export const nodeOnRemove = Symbol('onRemove');

export abstract class Node<Config extends NodeConfig = NodeConfig> {
    protected _nodeType: NodeType = NodeType.Node;
    protected _id: string;
    protected _parent: Node | null = null;
    protected _attrs: any = {};

    name?: string;
    className?: string | string[];

    constructor(config?: Config) {
        if (config?.id) {
            this._id = config.id;
        } else {
            const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
            const nanoid = customAlphabet(alphabet, 10);
            this._id = nanoid();
        }

        // on initial set attrs wi don't need to fire change events
        // because nobody is listening to them yet
        this.setAttrs(config);

        Factory.addGetterSetterAndInitialize(this, 'name');
        Factory.addGetterSetterAndInitialize(this, 'className');
    };
    
    private [nodeOnAdd](parent: Node): void {
        this._parent = parent;
        HappyMap[coreNodeAdd](this);
        this._onAdd(parent);
    };
    private [nodeOnRemove](parent: Node): void {
        HappyMap[coreNodeRemove](this);
        this._onRemove(parent);
        this._parent = null;
    };

    protected _onAdd(parent: Node): void {};
    protected _onRemove(parent: Node): void {};

    /**
    * Get the node id
    */
    get id(): string {
        return this._id;
    };
    /**
    * Get the node type, which may return Stage, Artboard, Group, or shape types
    */
    get type(): NodeType {
        return this._nodeType;
    };
    /**
    * Get the node parent container
    */
    get parent(): Node | null {
        return this._parent;
    };
       
    /**
    * set multiple attrs at once using an object literal
    * @example
    * node.setAttrs({
    *   x: 5,
    *   fill: 'red'
    * });
    */
    setAttrs(config?: Config): this {
        if (!config) {
            return this;
        }

        for (let key in config) {
            this.setAttr(key, config[key]);
        }
        
        return this;
    };
    /**
    * set one attr
    * @example
    * node.setAttr('x', 5);
    */
    setAttr(key: string, val: any): void {
        const oldVal = this._attrs[key];
        if (oldVal === val && !Util.isObject(val)) {
          return;
        }
        if (val === undefined || val === null) {
          delete this._attrs[key];
        } else {
          this._attrs[key] = val;
        }
    };
    /**
    * get attr
    * @example
    * var x = node.getAttr('x');
    */
    getAttr(attr: string, direct: boolean = false) {
        if (!direct) {
            const method = 'get' + Util.capitalize(attr);
            if (Util.isFunction((this as any)[method])) {
                return (this as any)[method]();
            }
        }
        // otherwise get directly
        return this._attrs[attr];
    };
    
    abstract update(): void;
};