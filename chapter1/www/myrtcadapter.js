function initWebRTCAdapter() {
    if (navigator.mozGetUserMedia) {
        webrtcDetectedBrowser = "firefox";

        RTCPeerConnection = mozRTCPeerConnection;
        RTCSessionDescription = mozRTCSessionDescription;
        RTCIceCandidate = mozRTCIceCandidate;
        getUserMedia = navigator.mozGetUserMedia.bind(navigator);

        attachMediaStream =
            function(element, stream) {
                element.mozSrcObject = stream;
                element.play();
            };

        reattachMediaStream =
            function(to, from) {
                to.mozSrcObject = from.mozSrcObject;
                to.play();
            };

        MediaStream.prototype.getVideoTracks =
            function() {
                return [];
            };

        MediaStream.prototype.getAudioTracks =
            function() {
                return [];
            };
        return true;
    } else if (navigator.webkitGetUserMedia) {
        webrtcDetectedBrowser = "chrome";

        RTCPeerConnection = webkitRTCPeerConnection;
        getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
        attachMediaStream =
            function(element, stream) {
                element.src = webkitURL.createObjectURL(stream);
            };

        reattachMediaStream =
            function(to, from) {
                to.src = from.src;
            };

        if (!webkitMediaStream.prototype.getVideoTracks) {
            webkitMediaStream.prototype.getVideoTracks =
                function() {
                    return this.videoTracks;
                };
            webkitMediaStream.prototype.getAudioTracks =
                function() {
                    return this.audioTracks;
                };
        }

        if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
            webkitRTCPeerConnection.prototype.getLocalStreams =
                function() {
                    return this.localStreams;
                };
            webkitRTCPeerConnection.prototype.getRemoteStreams =
                function() {
                    return this.remoteStreams;
                };
        }
        return true;
    } else return false;
};

