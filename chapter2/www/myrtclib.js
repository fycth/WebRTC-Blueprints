
    var RTCPeerConnection = null;
    var webrtcDetectedBrowser = null;

    var room = null;
    var initiator;

    var pc = null;
    var signalingURL;

    var sendDChannel = null;
    var recvDChannel = null;

    var channelReady;
    var channel;

    var pc_constraints = {"optional": [{RtpDataChannels: true}]};
    var data_constraint = {reliable :false};

    var pc_config = {"iceServers":
       [{url:'stun:23.21.150.121'},
        {url:'stun:stun.l.google.com:19302'}]};

    function myrtclibinit(sURL) {
        signalingURL = sURL;
        initWebRTCAdapter();
        if (webrtcDetectedBrowser === 'firefox' ||
            (webrtcDetectedBrowser === 'chrome' && webrtcDetectedVersion >= 31)) {
            pc_constraints = null;
            data_constraint = null;
        }

//        window.webkitStorageInfo.requestQuota(window.PERSISTENT, 1024*1024, function(grantedBytes) {
//            console.log("quota granted " + grantedBytes);
//        }, function(e) {
//            console.log('Error', e);
//        });

        openChannel();
    };

    function openChannel() {
        channelReady = false;
        channel = new WebSocket(signalingURL);
        channel.onopen = onChannelOpened;
        channel.onmessage = onChannelMessage;
        channel.onclose = onChannelClosed;
    };

    function onChannelOpened() {
        channelReady = true;
        createPeerConnection();

        if(location.search.substring(1,5) == "room") {
            room = location.search.substring(6);
            sendMessage({"type" : "ENTERROOM", "value" : room * 1});
            initiator = true;
            doCall();
        } else {
            sendMessage({"type" : "GETROOM", "value" : ""});
            initiator = false;
        }
    };

    function onChannelMessage(message) {
        processSignalingMessage(message.data);
    };

    function onChannelClosed() {
        channelReady = false;
    };

    function sendMessage(message) {
        var msgString = JSON.stringify(message);
        channel.send(msgString);
    };

    function processSignalingMessage(message) {
        var msg = JSON.parse(message);

        console.log(msg);

        if (msg.type === 'offer') {
            pc.setRemoteDescription(new RTCSessionDescription(msg));
            doAnswer();
        } else if (msg.type === 'answer') {
            pc.setRemoteDescription(new RTCSessionDescription(msg));
        } else if (msg.type === 'candidate') {
            var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label, candidate:msg.candidate});
            pc.addIceCandidate(candidate);
        } else if (msg.type === 'GETROOM') {
            room = msg.value;
            OnRoomReceived(room);
            pc.ondatachannel = recvChannelCallback;
        } else if (msg.type === 'WRONGROOM') {
            window.location.href = "/";
        }
    };

    function createPeerConnection() {
        try {
            pc = new RTCPeerConnection(pc_config, pc_constraints);
            pc.onicecandidate = onIceCandidate;
        } catch (e) {
            console.log(e);
            pc = null;
            return;
        }
    };

    function createDataChannel() {
        try {
            sendDChannel = pc.createDataChannel("mydatachannel"+room,data_constraint);
        } catch (e) {
            console.log('error creating data channel ' + e);
            return;
        }
        sendDChannel.onopen = onSendChannelStateChange;
        sendDChannel.onclose = onSendChannelStateChange;
    }

    function onIceCandidate(event) {
        if (event.candidate)
            sendMessage({type: 'candidate', label: event.candidate.sdpMLineIndex, id: event.candidate.sdpMid,
                candidate: event.candidate.candidate});
    };

    function failureCallback(e) {
        console.log("failure callback "+ e.message);
    }

    function doCall() {
        createDataChannel();
        pc.createOffer(setLocalAndSendMessage, failureCallback, null);
    };

    function doAnswer() {
        pc.createAnswer(setLocalAndSendMessage, failureCallback, null);
    };

    function setLocalAndSendMessage(sessionDescription) {
        sessionDescription.sdp = bandwidthHack(sessionDescription.sdp);
        pc.setLocalDescription(sessionDescription);
        sendMessage(sessionDescription);
    };

    function bandwidthHack(sdp) {
        // FireFox doesn't support this
        if (webrtcDetectedBrowser === 'firefox') return sdp;

        sdp = sdp.replace( /b=AS([^\r\n]+\r\n)/g , '');
        sdp = sdp.replace( /a=mid:data\r\n/g , 'a=mid:data\r\nb=AS:1638400\r\n');

        return sdp;
    };

    function sendDataMessage(data) {
        sendDChannel.send(data);
    };

    function onSendChannelStateChange() {
        var readyState = sendDChannel.readyState;
        console.log('Send channel state is: ' + readyState);
        if (readyState == "open") {
        } else {
        }
    }

    function recvChannelCallback(evt) {
        console.log('Receive Channel Callback');
        recvDChannel = evt.channel;
        recvDChannel.onmessage = onReceiveMessageCallback;
        recvDChannel.onopen = onReceiveChannelStateChange;
        recvDChannel.onclose = onReceiveChannelStateChange;
    }

    function onReceiveChannelStateChange() {
        var readyState = recvDChannel.readyState;
        console.log('Receive channel state is: ' + readyState);
    }

    function onReceiveMessageCallback(event) {
        try {
            var msg = JSON.parse(event.data);
            if (msg.type === 'file')
            {
//                    function onFSinit(fs) {
//                        fs.root.getFile(msg.name, {create: true}, function(fileEntry) {
                console.log('received file written');
//                            fileEntry.createWriter(function(fileWriter) {
//                                fileWriter.onwriteend = function(e) {
//                                    console.log('Write completed.');
//                                };
//
//                                fileWriter.onerror = function(e) {
//                                    console.log('Write failed: ' + e.toString());
//                                };

//                                var hyperlink = document.createElement('a');
//                                hyperlink.href = msg.data;
//                                hyperlink.target = '_blank';
//                                hyperlink.download = msg.name || msg.data;

                onFileReceived(msg.name, msg.size, msg.data);

//                                var mouseEvent = new MouseEvent('click', {
//                                    view: window,
//                                    bubbles: true,
//                                    cancelable: true
//                                });

//                                hyperlink.dispatchEvent(mouseEvent);
//                                (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);



//                            }, onFSerror);

//                        }, onFSerror);
//                    }
//                    function onFSerror(e) {
//                        console.log('Error: ' + e);
//                    }
//                    window.requestFileSystem(window.PERSISTENT, msg.size, onFSinit, onFSerror);
            }
        }
        catch (e) {}
    };
