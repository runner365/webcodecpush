let FLV_CODEC_H264 = 7;
let FLV_CODEC_AV1  = 13;
let FLV_CODEC_VP8  = 14;
let FLV_CODEC_VP9  = 15;

class FlvMux {
    constructor() {
        this.initFlag = false;
        this.Writer = null;
    }

    async SetWriter(w) {
        this.Writer = w;
    }

    async Init(isVideo, isAudio) {
        if (this.initFlag) {
            return;
        }

        if (!this.initFlag) {
            /*|'F'(8)|'L'(8)|'V'(8)|version(8)|TypeFlagsReserved(5)|TypeFlagsAudio(1)|TypeFlagsReserved(1)|TypeFlagsVideo(1)|DataOffset(32)|PreviousTagSize(32)|*/
            let flag = 0;

            if (isVideo) {
                flag |= 0x01;
            }
            if (isAudio) {
                flag |= 0x04;
            }
            let flvHeader = new Uint8Array([0x46, 0x4c, 0x56, 0x01, flag, 0x00, 0x00, 0x00, 0x09]);
            await this.output(flvHeader);
            let preSize0 = new Uint8Array([0, 0, 0, 0]);
            await this.output(preSize0);
            this.initFlag = true;
        }

    }
    async DoMux(packet) {
        let {media, codecType, timestamp, data, isSeq, isKey} = packet;

        //console.log("domux media:", media, "timestamp:", timestamp, "data:", data);
        if ((media == null) || (media != "video" && media != "audio")) {
            return
        }

        /*|Tagtype(8)|DataSize(24)|Timestamp(24)|TimestampExtended(8)|StreamID(24)|Data(...)|PreviousTagSize(32)|*/
        let dataSize = data.byteLength;
        let total = 0;

        if (media == "video") {
            //11 bytes header | 0x17 00 | 00 00 00 | data[...] | pre tag size
            total = 11 + 2 + 3 + dataSize + 4;
        } else if (media == "audio") {
            //11 bytes header | 0xaf 00 | data[...] | pre tag size
            total = 11 + 2 + dataSize + 4;
        }
        let tagData = new Uint8Array(total)
        
        if (media == "video") {
            tagData[0] = 9;
        } else {
            tagData[0] = 8;
        }

        let mediaSize = 0;//5 + dataSize;//0x17 01 00 00 00 + [data...]
        if (media == "video") {
            //0x17 00 | 00 00 00 | data[...] 
            mediaSize = 2 + 3 + dataSize;
        } else if (media == "audio") {
            //0xaf 00 | data[...]
            mediaSize = 2 + dataSize;
        }

        //Set DataSize(24)
        tagData[1] = (mediaSize >> 16) & 0xff;
        tagData[2] = (mediaSize >> 8) & 0xff;
        tagData[3] = mediaSize & 0xff;

        //Set Timestamp(24)|TimestampExtended(8)
        let timestampBase = timestamp & 0xffffff;
        let timestampExt = (timestamp >> 24) & 0xff;

        tagData[4] = (timestampBase >> 16) & 0xff;
        tagData[5] = (timestampBase >> 8) & 0xff;
        tagData[6] = timestampBase & 0xff;
        tagData[7] = timestampExt & 0xff;

        //Set StreamID(24) as 1
        tagData[8] = 0;
        tagData[9] = 0;
        tagData[10] = 1;

        let start = 0;
        let preSize = 0;
        
        if (media == "video") {
            //set media header
            if (isSeq) {
                tagData[11] = 0x10;
                tagData[12] = 0x00;
            } else if (isKey) {
                tagData[11] = 0x10;
                tagData[12] = 0x01;
            } else {
                tagData[11] = 0x20;
                tagData[12] = 0x01;
            }
            if (codecType == "h264") {
                tagData[11] |= FLV_CODEC_H264;
            } else if (codecType == "vp8") {
                tagData[11] |= FLV_CODEC_VP8
            } else if (codecType == "vp9") {
                tagData[11] |= FLV_CODEC_VP9
            }
            tagData[13] = 0x00;
            tagData[14] = 0x00;
            tagData[15] = 0x00;
            start = 11 + 5;
            preSize = 11 + 5 + data.byteLength;
        } else if (media == "audio") {
            tagData[11] = 0x9f;
            if (isSeq) {
                tagData[12] = 0x00;
            } else {
                tagData[12] = 0x01;
            }
            start = 11 + 2;
            preSize = 11 + 2 + data.byteLength;
        } else {
            return;
        }

        var inputData = new Uint8Array(data);
        for (var i = 0; i < dataSize; i++) {
            tagData[start + i] = inputData[i];
        }
        start = preSize;

        tagData[start + 0] = (preSize >> 24) & 0xff;
        tagData[start + 1] = (preSize >> 16) & 0xff;
        tagData[start + 2] = (preSize >> 8) & 0xff;
        tagData[start + 3] = preSize & 0xff;

        await this.output(tagData);
    }

    async output(data) {
        await this.Writer.Send(data)
    }
}