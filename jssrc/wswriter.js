function stringToUint8Array(str) {
    var arr = [];
    for (var i = 0, j = str.length; i < j; ++i) {
      arr.push(str.charCodeAt(i));
    }
   
    var tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array
}

class WsWriter {
    constructor() {
        this.connectFlag = false;
        this.ws = null;
        this.encoder = null;
        this.mux = null;
        this.videoElement = null;
    }

    async SetVideoElement(ve) {
        this.videoElement = ve;
    }

    async Init(host, uri) {
        //"localhost:1900", "/live/1000.flv"
        console.log("try to open host:", host, "uri:", uri);
        let url = "ws://" + host + "/" + uri;
        this.ws = new WebSocket(url);
        this.ws.onopen = () =>
        {
            console.log("ws client is opened....");
            this.connectFlag = true;

            let uriArray = stringToUint8Array(uri);
            let total = 1 + 2 + uriArray.byteLength;
            let uriData = new Uint8Array(total)
            uriData[0] = 0x02;
            uriData[1] = (uriArray.byteLength & 0xff00) >> 8;
            uriData[2] = uriArray.byteLength & 0xff;

            for (var i = 0; i < uriArray.byteLength; i++) {
                uriData[3 + i] = uriArray[i];
            }
            console.log("uri array:", uriData);
            this.Send(uriData);

            this.mux = new FlvMux();
            this.mux.SetWriter(this);
            this.mux.Init(true, false);

            this.encoder = new Encoder();
            this.encoder.SetMux(this.mux);
            this.encoder.Init(this.videoElement);
        };
        this.ws.onmessage = function (evt) 
        {
            console.log("ws client received message");
        };
         
        this.ws.onclose = function()
        {
            this.connectFlag = false;
            console.log("ws client closed...");
        };
    }

    async Send(data) {
        //console.log("ws write in:", this.connectFlag);
        if (!this.connectFlag) {
            return;
        }
        //console.log("send data to ws:", data.byteLength, "data:", data);
        this.ws.send(data)
        return;
    }

    async close() {
        
    }


}