const WsWriter  = require('./WsWriter');
const Http3Writer  = require('./Http3Writer');

let mediaClient = null;
let hostUrl = 'rtc1.cerceimedia.kuaishou.com';
let subPath = '';

function GetMediaStats() {
    if (mediaClient == null) {
        return;
    }
    let stats = mediaClient.GetMediaStats();
    if (stats == null) {
        return;
    }
    let statsText = 'video kbps:' + parseInt(stats['vkbps']) + ', audio kbps:' + parseInt(stats['akbps']);
    statsText += ', video pps:' + parseInt(stats['vpps']) + ', audio pps:' + parseInt(stats['apps']);

    document.getElementById('playurlLabel').innerText = 'play url: ' + 'rtmp://' + hostUrl + '/' + subPath;
    document.getElementById('previewLabel').innerText = 'publish preview: [ ' + statsText + ' ]';
}

function randomNum(minNum,maxNum){
    switch(arguments.length){
        case 1:
            return parseInt(Math.random()*minNum+1,10);
        break;
        case 2:
            return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10);
        default:
            return 0;
        break;
    }
}

function windowInit() {
    var num = randomNum(100000, 999999);
    var streamName = num.toString();

    subPath = "live/" + streamName;

    document.getElementById('serverHost').value = hostUrl + ":12000";
    document.getElementById('subpath').value = subPath;

    setInterval(GetMediaStats, 5000);
}

async function websocketConnect() {
    let canvasElement = document.getElementById('CanvasMediaId');
    let serverHost = document.getElementById('serverHost').value;
    let subpath = document.getElementById('subpath').value;
    
    try {
        mediaClient = new WsWriter();

        mediaClient.SetCanvasElement(canvasElement);
        console.log("websocket url:", "ws://" + serverHost + "/" + subpath + ".flv")
        let ret = await mediaClient.Init(serverHost, subpath + ".flv");

        console.log("mediaClient init return:", ret);
        alert('webtransport connect ok');
    } catch (error) {
        console.log('mediaClient init exception:', error);
    }

}

async function websocketDisconnect() {
    if (mediaClient == null) {
        return;
    }
    mediaClient.Close();
    mediaClient = null;

    return;
}

async function openCamera() {
    console.log("media client:", mediaClient);
    
    if (mediaClient == null) {
        alert('please connect server first...');
        return;
    }
    
    try {
        mediaClient.OpenCamera(document.getElementById('CanvasMediaId'));
    } catch (error) {
        console.log('open camera error:', error);
        alert('open camera error:' + error);
    }
}

async function openScreenShared() {
    if (mediaClient == null) {
        alert('please connect server first...');
        return;
    }
    
    try {
        mediaClient.OpenScreenShared(document.getElementById('CanvasMediaId'));
    } catch (error) {
        console.log('open shared screen error:', error);
        alert('open shared screen error:' + error);
    }
}

async function webtransportConnect() {
    /*
    let serverHost = document.getElementById('serverHost').value;
    let subpath = document.getElementById('subpath').value;

    let webtransUrl = "https://" + serverHost + ":" + hostPort + "/webtransport/push/" + subpath;
    let transport = new WebTransport(webtransUrl);
    await transport.ready;
  
    let stream = await transport.createBidirectionalStream();

    let writer = stream.writable.getWriter();
    */

    let canvasElement = document.getElementById('CanvasMediaId');
    let serverHost = document.getElementById('serverHost').value;
    let subpath = document.getElementById('subpath').value;
    
    try {
        mediaClient = new Http3Writer();

        mediaClient.SetCanvasElement(canvasElement);
        await mediaClient.Init(serverHost, subpath + ".flv");

        alert('websocket connect ok');
    } catch (error) {
        console.log('mediaClient init exception:', error);
    }

}

document.getElementById('connectId').addEventListener('click', async ()=>{
    await webtransportConnect();
    //websocketConnect()
})

document.getElementById('disconnectId').addEventListener('click', ()=>{
    websocketDisconnect();
})

document.getElementById('cameraId').addEventListener('click', ()=>{
    openCamera();
})

document.getElementById('screenId').addEventListener('click', ()=>{
    openScreenShared();
})

document.getElementById('lefttop').addEventListener('click', ()=>{
    if (mediaClient == null) {
        alert('please connect server first...');
        return;
    }
    mediaClient.UpdateCameraPos(0);
})

document.getElementById('righttop').addEventListener('click', ()=>{
    if (mediaClient == null) {
        alert('please connect server first...');
        return;
    }
    mediaClient.UpdateCameraPos(1);
})

document.getElementById('leftbottom').addEventListener('click', ()=>{
    if (mediaClient == null) {
        alert('please connect server first...');
        return;
    }
    mediaClient.UpdateCameraPos(2);
})

document.getElementById('rightbottom').addEventListener('click', ()=>{
    if (mediaClient == null) {
        alert('please connect server first...');
        return;
    }
    mediaClient.UpdateCameraPos(3);
})

windowInit();
