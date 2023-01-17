const BaseWriter = require('./BaseWriter');
const FlvMux     = require('./FlvMux');
const Encoder    = require('./Encoder');

class Http3Writer extends BaseWriter{
    constructor() {
        super();
        this.transport = null;
        this.stream = null;
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

        this.stream = await this.transport.createBidirectionalStream();
        console.log('create stream in webtransport');

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
        if (this.stream == null) {
            return;
        }
        
        await this.stream.writable.getWriter().ready;

        await this.stream.writable.getWriter().write(data);
        
        return;
    }

    async Close() {
        if (this.stream == null) {
            return;
        }
        this.stream.close();
        this._connectFlag = false;
        this.stream = null;
    }
}

module.exports = Http3Writer;