import { PicPoints } from '@/picpoints';
import { Util } from '@/util';
import { NodeType, Point, ViewMode, DEFAULT } from '@/types';
import { Node, NodeConfig, nodeOnAdd, nodeOnRemove } from '@/node';
import { IContainer } from '@/container';
import { MapBoard, mapBoardAttachTo, mapBoardDetachFrom, mapBoardShow, mapBoardHide } from '@/mapboard';
import { Shape } from '@/shapes/shape';
import { PanZoom } from '@/tools/panzoom';


interface DOM {
    container: HTMLDivElement | null;
    interactiveMap: HTMLDivElement;
};

export interface InteractiveMapConfig extends NodeConfig {
    container?: HTMLDivElement | string;
    mode?: ViewMode;
    interactivePan?: boolean;
    interactiveZoom?: boolean;
    usePanZoomOnSpaceHold?: boolean;
    selectAndTransform?: boolean;
};

export class InteractiveMap<Config extends InteractiveMapConfig = InteractiveMapConfig> extends Node<Config> implements IContainer<MapBoard> {
    protected _nodeType: NodeType = NodeType.InteractiveMap;

    private _dom: DOM = { 
        container: null,
        interactiveMap: document.createElement('div')
    };

    private _prevMode: ViewMode | null; 
    private _panzoom: PanZoom;
    //!!!private _transformer: Transformer;
    //!!!private _selector: Selector;
    private _mapBoards: MapBoard[] = [];
    private _activeMapBoard: MapBoard | null = null;
    private _pendingMapBoards: MapBoard[]  = [];
    private _resizeObserver: ResizeObserver | null;

    private _container: HTMLDivElement;
    private _mode: ViewMode;
    private _interactivePan: boolean;
    private _interactiveZoom: boolean;
    private _usePanZoomOnSpaceHold: boolean;
    private _selectAndTransform: boolean;

    constructor(config?: Config) {
        super(config);

        this.className = config?.className;
        this.container = config?.container ?? '';
        this.mode = config?.mode ?? DEFAULT.INTERACTIVEMAP.MODE;
        this.interactivePan = config?.interactivePan ?? DEFAULT.INTERACTIVEMAP.INTERACTIVE_PAN;
        this.interactiveZoom = config?.interactiveZoom ?? DEFAULT.INTERACTIVEMAP.INTERACTIVE_ZOOM;
        this.usePanZoomOnSpaceHold = config?.usePanZoomOnSpaceHold ?? DEFAULT.INTERACTIVEMAP.USE_PANZOOM_ON_SPACE_HOLD;
        this.selectAndTransform = config?.selectAndTransform ?? DEFAULT.INTERACTIVEMAP.SELECT_AND_TRANSFORM;

        this._panzoom = new PanZoom(this);
        //!!!this._transformer = new Transformer(this);
        //!!!this._selector = new Selector(this);

        this._buildDOM();
        this._bind();
    };

    private _buildDOM(): void {
        const container = this.container;
        if (!container) {
            Util.throw('InteractiveMap has no container. A container is required.');
            return;
        }

        // clear content inside container
        container.innerHTML = '';
        
        this._dom.container = container;

        this._dom.interactiveMap.classList.add('picpnts-interactive-map');
        this._dom.interactiveMap.setAttribute('data-id', this.id);
        this._dom.interactiveMap.setAttribute('data-type', this.type.toLowerCase());
     
        container.appendChild(this._dom.interactiveMap);
    };
    private _bind(): void {
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);

        this._resizeObserver = new ResizeObserver(() => {
            this._onResize();
        });
        this._resizeObserver.observe(this._dom.interactiveMap);
    };
    private _unbind(): void {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);

        this._resizeObserver?.unobserve(this._dom.interactiveMap);
        this._resizeObserver?.disconnect();
    };
    private _onKeyDown = (e: KeyboardEvent): void => {
        if (this.usePanZoomOnSpaceHold && this.mode !== ViewMode.PanZoom && e.code === 'Space' && !this._prevMode) {
            e.preventDefault();

            switch (this.mode) {
                //!!!!case EditorMode.Select: this._selector.cancel(); break;
            }

            this._prevMode = this.mode;
            this.mode = ViewMode.PanZoom;
        }
    };
    private _onKeyUp = (e: KeyboardEvent): void => {
        if (e.code === 'Space' && this._prevMode) {
            this.mode = this._prevMode;
            this._prevMode = null;
        }
    };
    private _onResize = (): void => {
        this._activeMapBoard?.resize();
    };

    //#region Getters & Setters
    get className(): string | undefined {
        return this._className;
    };
    set className(className: string | undefined) {
        const prev = this._className;
       
        prev && this._dom?.interactiveMap.classList.remove(...prev.split(' '));
        className && this._dom?.interactiveMap.classList.add(...className.split(' '));

        this._className = className;
    };
    get container(): HTMLDivElement {
        return this._container;
    };
    set container(container: HTMLDivElement | string) {
        if (typeof container === 'string') {
            if (container.charAt(0) === '.') {
                const className = container.slice(1);
                container = document.getElementsByClassName(className)[0] as HTMLDivElement;
            } else {
                let id;    
                if (container.charAt(0) !== '#') {
                    id = container;
                } else {
                    id = container.slice(1);
                }
                container = document.getElementById(id) as HTMLDivElement;
            }

            if (!container) {
                Util.throw('Can not find container in document.');
            }
        }

        this._container = container;

        if (this._dom && this._dom.container && this._dom.interactiveMap) {
            if (this._dom.interactiveMap.parentElement) {
                this._dom.interactiveMap.parentElement.removeChild(this._dom.interactiveMap);
            }
            this._dom.container.appendChild(this._dom.interactiveMap);
        }
    };
    get mode(): ViewMode {
        return this._mode;
    };
    set mode(mode: ViewMode) {
        this._mode = mode;
    };
    get interactivePan(): boolean {
        return this._interactivePan;
    };
    set interactivePan(interactivePan: boolean) {
        this._interactivePan = interactivePan;
    };
    get interactiveZoom(): boolean {
        return this._interactiveZoom;
    };
    set interactiveZoom(interactiveZoom: boolean) {
        this._interactiveZoom = interactiveZoom;
    };
    get usePanZoomOnSpaceHold(): boolean {
        return this._usePanZoomOnSpaceHold;
    };
    set usePanZoomOnSpaceHold(usePanZoomOnSpaceHold: boolean) {
        this._usePanZoomOnSpaceHold = usePanZoomOnSpaceHold;
    };
    get selectAndTransform(): boolean {
        return this._selectAndTransform;
    };
    set selectAndTransform(selectAndTransform: boolean) {
        this._selectAndTransform = selectAndTransform;
    };
    get activeMapBoard(): MapBoard | null {
        return this._activeMapBoard;
    };
    get center(): Point {
        return {
            x: this._dom.interactiveMap.clientWidth / 2,
            y: this._dom.interactiveMap.clientHeight / 2
        }
    };
    //#endregion
    //!!!get transformer(): Transformer {
        //return this._transformer;
    //};

    //#region Public
    /**
    * Retrieves the DOM element that serves as the inner container for the InteractiveMap.
    * This element is typically used to render or manipulate the visual components of the InteractiveMap.
    */
    getInnerContainer(): HTMLDivElement {
        return this._dom.interactiveMap;
    };
     /**
    * Displays the specified artboard on the stage
    */
    show(mapBoard: MapBoard | string, force?: boolean): void {
        const foundNode = this.getChild(mapBoard);
        if (!foundNode) {
            Util.warn(`MapBoard '${Util.nodeId(mapBoard)}' not found in InteractiveMap '${Util.nodeId(this)}'. The 'show' operation was ignored.`);
            return;
        }

        this.hide(force);

        this._pendingMapBoards = this._pendingMapBoards.filter(b => b !== foundNode);
        this._pendingMapBoards.unshift(foundNode);

        foundNode[mapBoardDetachFrom](this);
        foundNode[mapBoardAttachTo](this);
        foundNode[mapBoardShow](this, force).then((mapBoard: MapBoard | null) => {
            if (!mapBoard) {
                return;
            }

            if (this._pendingMapBoards.length && this._pendingMapBoards[0] == mapBoard) {
                // show the top pending mapBoard only
                this._activeMapBoard = mapBoard;
                PicPoints.fire('mapboard:show', this, { mapBoard: mapBoard });
            } else {
                // all other pending mapBoards should be hidden
                mapBoard[mapBoardHide](this).then((mapBoard: MapBoard | null) => {
                    if (mapBoard) {
                        mapBoard[mapBoardDetachFrom](this);
                    }
                }).catch(() => {
                });
            }

            this._pendingMapBoards = this._pendingMapBoards.filter(b => b !== mapBoard);
        });
    };
    /**
     * Hide the current mapBoard
     */
    async hide(force?: boolean): Promise<null> {
        return new Promise((resolve) => {
            if (this._activeMapBoard) {
                this._activeMapBoard[mapBoardHide](this, force).then((mapBoard: MapBoard | null) => {
                    if (!mapBoard) {
                        return;
                    }
                    
                    mapBoard[mapBoardDetachFrom](this);
                    PicPoints.fire('mapboard:hide', this, { mapBoard: mapBoard } );

                }).catch((mapBoard: MapBoard) => {
                    this._activeMapBoard = mapBoard;
                }).finally(() => {    
                    resolve(null);
                });

                this._activeMapBoard = null;
            } else {
                resolve(null);
            };
        });
    };
    update(): void {
        this._activeMapBoard?.update();
    };
    destroy(): void {
        this._unbind();
        this._panzoom.destroy();
        //!!!this._selector.destroy();
        //this._transformer.destroy();
    };
    //#endregion

    //#region Implementation of the IContainer interface
    forEach(callbackFn: (child: MapBoard) => void): void {
        this._mapBoards.forEach(callbackFn);
    };
    forEachInverse(callbackFn: (child: MapBoard) => void): void {
        for (let i = this._mapBoards.length - 1; i >= 0; i--) {
            callbackFn(this._mapBoards[i]);
        };
    };
    count(): number {
        return this._mapBoards.length;
    };
    countAll(): number {
        return this._mapBoards.length;
    };
    hasChildren(): boolean {
        return this._mapBoards.length > 0;
    };
    getChildren(): MapBoard[] {
        return this._mapBoards;
    };
    hasChild(child: MapBoard | string): boolean {
        return !!this.getChild(child);
    };
    getChild(arg: MapBoard | string | ((child: MapBoard) => boolean)): MapBoard | null { 
        if (typeof arg === 'string') {
            const foundChild = this._mapBoards.find(child => child.id === arg);
            if (foundChild) {
                return foundChild;
            }
        } else if (typeof arg === 'function') {
            const callbackFn = arg as (child: MapBoard) => boolean;
            const foundChild = this._mapBoards.find(callbackFn);
            if (foundChild) {
                return foundChild;
            }
        } else {
            if (this._mapBoards.includes(arg)) {
                return arg;
            }
        }

        return null;
    };
    add(node: MapBoard, pos?: number): boolean {
        const foundNode = this.getChild(node);
        if (foundNode) {
            Util.warn(`MapBoard '${Util.nodeId(node)}' found in InteractiveMap. The 'add' operation was ignored.`);
            return false;
        }

        if (pos === undefined) {
            this._mapBoards.push(node);
        } else {
            if (pos < 0) pos = 0;
            if (pos > this._mapBoards.length) pos = this._mapBoards.length;

            this._mapBoards.splice(pos, 0, node);
        }   
        
        node[nodeOnAdd](this);

        return true;
    };
    remove(node: MapBoard | string): boolean { 
        const foundNode = this.getChild(node);
        if (!foundNode) {
            Util.warn(`MapBoard '${Util.nodeId(node)}' not found in InteractiveMap '${Util.nodeId(this)}'. The 'remove' operation was ignored.`);
            return false;
        }

        if (this._activeMapBoard && this._activeMapBoard.id === foundNode.id) {
            const mapBoard = this._activeMapBoard;
            
            this._activeMapBoard[mapBoardDetachFrom](this);
            this._activeMapBoard = null;

            PicPoints.fire('mapboard:hide', this, { mapBoard: mapBoard } );
        }

        const index = this._mapBoards.indexOf(foundNode);
        if (index !== -1) {
            // deleting all shapes starting from the lowest one in the tree and ending with the root ones, i.e. in reverse order
            const shapesToRemove: Shape[] = [];
            this._mapBoards[index].forEachInverse(shape => shapesToRemove.push(shape));
            shapesToRemove.forEach(shape => shape.remove());

            this._mapBoards.splice(index, 1);

            foundNode[nodeOnRemove](this);

            return true;
        }

        return false;
    };
    move(nodes: MapBoard | string | (MapBoard | string)[], pos: number): {node: MapBoard, pos: number}[] {
        const movedNodes: {node: MapBoard, pos: number}[] = [];

        // we should find all nodes to move
        const nodesToMove: MapBoard[] = [];
        if (Array.isArray(nodes)) {
            nodes.forEach((node) => {
                const foundNode = this.getChild(node);
                if (foundNode) {
                    nodesToMove.push(foundNode);
                } else {
                    Util.warn(`MapBoard '${Util.nodeId(node)}' not found in InteractiveMap '${Util.nodeId(this)}'. The 'move' operation for this mapBoard was ignored.`);
                }
            });
        } else {
            const foundNode = this.getChild(nodes);
            if (foundNode) {
                nodesToMove.push(foundNode);
            } else {
                Util.warn(`MapBoard '${Util.nodeId(nodes)}' not found in InteractiveMap '${Util.nodeId(this)}'. The 'move' operation for this mapBoard was ignored.`);
            }
        }

        // we need to sort nodes depending on the index in the main tree
        const orderMap = new Map<string, number>();
        this._mapBoards.forEach((node, index) => {
            orderMap.set(node.id, index);
        });
        nodesToMove.sort((a, b) => {
            const indexA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const indexB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            return indexB - indexA;
        });

        const targetNode = this;
        const target: MapBoard[] = this._mapBoards;

        // we need to update the newIndex and remove moved nodes
        for (const node of nodesToMove) {
            const index = this._mapBoards.findIndex((b) => b.id === node.id);
            if (index !== -1) {
                if (index < pos) {
                    pos -= 1;
                }
                this._mapBoards.splice(index, 1);
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
    //#endregion
};
