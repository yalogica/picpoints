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

export enum ViewMode {
    None = 'none',
    Select = 'select',
    PanZoom = 'panzoom'
};

export type ZoomType = number | 'contain' | 'cover';

export type AnchorType = 
    'top-left' | 
    'top-center' | 
    'top-right' | 
    'center-left' | 
    'center' | 
    'center-right' | 
    'bottom-left' | 
    'bottom-center' | 
    'bottom-right';

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
        MODE: ViewMode.PanZoom,
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
        MAINTAIN_ASPECT_RATIO: false,
        EFFECT: {
            show: undefined,
            hide: undefined,
            duration: undefined
        }
    },
    SHAPE: {
        X: 0,
        Y: 0,
        WIDTH: 0,
        HEIGHT: 0,
        SIZE: 0,
        ROTATION: 0
    }
};