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

export type ZoomType = number | "contain" | "cover";

export type Point = { 
    x: number; 
    y: number;
};

export type Size = { 
    width: number; 
    height: number;
};