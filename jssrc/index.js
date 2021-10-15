const WsWriter  = require('./WsWriter');


async function publish() {
    let videoElement = document.getElementById('video_container_publish')
    let wsClient = new WsWriter();
    wsClient.SetVideoElement(videoElement);
    wsClient.Init("127.0.0.1:1900", "live/6699.flv");
}

document.getElementById('publishId').addEventListener('click', ()=>{
    publish()
})

