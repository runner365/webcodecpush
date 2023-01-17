const BaseWriter = require('./BaseWriter');
const FlvMux     = require('./FlvMux');
const Encoder    = require('./Encoder');

class Http3Writer extends BaseWriter{
    constructor() {
        super();
        this.transport = null;
        this.stream = null;
        this.writer = null;
    }

    async Init(host, uri) {
        var url = 'https://' + host + '/webtransport/push/' + uri;

        this.transport = new WebTransport(url);

        this.transport.closed.then(() => {
            console.log('quictransport closed');
        }).catch((error) => {
            console.error('quictransport error ', error);
        });

        console.log('start webtransport url:', url);
        await this.transport.ready;
        console.log('webtransport is ready');

        if (this.stream == null) {
            console.log('creating stream in webtransport');
            this.stream = await this.transport.createBidirectionalStream();
            this.writer = this.stream.writable.getWriter();
            this.writer.ready;
            console.log('stream in webtransport is created...');
        }

        this._connectFlag = true;

        this._host = host;
        this._uri  = uri;

        this.mux = new FlvMux();
        this.mux.SetWriter(this);
        this.mux.Init(true, false);

        this.encoder = new Encoder();
        this.encoder.SetMux(this.mux);
    }

    async Send(data) {
        if (!this._connectFlag) {
            return;
        }
        if (this.stream.writable.locked) {
            this.writer.write(data);
        } else {
            console.log("stream locked error, return:", this.stream.writable.locked);
        }
        
        return;
    }

    async Close() {
        if (this.stream == null) {
            return;
        }
        this.encoder.Close();
        this.encoder = null;

        this.mux.SetWriter(null);
        this.mux.Close();
        this.mux = null;
        
        this.writer.close();
        this._connectFlag = false;
        this.stream = null;
    }
}

module.exports = Http3Writer;