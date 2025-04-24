import { Util } from '@/util';
import { Core } from '@/core';
import { Node } from '@/node';
import { InteractiveMap } from '@/interactivemap';
import { MapBoard } from '@/mapboard';
import { Shape } from '@/shapes/shape';
import { Icon } from '@/shapes/icon';
import { Location } from '@/shapes/location';


export const PicPoints = Util.assign(
    Core.getInstance(), 
    {
        Node,
        InteractiveMap ,
        MapBoard,
        Shape,
        Icon,
        Location
    }
);