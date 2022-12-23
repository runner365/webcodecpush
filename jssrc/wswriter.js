const BaseWriter = require('./BaseWriter');
const FlvMux     = require('./FlvMux');
const Encoder    = require('./Encoder');

function stringToUint8Array(str) {
    var arr = [];
    for (var i = 0, j = str.length; i < j; ++i) {
      arr.push(str.charCodeAt(i));
    }
   
    var tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array
}

class WsWriter extends BaseWriter {
    constructor() {
        super();
        this.ws = null;
    }

    async Init(host, uri) {
        let url = "";
        
        if (uri != "") {
            url = "ws://" + host + "/" + uri;
            console.log("connecting websocket url:", url);
        } else {
            url = "ws://" + host;
            console.log("connecting websocket ssl url:", url);
        }

        this._host = host;
        this._uri  = uri;

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log("ws client is opened....");
                this._connectFlag = true;
    
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