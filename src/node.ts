import { PicPoints } from '@/picpoints';
import { NodeType } from '@/types';
import { coreNodeAdd, coreNodeRemove } from './core';
import { customAlphabet } from 'nanoid';


export interface NodeConfig {
  id?: string;
  name?: string;
  className?: string;
};

export const nodeOnAdd = Symbol('onAdd');
export const nodeOnRemove = Symbol('onRemove');

export abstract class Node<Config extends NodeConfig = NodeConfig> {
    protected _nodeType: NodeType = NodeType.Node;
    protected _parent: Node | null = null;
    
    private _id: string;
    protected _name?: string;
    protected _className?: string;

    constructor(config?: Config) {
        if (config?.id) {
            this._id = config.id;
        } else {
            const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
            const nanoid = customAlphabet(alphabet, 10);
            this._id = nanoid();
        }

        this._name = config?.name;
    };
    
    private [nodeOnAdd](parent: Node): void {
        this._parent = parent;
        PicPoints[coreNodeAdd](this);
        this._onAdd(parent);
    };
    private [nodeOnRemove](parent: Node): void {
        PicPoints[coreNodeRemove](this);
        this._onRemove(parent);
        this._parent = null;
    };

    protected _onAdd(parent: Node): void {};
    protected _onRemove(parent: Node): void {};

    //#region Getters & Setters
    get id(): string {
        return this._id;
    };
    get name(): string | undefined {
        return this._name;
    };
    set name(name: string | undefined) {
        this._name = name;
    };
    get className(): string | undefined {
        return this._className;
    };
    get type(): NodeType {
        return this._nodeType;
    };
    get parent(): Node | null {
        return this._parent;
    };
    //#endregion
    
    abstract update(): void;
};