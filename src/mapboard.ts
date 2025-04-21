import { PicPoints } from '@/picpoints';
import { Util } from '@/util';
import { MATRIX } from '@/matrix';
import { BBox } from '@/bbox';
import { Factory } from '@/factory';
import { NodeType, ZoomType, Point, DEFAULT } from '@/types';
import { Node, NodeConfig, nodeOnAdd, nodeOnRemove } from '@/node';
import { IContainer } from '@/container';
import { InteractiveMap } from '@/interactivemap';
import { Shape, shapeAttachTo, shapeDetachFrom, shapeSetParent } from '@/shapes/shape';


interface DOM {
    mapboard: HTMLDivElement;
    viewbox: HTMLDivElement;
    transform: HTMLDivElement;
    layers: HTMLDivElement;
    background: HTMLDivElement;
    overlay: HTMLDivElement;
    shapes: HTMLDivElement;
};

interface View {
    matrix: MATRIX;
    prev: {
        pos: Point;
        zoom: number;
    }
};

interface Dirty {
    pos: boolean;
    zoom: boolean;
    maintainAspectRatio: boolean;
};

export enum ContainerType {
    Viewbox = 'viewbox',
    Layers = 'layers',
    Shapes = 'shapes'
};

export interface MapBoardConfig extends NodeConfig {
    image?: HTMLImageElement | string,
    useImageSize?: boolean,
    width?: number,
    height?: number,
    pos?: Point,
    zoom?: ZoomType,
    maintainAspectRatio?: boolean,
    effectShow?: string,
    effectHide?: string,
    effectDuration?: number
};

export const mapBoardAttachTo = Symbol('attachTo');
export const mapBoardDetachFrom = Symbol('detachFrom');
export const mapBoardShow = Symbol('show');
export const mapBoardHide = Symbol('hide');


export class MapBoard<Config extends MapBoardConfig = MapBoardConfig> extends Node<Config> implements IContainer<Shape> {
    protected _nodeType: NodeType = NodeType.MapBoard;
    
    private _dom: DOM = { 
        mapboard: document.createElement('div'),
        viewbox: document.createElement('div'),
        transform: document.createElement('div'),
        layers: document.createElement('div'),
        background: document.createElement('div'),
        overlay: document.createElement('div'),
        shapes: document.createElement('div')
    };
    private _active: boolean = false;
    private _interactiveMap: InteractiveMap | null = null;
    private _shapes: Shape[] = [];
    private _view: View = {
        matrix: new MATRIX(),
        prev: {
            pos: {x: 0, y:0},
            zoom: 1
        }
    };
    private _dirty: Dirty = {
        pos: true,
        zoom: true,
        maintainAspectRatio: true
    };
    private _showPromiseReject: ((mapBoard: MapBoard) => void) | null;
    private _hidePromiseReject: ((mapBoard: MapBoard) => void) | null;

    image: HTMLImageElement | string;
    useImageSize: boolean;
    width: number;
    height: number; 
    pos: Point;
    zoom: ZoomType;
    maintainAspectRatio: boolean;
    effectShow: string;
    effectHide: string;
    effectDuration: number;

    constructor(config?: Config) {
        super(config);

        // the order is important if the property values are relative (e.g., width, height, and useImageSize).
        Factory.addGetterSetterAndInitialize(this, 'className');
        Factory.addGetterSetterAndInitialize(this, 'width');
        Factory.addGetterSetterAndInitialize(this, 'height');
        Factory.addGetterSetterAndInitialize(this, 'image');
        Factory.addGetterSetterAndInitialize(this, 'useImageSize', DEFAULT.MAPBOARD.USE_IMAGE_SIZE);
        Factory.addGetterSetterAndInitialize(this, 'pos', DEFAULT.MAPBOARD.POS);
        Factory.addGetterSetterAndInitialize(this, 'zoom', DEFAULT.MAPBOARD.ZOOM);
        Factory.addGetterSetterAndInitialize(this, 'maintainAspectRatio', DEFAULT.MAPBOARD.MAINTAIN_ASPECT_RATIO);        
        Factory.addGetterSetterAndInitialize(this, 'effectShow');
        Factory.addGetterSetterAndInitialize(this, 'effectHide');
        Factory.addGetterSetterAndInitialize(this, 'effectDuration');

        this._buildDOM();

        PicPoints.fire('mapboard:ready', this, { mapBoard: this });
    };
    
    private [mapBoardAttachTo](interactiveMap: InteractiveMap): void {
       this._attachTo(interactiveMap);
    };
    private [mapBoardDetachFrom](interactiveMap: InteractiveMap): void {
       this._detachFrom(interactiveMap); 
    };
    private async [mapBoardShow](interactiveMap: InteractiveMap, force?: boolean): Promise<MapBoard | null> {
        return this._show(interactiveMap, force);
    };
    private async [mapBoardHide](interactiveMap: InteractiveMap, force?: boolean): Promise<MapBoard | null> {
        return this._hide(interactiveMap, force);
    };
    
    private _buildDOM() {
        this._dom.mapboard.classList.add('picpnts-mapboard');
        this._dom.mapboard.setAttribute('data-id', this.id);
        this._dom.mapboard.setAttribute('data-type', this.type.toLowerCase());

        this._dom.viewbox.classList.add('picpnts-viewbox');
        this._dom.transform.classList.add('picpnts-transform');
        this._dom.layers.classList.add('picpnts-layers');
        this._dom.background.classList.add('picpnts-background');
        this._dom.overlay.classList.add('picpnts-background');
        this._dom.shapes.classList.add('picpnts-shapes');
        
        this._dom.mapboard.appendChild(this._dom.viewbox);
        this._dom.viewbox.appendChild(this._dom.transform);
        this._dom.transform.appendChild(this._dom.layers);
        this._dom.layers.appendChild(this._dom.background);
        this._dom.layers.appendChild(this._dom.overlay);
        this._dom.layers.appendChild(this._dom.shapes);
    };
    private _cancelShow(): void {
        if (this._showPromiseReject == null) {
            return;
        }

        this.effectShow && this._dom.layers.classList.remove(this.effectShow);
        this._showPromiseReject(this);
        this._showPromiseReject = null;
    };
    private _cancelHide(): void {
        if (this._hidePromiseReject == null) {
            return;
        }

        this.effectHide && this._dom.layers.classList.remove(this.effectHide);
        this._hidePromiseReject(this);
        this._hidePromiseReject = null;
    };
    private _attachTo(interactiveMap: InteractiveMap): void {
        if (!this.interactiveMap?.hasChild(this)) {
            Util.warn(`MapBoard '${Util.nodeId(this)}' is not assigned to InteractiveMap '${Util.nodeId(interactiveMap)}'. The '_attachTo' operation was ignored.`);
            return;
        };

        this._shapes.forEach((shape) => {
            shape[shapeAttachTo](this);
        });

        this.interactiveMap.getInnerContainer().prepend(this._dom.mapboard);
        
        this._active = true;

        this._updatePosZoom(true);
        this._update();
    };
    private _detachFrom(interactiveMap: InteractiveMap): void {
        if (!this.interactiveMap?.hasChild(this)) {
            Util.warn(`MapBoard '${Util.nodeId(this)}' is not assigned to InteractiveMap '${Util.nodeId(interactiveMap)}'. The '_detachFrom' operation was ignored.`);
            return;
        };
        
        if (this.interactiveMap.getInnerContainer().contains(this._dom.mapboard)) {
            this.interactiveMap.getInnerContainer().removeChild(this._dom.mapboard);
            this._shapes.forEach((shape) => {
                shape[shapeDetachFrom](this);
            });
        };

        this._active = false;
    };
    private async _show(interactiveMap: InteractiveMap, force?: boolean): Promise<MapBoard | null> {
        if (!this.interactiveMap?.hasChild(this)) {
            Util.warn(`MapBoard '${Util.nodeId(this)}' is not assigned to InteractiveMap '${Util.nodeId(interactiveMap)}'. The '_show' operation was ignored.`);
            return null;
        };
        
        if (this._showPromiseReject) {
            return null;
        };

        this._cancelHide();

        if (force) {
            return Promise.resolve(this);
        }
        
        return new Promise((resolve, reject) => {
            this._showPromiseReject = reject;

            const doResolve = () => {
                if(this._showPromiseReject) {
                    this._showPromiseReject = null;
                    this.effectShow && this._dom.layers.classList.remove(this.effectShow);
                    resolve(this);
                }
            }

            this.effectShow && this._dom.layers.classList.add(this.effectShow);
            const computedStyle = window.getComputedStyle(this._dom.layers);

            if (parseFloat(computedStyle.animationDuration) == 0) {
                doResolve();
            } else {
                this._dom.layers.addEventListener('animationend', doResolve, { once: true });
            }
        });
    };
    private async _hide(interactiveMap: InteractiveMap, force?: boolean): Promise<MapBoard | null> {
        if (!this.interactiveMap?.hasChild(this)) {
            Util.warn(`MapBoard '${Util.nodeId(this)}' is not assigned to InteractiveMap '${Util.nodeId(interactiveMap)}'. The '_hide' operation was ignored.`);
            return null;
        };

        if (this._hidePromiseReject) {
            return null;
        }

        this._cancelShow();

        if (force) {
            return Promise.resolve(this);
        }

        return new Promise((resolve, reject) => {
            this._hidePromiseReject = reject;

            const doResolve = () => {
                if (this._hidePromiseReject) {
                    this._hidePromiseReject = null;
                    this.effectHide && this._dom.layers.classList.remove(this.effectHide);
                    resolve(this);
                }
            }

            this.effectHide && this._dom.layers.classList.add(this.effectHide);
            const computedStyle = window.getComputedStyle(this._dom.layers);

            if (parseFloat(computedStyle.animationDuration) == 0) {
                doResolve();
            } else {
                this._dom.layers.addEventListener('animationend', doResolve, { once: true });
            }
        });
    };
    private _zoomBy(delta?: number, focalPoint?: Point): void {
        const pos = this.getCurrentPosition();

        delta = delta ? delta : 1;
        focalPoint = focalPoint ? focalPoint : pos;

        const p = this._view.matrix.inverse().transformPoint(focalPoint);

        this._view.matrix.translate({x: p.x, y: p.y})
        .scale(delta, delta)
        .translate({x: -p.x, y: -p.y});

        // update the zoom attr, after this._view.matrix is changed 
        this.setAttr('zoom', this._view.matrix.zoom);

        this._updatePosZoom();
    };
    private _setDirty(...keys: (keyof Dirty)[]): void {
        this._dirty = {
            ...this._dirty,
            ...keys.reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {} as Partial<Dirty>)
        };
    };
    private _updateAspectRatio(): void {
        if (!this._dirty.maintainAspectRatio) {
            return;
        }

        if (this.maintainAspectRatio && this.width && this.height) {            
            const aspectRatio = this.width / this.height;

            const container = this.interactiveMap?.container;
            if (container) {
                const w = container.clientWidth;
                const h = w / aspectRatio;

                container.style.width = `${w}px`;
                container.style.height = `${h}px`;

                this._dirty.maintainAspectRatio = false;
            }
        } else {
            const container = this.interactiveMap?.container;
            if (container) {
                container.style.width = '';
                container.style.height = '';

                this._dirty.maintainAspectRatio = false;
            }
        }
    };
    private _updatePos(): void {
        if (!this._dirty.pos) {
            return;
        }

        let pos = this.pos; 
        pos = pos === undefined ? DEFAULT.MAPBOARD.POS : pos;

        this._view.matrix.move(pos);
        this._dirty.pos = false;
    };
    private _updateZoom(): void {
        if (!this._dirty.zoom) {
            return;
        }

        let zoom = this.zoom;
        if (typeof zoom === 'string') {
            if (this.interactiveMap) {
                let rcArtboard = this._dom.mapboard.getBoundingClientRect();
                let ratioW = 1, ratioH = 1;

                if (this.useImageSize) {
                    if (this.image instanceof HTMLImageElement && this.image.naturalWidth && this.image.naturalHeight) {
                        ratioW = rcArtboard.width / this.image.naturalWidth;
                        ratioH = rcArtboard.height / this.image.naturalHeight;
                    }
                } else if (this.width && this.height) {
                    ratioW = rcArtboard.width / this.width;
                    ratioH = rcArtboard.height / this.height;
                }

                switch(zoom) {
                    case 'contain': {
                        zoom = ratioW > ratioH ? ratioH : ratioW;
                    } break;
                    case 'cover': {
                        zoom = ratioW > ratioH ? ratioW : ratioH;
                    } break;
                }
            } else {
                zoom = DEFAULT.MAPBOARD.ZOOM;
            }
        }
        zoom = zoom === undefined ? DEFAULT.MAPBOARD.ZOOM : zoom;

        this._view.matrix.setZoom(zoom);
        this._dirty.zoom = false;
    };
    private _update(): void {
        this.update();
    };
    private _updatePosZoom(force: boolean = false): void {
        if (!this.interactiveMap) {
            return;
        }

        this._updateAspectRatio();
        this._updatePos();       
        this._updateZoom();
        
        const pos = this.getCurrentPosition();
        const zoom = this.getCurrentZoom();

        let dirtyZoom = false;
        let dirtyPos = false;

        if (this._view.prev.pos.x != pos.x || this._view.prev.pos.y != pos.y || force) {
            dirtyPos = true;
        }

        if (this._view.prev.zoom != zoom || force) {
            dirtyZoom = true;
        }

        if (dirtyPos) {
            let rcArtboard = this._dom.mapboard.getBoundingClientRect();
            let x = pos.x + rcArtboard.width  / 2;
			let	y = pos.y + rcArtboard.height / 2;

            this._dom.transform.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }

        if (dirtyZoom) {
            const width = this.width * zoom;
            const height = this.height * zoom;

            this._dom.background.style.width = `${width}px`;
            this._dom.background.style.height = `${height}px`;

            this._dom.shapes.style.width = `${width}px`;
            this._dom.shapes.style.height = `${height}px`;
        }

        this._view.prev.pos = pos;
        this._view.prev.zoom = zoom;

        //!!!!if (dirtyPos || dirtyZoom) {
            //!!!!this.interactiveMap.transformer.update();
        //!!!!}
    };

    /**
    * set css classes for the artboard element
    */
    private setClassName(className: string): void {
        const prev = this.getAttr('className');
       
        prev && this._dom?.mapboard.classList.remove(...prev.split(' '));
        className && this._dom?.mapboard.classList.add(...className.split(' '));

        this.setAttr('className', className);
    };
    /**
    * set artboard image
    */
    private setImage(image: HTMLImageElement | string): void {
        if (typeof image === 'string') {
            const imageElement = new Image();
            imageElement.src = image;
         
            imageElement.onload = () => {
                if (this._dom) {
                    this._dom.background.replaceChildren(imageElement);

                    this._setDirty('maintainAspectRatio', 'zoom');
                    this._updatePosZoom(true);
                    this._update();
                }
            }
            imageElement.onerror = () => {
                Util.warn(`Unable to load image for MapBoard '${Util.nodeId(this)}'.`);
            }
            this.setAttr('image', imageElement);
        } else if(image instanceof HTMLImageElement) {
            if (this._dom) {
                this._dom.background.replaceChildren(image);

                this._setDirty('maintainAspectRatio', 'zoom');
                
                this._updatePosZoom(true);
                this._update();
            }
            this.setAttr('image', image);
        }
    };
    /**
    * set the artboard "use image size" option
    */
    private setUseImageSize(useImageSize: boolean): void {
        this.setAttr('useImageSize', useImageSize);
        this._updatePosZoom(true);
    };
    /**
    * set & get artboard image width
    */
    private setWidth(width: number): void {
        this.setAttr('width', width);
        this.useImageSize = false;
        this._updatePosZoom(true);
        this._update();
    };
    private getWidth(): number {
        if (this.useImageSize && this.image instanceof HTMLImageElement) {
            return this.image.naturalWidth;
        }
        return this.getAttr('width', true) ?? DEFAULT.MAPBOARD.WIDTH;
    };
    /**
    * set & get artboard image height
    */
    private setHeight(height: number): void {
        this.setAttr('height', height);
        this.useImageSize = false;
        this._updatePosZoom(true);
        this._update();
    }
    private getHeight(): number {
        if (this.useImageSize && this.image instanceof HTMLImageElement) {
            return this.image.naturalHeight;
        }
        return this.getAttr('height', true) ?? DEFAULT.MAPBOARD.HEIGHT;
    };
    /**
    * set artboard zoom
    */
    private setZoom(zoom: ZoomType): void {
        this.setAttr('zoom', zoom);
        this._setDirty('zoom');
        this._updatePosZoom(true);
    };
    /**
    * set artboard position
    */
    private setPos(pos: Point): void {
        this.setAttr('pos', pos);
        this._setDirty('pos');
        this._updatePosZoom(true);
    };
    private setMaintainAspectRatio(maintainAspectRatio: boolean): void {
        this.setAttr('maintainAspectRatio', maintainAspectRatio);
        this._setDirty('maintainAspectRatio');
        this._updatePosZoom(true);
    };

    protected _onAdd(interactiveMap: InteractiveMap): void {
        this._interactiveMap = interactiveMap;
        PicPoints.fire('mapboard:add', interactiveMap, { mapBoard: this });
    };
    protected _onRemove(interactiveMap: InteractiveMap): void {
        this._interactiveMap = null;
        PicPoints.fire('mapboard:remove', interactiveMap, { mapBoard: this });
    };

    get active(): boolean {
        return this._active;
    };

    get interactiveMap(): InteractiveMap | null {
        return this._interactiveMap;
    };
    
    /**
    * get the current zoom level of the artboard
    */
    getCurrentZoom(): number {
        return this._view.matrix.zoom;
    };
    /**
    * get the current position of the artboard
    */
    getCurrentPosition(): Point {
        return { 
            x: this._view.matrix.x, 
            y: this._view.matrix.y 
        };
    };
    getContainer(type: ContainerType): HTMLDivElement {
        switch(type) {
            case ContainerType.Viewbox: return this._dom.viewbox; break;
            case ContainerType.Layers: return this._dom.layers; break;
            case ContainerType.Shapes: return this._dom.shapes; break;
        }
    };
    getLocalBBox(shape: Shape): BBox {
        const bbox = shape.getBBox();
        
        bbox.x *= this.width * 0.01;
        bbox.y *= this.height * 0.01;
        bbox.width *= this.width * 0.01;
        bbox.height *= this.height * 0.01;

        return bbox;
    };

    show(): void {
        if (!this.interactiveMap?.hasChild(this)) {
            Util.warn(`MapBoard '${Util.nodeId(this)}' is not assigned to InteractiveMap. The 'show' operation was ignored.`);
            return;
        }   
        
        this.interactiveMap.show(this);
    };
    hide(): void {
        if (!this.interactiveMap?.hasChild(this)) {
            Util.warn(`MapBoard '${Util.nodeId(this)}' is not assigned to InteractiveMap. The 'hide' operation was ignored.`);
            return;
        }

        if (this.interactiveMap.activeMapBoard?.id === this.id) {
            this.interactiveMap.hide();
        }
    };
    zoomBy(delta?: number, focalPoint?: Point): void {
        this._zoomBy(delta, focalPoint);
    };
    translateBy(dx: number, dy: number): void {
        const posBase = this._view.matrix.inverse().transformPoint({x:dx, y:dy});
        const posBaseCenterCenter = this._view.matrix.inverse().transformPoint({x:0, y:0});
        const x = posBase.x - posBaseCenterCenter.x;
        const y = posBase.y - posBaseCenterCenter.y;
	   
		this._view.matrix.translate({x:x, y:y});

        this._updatePosZoom();
    };
    /**
     * Call after page resize or changes to update the element's size.
     * If maintainAspectRatio is true, the method resets the container's
     * dimensions to allow for proper aspect ratio maintenance.
     * This method also marks the state as dirty and triggers a view update.
     */
    resize(): void {
        if (this.maintainAspectRatio) {
            const container = this.interactiveMap?.container;
            if (container) {
                container.style.width = '';
                container.style.height = '';
            }
        }
        this._setDirty('maintainAspectRatio', 'zoom');
        this._updatePosZoom(true);
    };
    /**
     * Update the view of the artboard. This method is called when the artboard's dimensions change or when it is attached to the stage, so it is necessary to update all shapes on the artboard.
    */
    update(): void {
        if (!this.active) {
            return;
        }

        this.forEach((shape) => {
             shape.update();
        });
    };

    //==============================================================
    // This block of methods represents the implementation of the IContainer interface.
    //==============================================================
    forEach(callbackFn: (child: Shape) => void): void {
        this._shapes.forEach(callbackFn);
    };
    forEachInverse(callbackFn: (child: Shape) => void): void {
        for (let i = this._shapes.length - 1; i >= 0; i--) {
            callbackFn(this._shapes[i]);
        };
    };
    count(): number {
        return this._shapes.length;
    };
    countAll(): number {
        return this._shapes.length;
    };
    hasChildren(): boolean {
        return this._shapes.length > 0;
    };
    getChildren(): Shape[] {
        return this._shapes;
    };
    hasChild(child: Shape | string): boolean {
        return !!this.getChild(child);
    };
    getChild(arg: Shape | string | ((child: Shape) => boolean)): Shape | null { 
        if (typeof arg === 'string') {
            const foundChild = this._shapes.find(child => child.id === arg);
            if (foundChild) {
                return foundChild;
            }
        } else if (typeof arg === 'function') {
            const callbackFn = arg as (child: Shape) => boolean;
            const foundChild = this._shapes.find(callbackFn);
            if (foundChild) {
                return foundChild;
            }
        } else {
            if (this._shapes.includes(arg)) {
                return arg;
            }
        }

        return null;
    };
    add(node: Shape, pos?: number): boolean {
        const foundNode = this.getChild(node);
        if (foundNode) {
            Util.warn(`Shape '${Util.nodeId(node)}' found in MapBoard. The 'add' operation was ignored.`);
            return false;
        }

        if (pos === undefined) {
            this._shapes.push(node);
        } else {
            if (pos < 0) pos = 0;
            if (pos > this._shapes.length) pos = this._shapes.length;

            this._shapes.splice(pos, 0, node);
        }   
        
        node[nodeOnAdd](this);

        return true;
    };
    remove(node?: Shape | string): boolean {
        if (!node) {
            return this.interactiveMap ? this.interactiveMap.remove(this) : false;
        }

        const foundNode = this.getChild(node);
        if (!foundNode) {
            Util.warn(`Shape '${Util.nodeId(node)}' not found in MapBoard '${Util.nodeId(this)}'. The 'remove' operation was ignored.`);
            return false;
        }

        if (foundNode.parent) {
            if (foundNode.parent.id === this.id) {
                const index = this._shapes.indexOf(foundNode);
                if (index !== -1) {
                    this._shapes.splice(index, 1);
                    foundNode[nodeOnRemove](foundNode.parent);
                    return true;
                }
            }
        } else {
            Util.warn(`Shape '${Util.nodeId(node)}' parent not initialized. The 'remove' operation was ignored.`);
            return false;
        }

        Util.warn(`Shape '${Util.nodeId(node)}' not found in MapBoard '${Util.nodeId(this)}'. The 'remove' operation was ignored.`);
        
        return false;
    };
    move(nodes: Shape | string | (Shape | string)[], pos: number): {node: Shape, pos: number}[] {
        const movedNodes: {node: Shape, pos: number}[] = [];

        // we should find all nodes to move
        const nodesToMove: Shape[] = [];
        if (Array.isArray(nodes)) {
            nodes.forEach((node) => {
                const foundNode = this.getChild(node);
                if (foundNode) {
                    nodesToMove.push(foundNode);
                } else {
                    Util.warn(`Shape '${Util.nodeId(node)}' not found in MapBoard '${Util.nodeId(this)}'. The 'move' operation for this mapBoard was ignored.`);
                }
            });
        } else {
            const foundNode = this.getChild(nodes);
            if (foundNode) {
                nodesToMove.push(foundNode);
            } else {
                Util.warn(`Shape '${Util.nodeId(nodes)}' not found in MapBoard '${Util.nodeId(this)}'. The 'move' operation for this mapBoard was ignored.`);
            }
        }

        // we need to sort nodes depending on the index in the main tree
        const orderMap = new Map<string, number>();
        this._shapes.forEach((node, index) => {
            orderMap.set(node.id, index);
        });
        nodesToMove.sort((a, b) => {
            const indexA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const indexB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            return indexB - indexA;
        });

        const targetNode = this;
        const target: Shape[] = this._shapes;

        // we need to update the newIndex and remove moved nodes
        for (const node of nodesToMove) {
            const index = this._shapes.findIndex((b) => b.id === node.id);
            if (index !== -1) {
                if (index < pos) {
                    pos -= 1;
                }
                this._shapes.splice(index, 1);
            }
        };

        if (pos < 0) pos = 0;
        if (pos > target.length) pos = target.length;
        
        nodesToMove.forEach(nodeToMove => target.splice(pos, 0, nodeToMove));
        nodesToMove.forEach(nodeToMove => {
            const pos = target.findIndex(node => node.id === nodeToMove.id);
            movedNodes.push({node: nodeToMove, pos: pos});
        });

        return movedNodes;
    };
};
