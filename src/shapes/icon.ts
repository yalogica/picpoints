import { PicPoints } from '@/picpoints';
import { Util } from '@/util';
import { BBox } from '@/bbox';
import { NodeType, SVG_NS, DEFAULT } from '@/types';
import { Shape, ShapeConfig } from '@/shapes/shape';


interface DOM {
    container: HTMLDivElement, 
};

export interface IconConfig extends ShapeConfig {
    x?: number;
    y?: number;
    size?: number;
};

export class Icon<Config extends IconConfig = IconConfig> extends Shape<Config> {
    protected _nodeType: NodeType = NodeType.Icon;

    private _dom: DOM = {
        container: document.createElement('div'),
    };

    private _x: number;
    private _y: number;
    private _size: number;

    constructor(config?: Config) {
        super(config);

        this._x = config?.x ?? DEFAULT.SHAPE.X;
        this._y = config?.y ?? DEFAULT.SHAPE.Y;
        this._size = config?.size ?? DEFAULT.SHAPE.SIZE;
      
        this._buildDOM();

        PicPoints.fire('shape:ready', this, { shape: this });
    };
    
    private _buildDOM(): void {
        this._dom.container.setAttribute('data-id', this.id);
        this._dom.container.setAttribute('data-type', this.type.toLowerCase());
        this._dom.container.setAttribute('data-name', this.name ?? '');
    };

    //#region Getters & Setters
    get x(): number {
        return this._x;
    };
    get y(): number {
        return this._y;
    };
    get size(): number {
        return this._size;
    };
    //#endregion

    //#region Public
    update(): void {
        if (!this.mapBoard?.active) {
            return;
        }
    };
    getContainer(): HTMLDivElement {
        return this._dom.container;
    };
    getBBox(): BBox {
        const bbox = new BBox(this.x, this.y, this.size, this.size);
        return bbox;
    };
    //#endregion
};