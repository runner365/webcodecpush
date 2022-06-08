const WsWriter  = require('./WsWriter');

let wsClient = null;
let hostUrl = 'localhost';
let subPath = '';

function GetMediaStats() {
    if (wsClient == null) {
        return;
    }
    let stats = wsClient.GetMediaStats();
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
        wsClient = new WsWriter();

        wsClient.SetCanvasElement(canvasElement);
        console.log("websocket url:", "wss://" + serverHost + "/" + subpath + ".flv")
        let ret = await wsClient.Init(serverHost, subpath + ".flv");

        console.log("wsClient init return:", ret);
        alert('websocket connect ok');
    } catch (error) {
        console.log('wsClient init exception:', error);
    }

}

async function websocketDisconnect() {
    if (wsClient == null) {
        return;
    }
    wsClient.Close();
    wsClient = null;

    return;
}

async function openCamera() {
    if (wsClient == null) {
        alert('please connect server first...');
        return;
    }
    
    try {
        wsClient.OpenCamera(document.getElementById('CanvasMediaId'));
    } catch (error) {
        console.log('open camera error:', error);
        alert('open camera error:' + error);
    }
}

async function openScreenShared() {
    if (wsClient == null) {
        alert('please connect server first...');
        return;
    }
    
    try {
        wsClient.OpenScreenShared(document.getElementById('CanvasMediaId'));
    } catch (error) {
        console.log('open shared screen error:', error);
        alert('open shared screen error:' + error);
    }
}

document.getElementById('connectId').addEventListener('click', ()=>{
    websocketConnect()
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
    if (wsClient == null) {
        alert('please connect server first...');
        return;
    }
    wsClient.UpdateCameraPos(0);
})

document.getElementById('righttop').addEventListener('click', ()=>{
    if (wsClient == null) {
        alert('please connect server first...');
        return;
    }
    wsClient.UpdateCameraPos(1);
})

document.getElementById('leftbottom').addEventListener('click', ()=>{
    if (wsClient == null) {
        alert('please connect server first...');
        return;
    }
    wsClient.UpdateCameraPos(2);
})

document.getElementById('rightbottom').addEventListener('click', ()=>{
    if (wsClient == null) {
        alert('please connect server first...');
        return;
    }
    wsClient.UpdateCameraPos(3);
})

windowInit();