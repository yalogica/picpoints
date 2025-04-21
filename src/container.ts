import { Node } from '@/node';
import { MapBoard } from '@/mapboard';
import { Shape } from '@/shapes/shape';


export interface IContainer<T extends MapBoard | Shape> {
    forEach(callbackFn: (child: T) => void): void;
    forEachInverse(callbackFn: (child: T) => void): void;
    count(): number;
    countAll(): number;
    hasChildren(): boolean;
    getChildren(): T[];
    hasChild(child: T | string): boolean;
    getChild(child: T | string): T | null;
    getChild(callbackFn: (child: T) => boolean): T | null;
    getChild(arg: T | string | ((child: T) => boolean)): T | null;
    add(node: T, pos?: number): boolean;
    remove(node: T | string): boolean;
    move(nodes: T | string | (T | string)[], pos: number): {node: T, pos: number}[];
};