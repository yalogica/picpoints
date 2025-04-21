import { PicPoints } from '@/picpoints';
import { Util } from '@/util';
import { Factory } from '@/factory';
import { BBox } from '@/bbox';
import { NodeType, SVG_NS, DEFAULT } from '@/types';
import { Shape, ShapeConfig } from '@/shapes/shape';


interface DOM {
    container: HTMLDivElement, 
};

export interface IconConfig extends ShapeConfig {
    x?: number;
    y?: number;
};

export class Icon<Config extends IconConfig = IconConfig> extends Shape<Config> {
    protected _nodeType: NodeType = NodeType.Icon;

    private _dom: DOM = {
        container: document.createElement("div"),
    };

    x: number;
    y: number;

    constructor(config?: Config) {
        super(config);

        Factory.addGetterSetterAndInitialize(this, "x", DEFAULT.SHAPE.X);
        Factory.addGetterSetterAndInitialize(this, "y", DEFAULT.SHAPE.Y);
      
        this._buildDOM();

        HappyMap.fire("shape:ready", this, { shape: this });
    };

    private _buildDOM(): void {
        this._dom.container.setAttribute("data-id", this.id);
        this._dom.container.setAttribute("data-type", this.type.toLowerCase());
        this._dom.container.setAttribute("data-name", this.name ?? "");
    };

    update(): void {
        if (!this.artboard?.active) {
            return;
        }
    };

    getContainer(): HTMLDivElement {
        return this._dom.container;
    };
    getBBox(): BBox {
        const bbox = new BBox(this.x, this.y, 0, 0);
        return bbox;
    };
};