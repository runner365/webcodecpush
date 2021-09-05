
class Http3Writer {
    constructor() {
        this.Init = false;
        this.transport = null;
        this.stream = null;
    }

    async init(url) {
        this.transport = new WebTransport(url);

        this.transport.closed.then(() => {
            console.log('quictransport closed');
        }).catch((error) => {
            console.error('quictransport error ', error);
        });

        await this.transport.ready;
        this.stream = await transport.createBidirectionalStream();
    }

    async write(data) {
        if (this.stream == null) {
            return;
        }
        this.stream.writable.getWriter().write(data);
        return;
    }

    async close() {
        if (this.stream == null) {
            return;
        }
        this.stream.close();
    }
}