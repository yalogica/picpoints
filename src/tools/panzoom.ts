import { Point, EditorMode } from '@/types';
import { InteractiveMap } from '@/interactivemap';


interface Panning {
    active: boolean;
    pos: {
        start: Point;
        prev: Point;
        curr: Point;
    }
};

export class PanZoom {
    private _interactiveMap: InteractiveMap;
    private _panning: Panning = {
        active: false,
        pos: {
            start: {x: 0, y: 0},
            prev:  {x: 0, y: 0},
            curr:  {x: 0, y: 0}
        }
    };

    constructor(interactiveMap: InteractiveMap) {
        this._interactiveMap = interactiveMap;

        this._bind();
    }
    private _bind() {
        this.interactiveMap.getInnerContainer().addEventListener('pointerdown', this._onPanStart);
        this.interactiveMap.getInnerContainer().addEventListener('wheel', this._onMouseWheelZoom);
    };
    private _unbind() {
        this.interactiveMap.getInnerContainer().removeEventListener('pointerdown', this._onPanStart);
        this.interactiveMap.getInnerContainer().removeEventListener('wheel', this._onMouseWheelZoom);

        window.removeEventListener('pointermove', this._onPanMove);
        window.removeEventListener('pointerup', this._onPanEnd);
        window.removeEventListener('pointercancel', this._onPanEnd);
    };
    private _onPanStart = (e: PointerEvent): void => {
        if (!this.interactiveMap.activeMapBoard || !this.interactiveMap.interactivePan) {
            return;
        }

        if (e.button !== 0) { // skip if the left mouse button is not clicked
            return;
        }

        this._panning.pos.start.x = this._panning.pos.prev.x = this._panning.pos.curr.x = e.pageX;
        this._panning.pos.start.y = this._panning.pos.prev.y = this._panning.pos.curr.y = e.pageY;

        window.addEventListener('pointermove', this._onPanMove);
        window.addEventListener('pointerup', this._onPanEnd, { once: true });
        window.addEventListener('pointercancel', this._onPanEnd, { once: true });
    };
    private _onPanMove = (e: PointerEvent): void => {        
        if (!this.interactiveMap.activeMapBoard || this.interactiveMap.mode !== EditorMode.PanZoom || !this.interactiveMap.interactivePan) {
            this._onPanEnd(e);
            return;
        }

        if (!(e.pressure > 0 || e.pointerType === 'mouse')) {
            this._onPanEnd(e);
            return;
        }

        const dx = Math.abs(e.pageX - this._panning.pos.start.x);
        const dy = Math.abs(e.pageY - this._panning.pos.start.y);
        const dragThreshold = 3;

        if (!this._panning.active && (dx > dragThreshold || dy > dragThreshold)) {
            this._panning.active = true;
            this._panning.pos.start.x = this._panning.pos.prev.x = this._panning.pos.curr.x = e.pageX;
            this._panning.pos.start.y = this._panning.pos.prev.y = this._panning.pos.curr.y = e.pageY;
        }

        if (this._panning.active) {
            this._panning.pos.curr.x = e.pageX;
            this._panning.pos.curr.y = e.pageY;
            
            const dx = this._panning.pos.curr.x - this._panning.pos.prev.x;
            const dy = this._panning.pos.curr.y - this._panning.pos.prev.y;

            this._panning.pos.prev.x = this._panning.pos.curr.x;
            this._panning.pos.prev.y = this._panning.pos.curr.y;

            requestAnimationFrame(() => {
                this.interactiveMap.activeMapBoard?.translateBy(dx, dy);
            });
        }
    };
    private _onPanEnd = (e: PointerEvent): void => {
        window.removeEventListener('pointermove', this._onPanMove);
        window.removeEventListener('pointerup', this._onPanEnd);
        window.removeEventListener('pointercancel', this._onPanEnd);

        this._panning.active = false;
    };
    private _onMouseWheelZoom = (e: WheelEvent): void => {
        if (!this.interactiveMap.activeMapBoard || this.interactiveMap.mode !== EditorMode.PanZoom || !this.interactiveMap.interactiveZoom) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const container = this.interactiveMap.getInnerContainer();
        const rect = container.getBoundingClientRect();
        const focalPoint = {
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        };
        const scale = 1 - Math.sign(e.deltaY) * 0.1; // 10%

        requestAnimationFrame(() => {
            this.interactiveMap.activeMapBoard?.zoomBy(scale, focalPoint);
        });
    };

    get interactiveMap(): InteractiveMap {
        return this._interactiveMap;
    };

    destroy() {
        this._unbind();
    };
}