// import FlvMux from './FlvMux';
// import Encoder from './Encoder';
const FlvMux  = require('./FlvMux');
const Encoder  = require('./Encoder');

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
        this._connectFlag = false;
        this.ws = null;
        this.encoder = null;
        this.mux = null;
        this.canvasElement = null;

        this._host = null;
        this._uri = null;
    }

    async SetCanvasElement(ce) {
        this.canvasElement = ce;
    }

    async Init(host, uri) {
        let url = "";
        
        if (uri != "") {
            url = "ws://" + host + "/" + uri;
            console.log("connecting websocket url:", url);
        } else {
            url = "wss://" + host;
            console.log("connecting websocket ssl url:", url);
        }

        this._host = host;
        this._uri  = uri;

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log("ws client is opened....");
                this._connectFlag = true;
    
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

                resolve('open');
            };
            this.ws.onmessage = function (evt)  {
                console.log("ws client received message");
            };
             
            this.ws.onclose = function() {
                this._connectFlag = false;
                console.log("ws client closed...");
                reject('close');
            };
        });
    }

    OpenCamera(canvasElt) {
        if (!this._connectFlag) {
            alert('please connect websocket first');
            return;
        }
        this.canvasElement = canvasElt;
        this.encoder.InitCamera(this.canvasElement);
    }

    OpenScreenShared(canvasElt) {
        if (!this._connectFlag) {
            alert('please connect websocket first');
            return;
        }
        this.canvasElement = canvasElt;
        this.encoder.InitScreen(this.canvasElement);
    }

    UpdateCameraPos(index) {
        if (this.encoder == null) {
            alert('please open camera first');
            return;
        }

        this.encoder.UpdateCameraPos(index);
    }

    GetMediaStats() {
        if (!this._connectFlag) {
            return null;
        }
        if (this.mux == null) {
            return null;
        }

        return this.mux.GetMediaStats();
    }

    async Send(data) {
        //console.log("ws write in:", this._connectFlag);
        if (!this._connectFlag) {
            return;
        }
        //console.log("send data to ws:", data.byteLength, "data:", data);
        this.ws.send(data)
        return;
    }

    async Close() {
        if (!this._connectFlag) {
            return;
        }
        this._connectFlag = false;
        this._host = ''
        this._uri  = ''

        this.encoder.Close();
        this.encoder = null;

        this.mux.SetWriter(null);
        this.mux.Close();
        this.mux = null;

        this.ws.close();
        this.ws = null;
    }
}
module.exports = WsWriter;