import { Point } from '@/types';

export class MATRIX {
    private m: number[];

    constructor(a: number = 1, b: number = 0, c: number = 0, d: number = 1, tx: number = 0, ty: number = 0) {
        this.reset().set(a, b, c, d, tx, ty);
    }

    get x(): number {
        return this.m[4];
    }

    get y(): number {
        return this.m[5];
    }

    get zoom(): number {
        return this.m[0];
    }

    reset(): this {
        this.m = new Array(6).fill(0);
        this.m[0] = 1;
        this.m[3] = 1;
        return this;
    }

    set(a: number = 1, b: number = 0, c: number = 0, d: number = 1, tx: number = 0, ty: number = 0): this {
        this.m[0] = a;
        this.m[1] = b;
        this.m[2] = c;
        this.m[3] = d;
        this.m[4] = tx;
        this.m[5] = ty;
        return this;
    }

    clone(): MATRIX {
        const matrix = new MATRIX();
        matrix.m = [...this.m];
        return matrix;
    }

    multiply(matrix: MATRIX): this {
        const m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
        const m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];
        const m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
        const m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

        const dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
        const dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;
        this.m[4] = dx;
        this.m[5] = dy;

        return this;
    }

    inverse(): MATRIX {
        const inv = new MATRIX();
        inv.m = [...this.m];

        const d = 1 / (inv.m[0] * inv.m[3] - inv.m[1] * inv.m[2]);
        const m0 = inv.m[3] * d;
        const m1 = -inv.m[1] * d;
        const m2 = -inv.m[2] * d;
        const m3 = inv.m[0] * d;
        const m4 = d * (inv.m[2] * inv.m[5] - inv.m[3] * inv.m[4]);
        const m5 = d * (inv.m[1] * inv.m[4] - inv.m[0] * inv.m[5]);

        inv.m[0] = m0;
        inv.m[1] = m1;
        inv.m[2] = m2;
        inv.m[3] = m3;
        inv.m[4] = m4;
        inv.m[5] = m5;

        return inv;
    }

    rotate(rad: number): this {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const m11 = this.m[0] * c + this.m[2] * s;
        const m12 = this.m[1] * c + this.m[3] * s;
        const m21 = this.m[0] * -s + this.m[2] * c;
        const m22 = this.m[1] * -s + this.m[3] * c;

        this.m[0] = m11;
        this.m[1] = m12;
        this.m[2] = m21;
        this.m[3] = m22;

        return this;
    }

    move(point: Point): this {
        this.m[4] = point.x;
        this.m[5] = point.y;

        return this;
    }

    translate(point: Point): this {
        this.m[4] += this.m[0] * point.x + this.m[2] * point.y;
        this.m[5] += this.m[1] * point.x + this.m[3] * point.y;

        return this;
    }

    scale(sx: number, sy: number): this {
        this.m[0] *= sx;
        this.m[1] *= sx;
        this.m[2] *= sy;
        this.m[3] *= sy;

        return this;
    }

    setZoom(zoom: number): this {
        this.m[0] = zoom; 
        this.m[3] = zoom;

        return this;
    }

    transformPoint(point: Point): Point {
        const x = point.x * this.m[0] + point.y * this.m[2] + this.m[4];
        const y = point.x * this.m[1] + point.y * this.m[3] + this.m[5];

        return { x, y };
    }
};