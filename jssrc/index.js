const WsWriter  = require('./WsWriter');

function windowInit() {
    document.getElementById('serverHost').value = "localhost:12000";
    document.getElementById('subpath').value = "live/livestream";
}

async function publish() {
    let videoElement = document.getElementById('video_container_publish');
    let serverHost = document.getElementById('serverHost').value;
    let subpath = document.getElementById('subpath').value;
    let wsClient = new WsWriter();
    wsClient.SetVideoElement(videoElement);
    console.log("websocket url:", "ws://" + serverHost + "/" + subpath + ".flv")
    wsClient.Init(serverHost, subpath + ".flv");
}

document.getElementById('publishId').addEventListener('click', ()=>{
    publish()
})

windowInit();