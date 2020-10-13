// Access token required to use Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhN2NmMjJkOS0wMDQ5LTRmOGMtOGM5My1iODljMGZmYTg4OWUiLCJpZCI6MzUyMDMsImlhdCI6MTYwMTQ5NjQ1MX0.33fp2rPMyMGHFUNU-ESjvSomknVSBrV5eKEbTkSZFL4';

// Specify the type of Globe
const moonGlobe = new Cesium.Globe(Cesium.Ellipsoid.MOON);

// Removes the blue tint around globe
moonGlobe.showGroundAtmosphere = false;

// Create a new Cesium Viewer
const viewer = new Cesium.Viewer("cesiumContainer", {
    // Set the terrain to the Moon Ellipsoid
    terrainProvider: new Cesium.EllipsoidTerrainProvider({
        ellipsod: Cesium.Ellipsoid.MOON
    }),
    skyAtmosphere: false,
    animation: false,
    timeline: false,
    globe: moonGlobe,
    baseLayerPicker: false,
    // Use JPL's WMTS for tiling
    imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
        url: 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
        layer: 'LRO_WAC_Mosaic_Global_303ppd_v02',
        style: 'default',
        tileMatrixSetID: 'default028mm',
        format: 'image/jpeg',
        tilingScheme: new Cesium.GeographicTilingScheme(),
        credit: new Cesium.Credit('nasa jpl trek')
    }),
});

const scene = viewer.scene;

// Create a client-side socket
// The socket defaults to the server's URL for the WS connection
const socket = io();

let curRoom = 'None';

let roomDisplay = document.getElementById('room');

// When the socket receives a 'connect' command from the server, it does the function.
socket.on('connect', function(){
    roomDisplay.innerHTML = 'Current Room: ' + curRoom;
});

socket.on('getCurRoom', function(){
    socket.emit('serverGetCurRoom', curRoom);
})

let roomid_btn = document.getElementById('roomid_btn');

roomid_btn.onclick = function() {
    let roomid = document.getElementById('roomid').value;
    curRoom = roomid;
    roomDisplay.innerHTML = 'Current Room: ' + curRoom;
    socket.emit('joinRoom', roomid);
}

socket.on('alert', function(data) {
    alert(data);
})

socket.on('disconnect', function(){});

function hexToRgb(hex) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return (r,g,b);
}

function addEntity(cartesian, sync=false, add=false) {
    // let circleColor = document.getElementById('colors').value;
    // Adds a new entity to the globe
    viewer.entities.add({
        position: cartesian,
        ellipse: {
            ellipsoid: Cesium.Ellipsoid.MOON,
            show: true,
            semiMinorAxis: 200000.0,
            semiMajorAxis: 200000.0,
            height: 0.0,
            material: Cesium.Color.GREEN,
        },
    });

    if (curRoom === 'None')
        return

    // When we add a new entity, let's send the server the cartesian of the new entity.
    if (!sync) {
        socket.emit('newEntity', cartesian)
    }

    if (add) {
        socket.emit('addEntity', cartesian)
    }
}

socket.on('syncEntities', function(entities){
    const allEntities = Object.values(entities);
    console.log('ALl Entities: ', allEntities[0]);

    for (let numEntity in allEntities) {
        console.log(allEntities[numEntity]);
        let entPosX = allEntities[numEntity]['x'];
        let entPosY = allEntities[numEntity]['y'];
        let entPosZ = allEntities[numEntity]['z'];
        let entCartesian3 = new Cesium.Cartesian3(entPosX, entPosY, entPosZ);
        addEntity(entCartesian3, true, false);
    }
});

socket.on('serverNewEntity', function(cartesian){
    let entPosX = cartesian['x'];
    let entPosY = cartesian['y'];
    let entPosZ = cartesian['z'];
    let entCartesian3 = new Cesium.Cartesian3(entPosX, entPosY, entPosZ);
    addEntity(entCartesian3, false, false);
});

socket.on('clearEntities', function(){
    viewer.entities.removeAll();
})

handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

// What happends when there is a click?
handler.setInputAction(function(click) {
    let ray = viewer.camera.getPickRay(click.position);
    let cartesian = scene.globe.pick(
        ray, viewer.scene
    );
    if (cartesian) {
        const cartographic = Cesium.Ellipsoid.MOON.cartesianToCartographic(cartesian);

        // This part of the code is for later use.
        // var longitudeString = Cesium.Math.toDegrees(
        //     cartographic.longitude
        // ).toFixed(2);
        // var latitudeString = Cesium.Math.toDegrees(
        //     cartographic.latitude
        // ).toFixed(2);

        addEntity(cartesian, false, true);
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

let colors = document.getElementById('colors');