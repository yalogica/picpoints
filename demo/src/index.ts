import 'picpoints/dist/styles.css';
import 'picpoints/dist/animate.css';
import { PicPoints, ViewMode } from 'picpoints';

console.log(PicPoints);

const interactiveMap = new PicPoints.InteractiveMap({
    container: 'container',
    mode: ViewMode.PanZoom
});

const mapBoard1 = new PicPoints.MapBoard({
    name: 'mapboard 1',
    image: 'assets/placeholder-600x400.png',
    width: 300,
    height: 300,
    useImageSize: true,
    maintainAspectRatio: false,
    svgOverlayOptions: {
        anchor: 'top-left'
    },
    zoom: .7,
    effect: {
        show: 'picpnts-fx-bounceInRight',
        hide: 'picpnts-fx-bounceOutLeft',
        duration: 5000
    }
});

console.log(mapBoard1);

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

// const mapBoard3 = new PicPoints.MapBoard({
//     name: 'mapboard 3',
//     image: 'assets/placeholder-400x400.png',
//     //width: 200,
//     //height: 400,
//     useImageSize: true,
//     //maintainAspectRatio: true,
//     //zoom: 'contain', // .7
//     effectShow: 'picpnts-fx-bounceInRight',
//     effectHide: 'picpnts-fx-bounceOutLeft',
//     effectDuration: 5000
// });


interactiveMap.add(mapBoard1);
interactiveMap.add(mapBoard2);

interactiveMap.show(mapBoard1);

console.log(interactiveMap);


setTimeout(() => {
    //mapBoard1.zoom = .5;
    //mapBoard1.pos = {x: 100, y: 100};
    //mapBoard1.pos.x = 300;
    //mapBoard1.effect.show = "fx-show";
}, 1000);
