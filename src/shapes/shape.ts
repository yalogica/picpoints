import { PicPoints } from '@/picpoints';
import { NodeType } from '@/types';
import { BBox } from '@/bbox';
import { Node, NodeConfig } from '@/node';
import { MapBoard, ContainerType } from '@/mapboard';


export interface ShapeConfig extends NodeConfig {
};

export const shapeAttachTo = Symbol('attachTo');
export const shapeDetachFrom = Symbol('detachFrom');
export const shapeSetParent = Symbol('detachFrom');

export abstract class Shape<Config extends ShapeConfig = ShapeConfig> extends Node<Config> {
    protected _nodeType: NodeType = NodeType.Shape;

    private _mapBoard: MapBoard | null = null;

    constructor(config?: Config) {
        super(config);
    };

    private [shapeAttachTo](mapBoard: MapBoard): void {
        this._attachTo(mapBoard);
    };
    private [shapeDetachFrom](mapBoard: MapBoard): void {
        this._detachFrom(mapBoard);
    };
    private [shapeSetParent](parent: Node): void {
        this._parent = parent;
    };

    protected _onAdd(mapBoard: MapBoard): void {
        PicPoints.fire('shape:add', mapBoard, { shape: this });

        if (mapBoard.active) {
            this._attachTo(mapBoard);
        }
    };
    protected _onRemove(mapBoard: MapBoard): void {
        if (this.mapBoard) {
            this._detachFrom(this.mapBoard);
        }

        PicPoints.fire('shape:remove', mapBoard, { shape: this });
    };
    protected _attachTo(mapBoard: MapBoard): void {
        this._mapBoard = mapBoard;

        if (this.parent) {
            if (this.parent.type === NodeType.MapBoard) {
                const container = (this.parent as MapBoard).getContainer(ContainerType.Shapes);
                container.appendChild(this.getContainer());
            }
        }
    };
    protected _detachFrom(mapBoard: MapBoard): void {
        if (this.parent) {
            if (this.parent.type === NodeType.MapBoard) {
                const container = (this.parent as MapBoard).getContainer(ContainerType.Shapes);
                container.contains(this.getContainer()) && container.removeChild(this.getContainer());
            }
        }

        this._mapBoard = null;
    };

    get active(): boolean {
        return this._mapBoard?.active ?? false;
    };

    get mapBoard(): MapBoard | null {
        return this._mapBoard;
    };


    remove(): boolean {
        if (this.parent) {
            if (this.parent.type === NodeType.MapBoard) {
                return (this.parent as MapBoard).remove(this);
            }
        };
        
        return false;
    };

    abstract getContainer(): HTMLDivElement;
    abstract getBBox(): BBox;
};
