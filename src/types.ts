export const SVG_NS = 'http://www.w3.org/2000/svg';

export enum NodeType {
    Node = 'node',
    InteractiveMap = 'interactivemap',
    MapBoard = 'mapboard',
    Shape = 'shape',
    Location = 'location',
    Icon = 'icon',
    Image = 'image',
    Text = 'text'
};

export enum EditorMode {
    None = 'none',
    Select = 'select',
    PanZoom = 'panzoom'
};

export type ZoomType = number | 'contain' | 'cover';

export type Point = { 
    x: number; 
    y: number;
};

export type Size = { 
    width: number; 
    height: number;
};

export const DEFAULT = {
    INTERACTIVEMAP: {
        MODE: EditorMode.None,
        INTERACTIVE_PAN: true,
        INTERACTIVE_ZOOM: true,
        USE_PANZOOM_ON_SPACE_HOLD: true,
        SELECT_AND_TRANSFORM: true
    },
    MAPBOARD: {
        ZOOM: 1,
        POS: { x: 0, y: 0},
        WIDTH: 0,
        HEIGHT: 0,
        USE_IMAGE_SIZE: true,
        MAINTAIN_ASPECT_RATIO: false
    },
    SHAPE: {
        X: 0,
        Y: 0,
        WIDTH: 0,
        HEIGHT: 0,
        ROTATION: 0
    }
};