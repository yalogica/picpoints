import { PicPoints } from '@/picpoints';
import { Util } from '@/util';
import { BBox } from '@/bbox';
import { NodeType, SVG_NS, DEFAULT } from '@/types';
import { Shape, ShapeConfig } from '@/shapes/shape';


interface DOM {
    container: HTMLDivElement, 
};

export interface LocationConfig extends ShapeConfig {
};

export class Location<Config extends LocationConfig = LocationConfig> extends Shape<Config> {
    protected _nodeType: NodeType = NodeType.Location;

    private _dom: DOM = {
        container: document.createElement('div'),
    };

    constructor(config?: Config) {
        super(config);

        this._buildDOM();

        PicPoints.fire('shape:ready', this, { shape: this });
    };
    private _buildDOM(): void {
        this._dom.container.setAttribute('data-id', this.id);
        this._dom.container.setAttribute('data-type', this.type.toLowerCase());
        this._dom.container.setAttribute('data-name', this.name ?? '');
    };

    update(): void {
        if (!this.mapBoard?.active) {
            return;
        }
    };
    getContainer(): HTMLDivElement {
        return this._dom.container;
    };
    getBBox(): BBox {
        const bbox = new BBox(0, 0, 0, 0);
        return bbox;
    };
};