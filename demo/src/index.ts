import 'picpoints/dist/index.css';
import { PicPoints, ViewMode } from 'picpoints';

console.log(PicPoints);

const interactiveMap = new PicPoints.InteractiveMap({
    container: 'container',
    mode: ViewMode.PanZoom
});

const mapBoard1 = new PicPoints.MapBoard({
    name: 'mapboard 1',
    image: 'assets/placeholder-600x400.png',
    //width: 300,
    //height: 100,
    useImageSize: true,
    //maintainAspectRatio: true,
    zoom: .7,
    effectShow: 'picpnts-fx-bounceInRight',
    effectHide: 'picpnts-fx-bounceOutLeft',
    effectDuration: 5000
});

const mapBoard2 = new PicPoints.MapBoard({
    name: 'mapboard 2',
    image: 'assets/placeholder-300x800.png',
    //width: 200,
    //height: 400,
    useImageSize: true,
    //maintainAspectRatio: true,
    //zoom: 'contain', // .7
    effectShow: 'picpnts-fx-bounceInRight',
    effectHide: 'picpnts-fx-bounceOutLeft',
    effectDuration: 5000
});

const mapBoard3 = new PicPoints.MapBoard({
    name: 'mapboard 3',
    image: 'assets/placeholder-400x400.png',
    //width: 200,
    //height: 400,
    useImageSize: true,
    //maintainAspectRatio: true,
    //zoom: 'contain', // .7
    effectShow: 'picpnts-fx-bounceInRight',
    effectHide: 'picpnts-fx-bounceOutLeft',
    effectDuration: 5000
});


interactiveMap.add(mapBoard1);
interactiveMap.add(mapBoard2);

interactiveMap.show(mapBoard1);