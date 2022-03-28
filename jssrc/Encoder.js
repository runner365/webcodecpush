

class Encoder {
    constructor() {
        this.videoElement_ = null;
        this.vencoder_ = null;
        this.aencoder_ = null;
        this.sendFrames_ = 0;
        this.videoGop_ = 60;
        this.videoCodecType = "h264";
        //this.videoCodecType = "vp8";
        //this.videoCodecType = "vp9";
        this.audioCodecType = "opus";
        this.mux = null;
    }

    async SetMux(mux) {
        this.mux = mux;
    }

    async Init(videoElement) {
        let shared = false;

        const constraints = {
            video: { width: { exact: 1280 }, height: { exact: 720 }, frameRate: { exact: 15 } },
            audio: {
                channelCount:2,
                sampleRate:48000,
            }
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
                    width: 2560,
                    height: 1440,
                    bitrate: 4000000,
                    hardwareAcceleration: "prefer-hardware",
                    //latencyMode: 'realtime',
                })
            } else if (this.videoCodecType == "vp8") {
                await this.vencoder_.configure({
                    codec: 'vp8',
                    width: 1280,
                    height: 720,
                    bitrate: 2000000,
                })
            }  else if (this.videoCodecType == "vp9") {
                await this.vencoder_.configure({
                    codec: 'vp09.00.10.08',
                    width: 1280,
                    height: 720,
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
            console.log('AudioEncoder configure...');
            await this.aencoder_.configure({ codec: this.audioCodecType, numberOfChannels: 1, sampleRate: 48000 });

            //open device: getDisplayMedia
            console.log('mediaDevices getDisplayMedia...');
            let stream = null;

            if (shared) {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { width: 2560, height: 1440 },
                });
            } else {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            
            //open video device
            console.log('open video device...');
            let vprocessor = new MediaStreamTrackProcessor(stream.getVideoTracks()[0]);
            let vgenerator = new MediaStreamTrackGenerator('video');
            const vsource = vprocessor.readable;
            const vsink = vgenerator.writable;
            let vtransformer = new TransformStream({ transform: this.videoTransform() });
            vsource.pipeThrough(vtransformer).pipeTo(vsink);

            //open audio device
            let aprocessor;
            let agenerator;
            if (stream.getAudioTracks().length > 0) {
                console.log('open audio device:', stream.getAudioTracks()[0]);
                aprocessor = new MediaStreamTrackProcessor(stream.getAudioTracks()[0]);
                agenerator = new MediaStreamTrackGenerator('audio');
                const asource = aprocessor.readable;
                const asink = agenerator.writable;
                let atransformer = new TransformStream({ transform: this.audioTransform() });
                asource.pipeThrough(atransformer).pipeTo(asink);    
            } else {
                console.log('There is no audio tracks.');
            }

            console.log('new MediaStream...');
            let processedStream = new MediaStream();
            processedStream.addTrack(vgenerator);
            if (!shared) {
                processedStream.addTrack(agenerator);
            }

            console.log('set video element src object....');
            videoElement.srcObject = processedStream;
            console.log('video element play....');
            await videoElement.play();
            console.log('video element play ok....');
        } catch (error) {
            console.log('init exception:', error);
            throw error
        }
    }

    videoTransform(frame, controller) {
        return (frame, controller) => {
            const insert_keyframe = (this.sendFrames_ % 120) == 0;
            this.sendFrames_++;
            this.vencoder_.encode(frame, { keyFrame: insert_keyframe });
            controller.enqueue(frame);
        }
    }

    audioTransform(frame, controller) {
        return (frame, controller) => {
            this.aencoder_.encode(frame);
            controller.enqueue(frame);
        }
    }

    async handleVideoEncoded(chunk, metadata) {
        if ((chunk == null) || (chunk.byteLength <= 0)) {
            return;
        }
        // actual bytes of encoded data
        let chunkData = new Uint8Array(chunk.byteLength);
        chunk.copyTo(chunkData);

        let ts = chunk.timestamp/1000;

        if (metadata.decoderConfig) {
            //todo:
            let avcSeqHdr = metadata.decoderConfig.description;
            //console.log("avc seq hdr:", avcSeqHdr, "data:", data);
            if ((avcSeqHdr != null) && (avcSeqHdr.byteLength > 0)) {
                this.mux.DoMux({media:"video", codecType: this.videoCodecType,
                        timestamp:ts, data:avcSeqHdr, isSeq:true, isKey:false});
            }
        }

        let isKey = chunk.type == 'key';

        this.mux.DoMux({media:"video", codecType: this.videoCodecType,
                timestamp:ts, data:chunkData, isSeq:false, isKey});
    }

    async handleAudioEncoded(chunk, metadata) {
        if ((chunk == null) || (chunk.byteLength <= 0)) {
            return;
        }
        // actual bytes of encoded data
        let chunkData = new Uint8Array(chunk.byteLength);
        chunk.copyTo(chunkData);

        let ts = chunk.timestamp/1000;

        if (metadata.decoderConfig) {
            //todo:
            let audioSeqHdr = metadata.decoderConfig.description;
            this.mux.DoMux({media:"audio", codecType: this.audioCodecType,
                    timestamp:ts, data:audioSeqHdr, isSeq:true, isKey:false});
        }

        this.mux.DoMux({media:"audio", codecType: this.audioCodecType,
                    timestamp:ts, data:chunkData, isSeq:false, isKey:false});
    }
}

module.exports = Encoder;