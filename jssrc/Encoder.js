
const { AwaitQueue } = require('awaitqueue');

var g_canvasElement = null;
var g_canvasDrawFlag = false;
var screenImg = null;
var cameraImg = null;
var cameraPosX = 0;
var cameraPosY = 0;

var cameraW = 320;
var cameraH = 180;

var canvasW = 1280;
var canvasH = 720;

function DrawAll(flag) {
    if (g_canvasElement == null) {
        return;
    }
    var ctx = g_canvasElement.getContext('2d');

    ctx.rect(0, 0, canvasW, canvasH);
    ctx.fillStyle = 'Purple';
    ctx.fill();

    if (screenImg) {
        ctx.drawImage(screenImg, 0, 0, canvasW, canvasH);
    }

    if (cameraImg) {
        ctx.drawImage(cameraImg, cameraPosX, cameraPosY);
    }
    if (flag) {
        setTimeout(DrawAll, 1000 / 15.0, true);
    }
}

class Encoder {
    constructor() {
        this.videoElement_ = null;
        this.vencoder_ = null;
        this.aencoder_ = null;
        this.aFrameCount_ = 0;
        this.videoFrames_ = 0;
        this.audioFrames_ = 0;
        this.videoGop_ = 60;
        this.videoCodecType = "h264";
        //this.videoCodecType = "vp8";
        //this.videoCodecType = "vp9";
        this.audioCodecType = "opus";
        this.mux = null;

        this._cameraStream = null;
        this._screenStream = null;
        this._canvasStream = null;
        
        this._cameraAudioInit = false;
        this._screenAudioInit = false;

        this._vprocessor = null;
        this._vgenerator = null;
        this._vtransformer = null;

        this._aProcessor   = null;
        this._aGenerator   = null;
        this._aTransformer = null;

        this._audioChunkTs = 0;
        this._videoChunkTs = 0;

        this._videoTs = 0;
        this._audioTs = 0;

        this._audioCtx = null;
        this._screenSource = null;
        this._cameraSource = null;
        this._destNode = null;

        this._queue = new AwaitQueue();
    }

    async SetMux(mux) {
        this.mux = mux;
    }

    Close() {
        console.log('encode close...');
        for (const videoTrack of this._canvasStream.getVideoTracks()) {
            videoTrack.stop();
        }
        for (const audioTrack of this._canvasStream.getAudioTracks()) {
            audioTrack.stop();
        }
        g_canvasDrawFlag = false;
        screenImg = null;
        cameraImg = null;
        cameraPosX = 0;
        cameraPosY = 0;

        this.videoElement_ = null;
        this.vencoder_ = null;
        this.aencoder_ = null;
        this.aFrameCount_ = 0;
        this.videoFrames_ = 0;
        this.audioFrames_ = 0;
        this.videoGop_ = 60;
        this.videoCodecType = "h264";
        this.audioCodecType = "opus";
        this.mux = null;

        this._cameraStream = null;
        this._screenStream = null;
        this._canvasStream = null;

        this._vprocessor = null;
        this._vgenerator = null;
        this._vtransformer = null;

        this._aProcessor   = null;
        this._aGenerator   = null;
        this._aTransformer = null;

        this._audioChunkTs = 0;
        this._videoChunkTs = 0;

        this._videoTs = 0;
        this._audioTs = 0;

        if (g_canvasElement) {
            var ctx = g_canvasElement.getContext('2d');
            if (ctx) {
                ctx.rect(0, 0, canvasW, canvasH);
                ctx.fillStyle = 'White';
                ctx.fill();
            }
            g_canvasElement = null;
        }
    }

    async InitCodecs() {
        if (this.vencoder_ || this.aencoder_) {
            console.log('video and audio codec have been inited...');
            return;
        }
        try {
            //video encode init
            console.log('VideoEncoder construct...');
            this.vencoder_ = new VideoEncoder({
                output: this.handleVideoEncoded.bind(this),
                error: (error) => {
                    console.error("video encoder error:" + error)
                }
            })

            console.log('VideoEncoder configure type:', this.videoCodecType);
            if (this.videoCodecType == "h264") {
                await this.vencoder_.configure({
                    avc: {format: "avc"},
                    codec: 'avc1.42e01f',
                    width: canvasW,
                    height: canvasH,
                    bitrate: 2000000,
                    hardwareAcceleration: "prefer-hardware",
                    //latencyMode: 'realtime',
                })
            } else if (this.videoCodecType == "vp8") {
                await this.vencoder_.configure({
                    codec: 'vp8',
                    width: canvasW,
                    height: canvasH,
                    bitrate: 2000000,
                })
            }  else if (this.videoCodecType == "vp9") {
                await this.vencoder_.configure({
                    codec: 'vp09.00.10.08',
                    width: canvasW,
                    height: canvasH,
                    bitrate: 2000000,
                })
            } else {
                console.error("video codec type error:", this.videoCodecType);
                return;
            }

            //audio encode init
            console.log('AudioEncoder construct...');
            this.aencoder_ = new AudioEncoder({
                output: this.handleAudioEncoded.bind(this),
                error: (error) => {
                    console.error("audio encoder error:" + error);
                }
            });
            await this.aencoder_.configure({ codec: this.audioCodecType, numberOfChannels: 2, sampleRate: 48000 });
        } catch (error) {
            console.log('codec init exception:', error);
        }
    }

    async InitScreen(canvasElement) {
        var screenElement = null;
        g_canvasElement = canvasElement;
        g_canvasDrawFlag = true;
        try {
            this._screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: canvasW, height: canvasH },
                audio: true,
            });
            console.log('set video element src object....');
            if (this._screenStream.getAudioTracks()) {
                console.log('screen audio tracks:', this._screenStream.getAudioTracks().length);
            }

            screenElement = document.getElementById('videoScreenId');
            if (screenElement == null) {
                screenElement = document.createElement("video");
                screenElement = document.createElement("video");
                screenElement.id = 'videoScreenId';
                screenElement.className = 'videoView';
                screenElement.setAttribute("playsinline", "playsinline");
                screenElement.setAttribute("autoplay", "autoplay");
                screenElement.setAttribute("loop", "loop");
                screenElement.setAttribute("controls", "controls");
                screenElement.srcObject    = this._screenStream;
                screenElement.style.width  = canvasW;
                screenElement.style.height = canvasH;
            }
            
            console.log('screen element play....');
            screenElement.play();
            await this.screenPlay(screenElement);

            await this.InitCodecs();
            this.initCanvasStream(g_canvasElement);
        } catch (error) {
            console.log("init screen exception:", error);   
        }
    }

    async screenPlay(screenElement) {
        return new Promise((resolve, reject) => {
            screenElement.addEventListener('play', function() {
                screenImg = this;
                DrawAll(true);
                console.log('screen play is ready......');
                resolve(true)
            }, 0);
        })
    }

    async InitCamera(canvasElement) {
        if (this._cameraStream) {
            alert("can't open camera again");
            return;
        }
        g_canvasElement = canvasElement;
        const constraints = {
            video: { width: { exact: cameraW }, height: { exact: cameraH }, frameRate: { exact: 30 }, frameRate: { exact: 30 } },
            audio: {
                channelCount:2,
                sampleRate:48000,
            }
        }

        try {
            console.log('open camera constraints:', JSON.stringify(constraints));
            this._cameraStream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log('set video element src object....');
            var videoElement = document.createElement("video");
            videoElement.id = 'videoCameraId';
            videoElement.className = 'videoView';
            videoElement.setAttribute("playsinline", "playsinline");
            videoElement.setAttribute("autoplay", "autoplay");
            videoElement.setAttribute("loop", "loop");
            videoElement.setAttribute("controls", "controls");
            videoElement.srcObject    = this._cameraStream;
            videoElement.style.width  = cameraW;
            videoElement.style.height = cameraH;

            console.log('video element play....');
            videoElement.play();

            await this.cameraPlay(videoElement);

            await this.InitCodecs();
            this.initCanvasStream(g_canvasElement);

        } catch (error) {
            console.log('init exception:', error);
            throw error
        }
    }

    async cameraPlay(cameraElement) {
        return new Promise((resolve, reject) => {
            cameraElement.addEventListener('play', function() {
                cameraImg = this;
                console.log('camera play is ready, cameraImg:', cameraImg);
                DrawAll(true);
                resolve(true)
            }, 0);
        })
    }

    initCanvasAudio() {
        if (this._audioCtx) {
            this._audioCtx.close();
            this._audioCtx = new AudioContext({
                latencyHint: 'interactive',
                sampleRate: 48000,
              });
              this._destNode     = null;
              this._aProcessor   = null;
              this._aGenerator   = null;
              this._aTransformer = null;
              this._screenSource = null;
              this._cameraSource = null;
        } else {
            this._audioCtx = new AudioContext({
                latencyHint: 'interactive',
                sampleRate: 48000,
              });
        }

        //open screen audio device
        if ((this._screenStream != null) && (this._screenStream.getAudioTracks().length > 0)) {
            console.log('open screen audio device:', this._screenStream.getAudioTracks()[0], ' for canvas stream');
            //this._canvasStream.addTrack(this._screenStream.getAudioTracks()[0]);
            this._screenSource = this._audioCtx.createMediaStreamSource(this._screenStream);

            if (this._destNode == null) {
                this._destNode = this._audioCtx.createMediaStreamDestination();
                this._screenSource.connect(this._destNode);
                console.log("screen dest node voice tracks:", this._destNode.stream.getAudioTracks().length);
                this._aProcessor = new MediaStreamTrackProcessor(this._destNode.stream.getAudioTracks()[0]);
                this._aGenerator = new MediaStreamTrackGenerator('audio');
                const asource = this._aProcessor.readable;
                const asink = this._aGenerator.writable;
                this._aTransformer = new TransformStream({ transform: this.audioTransform() });
                asource.pipeThrough(this._aTransformer).pipeTo(asink);  
                
            } else {
                this._screenSource.connect(this._destNode);
            }
        }
        
        //open camera audio device
        if ((this._cameraStream != null) && (this._cameraStream.getAudioTracks().length > 0)) {
            //this._canvasStream.addTrack(this._cameraStream.getAudioTracks()[0]);
            console.log('add camera audio in canvas...');

            this._cameraSource = this._audioCtx.createMediaStreamSource(this._cameraStream);
            if (this._destNode == null) {
                this._destNode = this._audioCtx.createMediaStreamDestination();
                this._cameraSource.connect(this._destNode); 
                console.log("camera dest node voice tracks:", this._destNode.stream.getAudioTracks().length);
                this._aProcessor = new MediaStreamTrackProcessor(this._destNode.stream.getAudioTracks()[0]);
                this._aGenerator = new MediaStreamTrackGenerator('audio');
                const asource = this._aProcessor.readable;
                const asink = this._aGenerator.writable;
                this._aTransformer = new TransformStream({ transform: this.audioTransform() });
                asource.pipeThrough(this._aTransformer).pipeTo(asink);  
            } else {
                this._cameraSource.connect(this._destNode);
            }
            
        }
    }

    initCanvasStream(canvasElement) {
        if (this._canvasStream) {
            this.initCanvasAudio();
            return;
        }
        this._canvasStream = canvasElement.captureStream(30);

        //open video device
        console.log('open video device for canvas stream');
        this._vprocessor = new MediaStreamTrackProcessor(this._canvasStream.getVideoTracks()[0]);
        this._vgenerator = new MediaStreamTrackGenerator('video');
        const vsource = this._vprocessor.readable;
        const vsink = this._vgenerator.writable;
        this._vtransformer = new TransformStream({ transform: this.videoTransform() });
        vsource.pipeThrough(this._vtransformer).pipeTo(vsink);

        this.initCanvasAudio();

        return;
    }

    UpdateCameraPos(index) {
        switch (index) {
            case 0://left top
            {
                cameraPosX = 0;
                cameraPosY = 0;
                break;
            }
            case 1://right top
            {
                cameraPosX = canvasW - cameraW;
                cameraPosY = 0;
                break;
            }
            case 2://left bottom
            {
                cameraPosX = 0;
                cameraPosY = canvasH - cameraH;
                break;
            }
            case 3://right bottom
            {
                cameraPosX = canvasW - cameraW;
                cameraPosY = canvasH - cameraH;
                break;
            }
            default:
                break;
        }
        console.log('update camera pos index:', index, ", w:", cameraPosX, ", h:", cameraPosY);
    }

    videoTransform(frame, controller) {
        return (frame, controller) => {
            const insert_keyframe = (this.videoFrames_ % 60) == 0;
            this.videoFrames_++;

            try {
                this.vencoder_.encode(frame, { keyFrame: insert_keyframe });
                controller.enqueue(frame);
            } catch (error) {
                console.log("video encode exception:", error);
            }
        }
    }

    audioTransform(frame, controller) {
        return (frame, controller) => {
            try {
                if ((this.aFrameCount_++ % 10) == 0) {
                    var canvas = document.getElementById("CanvasMediaId");
                    var ctx = canvas.getContext("2d");
                    
                    ctx.beginPath();
                    ctx.moveTo(1,0);
                    ctx.lineTo(1, 100);
                    ctx.stroke();
                    DrawAll(false);
                }

                this.aencoder_.encode(frame);
                controller.enqueue(frame);
            } catch (error) {
                console.log("audio encode exception:", error);
            }

        }
    }

    async handleVideoEncoded(chunk, metadata) {
        let ts = 0;
        try {
            if ((chunk == null) || (chunk.byteLength <= 0)) {
                return;
            }
    
            let chunkData = new Uint8Array(chunk.byteLength);
            chunk.copyTo(chunkData);

            if (this._videoChunkTs == 0) {
                ts = 0;
                this._videoChunkTs = chunk.timestamp;
            } else {
                let diff = chunk.timestamp - this._videoChunkTs;
                this._videoChunkTs = chunk.timestamp;
                this._videoTs += diff;
                ts = this._videoTs/1000;
            }
    
            if (metadata.decoderConfig) {
                //todo:
                let avcSeqHdr = metadata.decoderConfig.description;
                //console.log("avc seq hdr:", avcSeqHdr, "data:", data);
                if ((avcSeqHdr != null) && (avcSeqHdr.byteLength > 0)) {
                    this._queue.push(async () => {
                        if (this.mux == null) {
                            return;
                        }
                        this.mux.DoMux({media:"video", codecType: this.videoCodecType,
                        timestamp:ts, data:avcSeqHdr, isSeq:true, isKey:false});
                    }).catch((error) => {
                        console.log('room creation or room joining failed:', error);
                    });
                }
            }
    
            let isKey = chunk.type == 'key';

            this._queue.push(async () => {
                if (this.mux == null) {
                    return;
                }
                this.mux.DoMux({media:"video", codecType: this.videoCodecType,
                timestamp:ts, data:chunkData, isSeq:false, isKey});
            }).catch((error) => {
                console.log('room creation or room joining failed:', error);
            });
        } catch (error) {
            console.log('video encode exception:', error);
        }
    }

    async handleAudioEncoded(chunk, metadata) {
        let ts = 0;

        try {
            if ((chunk == null) || (chunk.byteLength <= 0)) {
                return;
            }
            // actual bytes of encoded data
            let chunkData = new Uint8Array(chunk.byteLength);
            chunk.copyTo(chunkData);

            if (this._audioChunkTs == 0) {
                ts = 0;
                this._audioChunkTs = chunk.timestamp;
            } else {
                let diff = chunk.timestamp - this._audioChunkTs;
                this._audioChunkTs = chunk.timestamp;
                this._audioTs += diff;
                ts = this._audioTs/1000;
            }

            if (metadata.decoderConfig) {
                //todo:
                let audioSeqHdr = metadata.decoderConfig.description;

                this._queue.push(async () => {
                    if (this.mux == null) {
                        return;
                    }
                    this.mux.DoMux({media:"audio", codecType: this.audioCodecType,
                                timestamp:ts, data:audioSeqHdr, isSeq:true, isKey:false});
                }).catch((error) => {
                    console.log('room creation or room joining failed:%o', error);
                });
            }

            this._queue.push(async () => {
                if (this.mux == null) {
                    return;
                }
                this.mux.DoMux({media:"audio", codecType: this.audioCodecType,
                            timestamp:ts, data:chunkData, isSeq:false, isKey:false});
            }).catch((error) => {
                console.log('room creation or room joining failed:%o', error);
            });
        } catch (error) {
            console.log("audio encode exception:", error);
        }
    }
}

module.exports = Encoder;
