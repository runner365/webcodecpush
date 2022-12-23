const FlvMux  = require('./FlvMux');
const Encoder  = require('./Encoder');

class BaseWriter
{
    constructor() {
        this._connectFlag = false;
        this.encoder = null;
        this.mux = null;
        this.canvasElement = null;

        this._host = null;
        this._uri = null;

        this._cameraOpen = false;
    }

    async SetCanvasElement(ce) {
        this.canvasElement = ce;
    }

    OpenCamera(canvasElt) {
        if (!this._connectFlag) {
            alert('please connect websocket first');
            return;
        }
        this.canvasElement = canvasElt;
        this.encoder.InitCamera(this.canvasElement);

        this._cameraOpen = true;
    }

    OpenScreenShared(canvasElt) {
        if (!this._connectFlag) {
            alert('please connect websocket first');
            return;
        }
        if (!this._cameraOpen) {
            alert('please open camera first');
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

}

module.exports = BaseWriter;