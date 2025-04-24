import { PicPoints } from '@/picpoints';
import { Node } from '@/node';
import { BBox } from '@/bbox';
import { Point } from '@/types';


// CONSTANTS
const PICPOINTS_WARNING = 'PicPoints warning: ',
PICPOINTS_ERROR = 'PicPoints error: ',
OBJECT_NUMBER = '[object Number]',
OBJECT_STRING = '[object String]',
OBJECT_BOOLEAN = '[object Boolean]';

export const Util = {
    /*
    * cherry-picked utilities from underscore.js
    */
    isFunction(obj: any) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    },
    // arrays are objects too
    isObject(val: any): val is object {
        return val instanceof Object;
    },
    isValidSelector(selector: any) {
        if (typeof selector !== 'string') {
          return false;
        }
        const firstChar = selector[0];
        return (
          firstChar === '#' ||
          firstChar === '.' ||
          firstChar === firstChar.toUpperCase()
        );
    },
    isNumber(obj: any): obj is number {
        return (
          Object.prototype.toString.call(obj) === OBJECT_NUMBER &&
          !isNaN(obj) &&
          isFinite(obj)
        );
    },
    isString(obj: any): obj is string {
        return Object.prototype.toString.call(obj) === OBJECT_STRING;
    },
    isBoolean(obj: any): obj is boolean {
        return Object.prototype.toString.call(obj) === OBJECT_BOOLEAN;
    },
    /*
    * cherry-picked utilities from underscore.js
    */
    // very simplified version of Object.assign
    assign<T, U>(target: T, source: U) {
        for (const key in source) {
            (<any>target)[key] = source[key];
        }
        return target as T & U;
    },
    capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    throw(str: string) {
        throw new Error(PICPOINTS_ERROR + str);
    },
    error(str: string) {
        console.error(PICPOINTS_ERROR + str);
    },
    warn(str: string) {
        if (!PicPoints.showWarnings) {
            return;
        }
        console.warn(PICPOINTS_WARNING + str);
    },
    nodeId(node?: Node | string | null): string {
        return typeof node === 'string' ? node : node ? node.id : '';
    },
    pointFromEvent(e: MouseEvent | Touch): Point {
        return {
            x: e.clientX,
            y: e.clientY,
        };
    },
    SVGPointFromClientPoint(p: Point, svg: SVGSVGElement): Point {
        const point = svg.createSVGPoint();
        point.x = p.x;
        point.y = p.y;
        return point.matrixTransform(svg.getScreenCTM()?.inverse());
    },
    SVGPointFromEvent(e: MouseEvent | Touch, svg: SVGSVGElement): Point {
        const clientPoint = Util.pointFromEvent(e);
        return Util.SVGPointFromClientPoint(clientPoint, svg);
    },
    bboxesIntersect(a: BBox, b: BBox): boolean {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    },
    calcBoundingBox(points: number[]): BBox {
        if (points.length % 2 !== 0 || points.length === 0) {
            this.throw('The point array must contain an even number of elements.');
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (let i = 0; i < points.length; i += 2) {
            const x = points[i];
            const y = points[i + 1];
    
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }
       
        const x = minX;
        const y = minY;
        const width = maxX - minX;
        const height = maxY - minY;
    
        const bbox = new BBox(x,y, width, height);

        return bbox;
    },
    swapPoints(p1: Point, p2: Point): void {
        const tmpX = p1.x;
        const tmpY = p1.y;

        p1.x = p2.x;
        p1.y = p2.y;

        p2.x = tmpX;
        p2.y = tmpY;
    },
    Deg(rad: number): number {
        return rad * 180 / Math.PI;
    },
	Rad(deg: number): number {
        return deg * Math.PI / 180;
    },
	DegNorm(deg: number): number {
        return (deg < 0 ? 360 : 0) + deg % 360;
    }
};