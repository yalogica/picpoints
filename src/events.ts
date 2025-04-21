import { Node } from '@/node';
import { Point } from '@/types';
import { InteractiveMap } from '@/interactivemap';
import { MapBoard } from '@/mapboard';
import { Shape } from '@/shapes/shape';


export type Events = {
    'interactivemap:ready': { interactiveMap: InteractiveMap };
    'mapboard:ready': { mapBoard: MapBoard };
    'mapboard:add': { mapBoard: MapBoard };
    'mapboard:remove': { mapBoard: MapBoard };
    'mapboard:show': { mapBoard: MapBoard };
    'mapboard:hide': { mapBoard: MapBoard };
    'mapboard:pan': { mapBoard: MapBoard, old: { pos: Point }, new: { pos: Point} };
    'mapboard:zoom': { mapBoard: MapBoard, old: { zoom: number }, new: { zoom: number } };
    'shape:ready': { shape: Shape };
    'shape:add': { shape: Shape };
    'shape:remove': { shape: Shape };
    'shape:select': { shape: Shape };
    'shape:move': { shape: Shape[], old: { pos: number }, new: { pos: number } };
    'shape:pan': { shape: Shape };
};

export type EventType = keyof Events;

export interface Event<T extends EventType> {
    type: T;
    source?: Node | InteractiveMap;
    data?: Events[T];
};

export type EventHandler<T extends EventType> = (event: Event<T>) => void;