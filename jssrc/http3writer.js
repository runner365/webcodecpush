const BaseWriter = require('./BaseWriter');

class Http3Writer extends BaseWriter{
    constructor() {
        super();
        this.transport = null;
        this.stream = null;
    }

    async Init(host, uri) {
        var url = 'https://' + host + '/' + uri;

        this.transport = new WebTransport(url);

        this.transport.closed.then(() => {
            console.log('quictransport closed');
        }).catch((error) => {
            console.error('quictransport error ', error);
        });

        console.log('start webtransport url:', url);
        await this.transport.ready;
        console.log('webtransport is ready');

        this.stream = await transport.createBidirectionalStream();
    }

    async Send(data) {
        if (this.stream == null) {
            return;
        }
        this.stream.writable.getWriter().write(data);
        return;
    }

    async Close() {
        if (this.stream == null) {
            return;
        }
        this.stream.close();
    }
}

module.exports = Http3Writer;