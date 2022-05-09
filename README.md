# Webcodec Push

A demo can push vp8/h264+opus in flv over websocket to mediaserver.

Please use chrome version >= 93 for the demo.

You must use the [cpp_media_server](https://github.com/runner365/cpp_media_server) as the server side which support vp8/h264+opus in flv over websocket.


## 1. How to use
Please run it in pc.

***Chrome version >= 93.***

### 1.1 Install node module
we suggest node version 12.

* npm install
* npm start

access the url: http://localhost:9000/ in chrome.

### 1.2 About audio codec
webcodec only provide audio codec: ***Opus***

But the rtmp/flv doesn't support Opus.

we provide the customized ffmpeg which supports the vp8/vp9/opus in rtmp/flv.

the link: ***[ffmpeg github](https://github.com/runner365/my_ffmpeg)***

### 1.3 media server
The [cpp_media_server](https://github.com/runner365/cpp_media_server) provide:

* flv on websocket(for chrome push the media(h264/vp8+opus in flv)
* rtmp/httpflv/hls

wiki:
* [How to compile](https://github.com/runner365/cpp_media_server/blob/v1.0/doc/conf/0_how_to_build.md)
* [webobs configure](https://github.com/runner365/cpp_media_server/blob/v1.0/doc/conf/7_websocket_flv.md)
