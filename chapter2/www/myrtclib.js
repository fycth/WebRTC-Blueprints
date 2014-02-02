
    var RTCPeerConnection = null;
    var webrtcDetectedBrowser = null;

    var room = null;
    var initiator;

    var pc = null;
    var signalingURL;

    var sendDChannel = null;

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

        window.webkitStorageInfo.requestQuota(window.PERSISTENT, 1024*1024, function(grantedBytes) {
            console.log("quota granted " + grantedBytes);
        }, function(e) {
            console.log('Error', e);
        });

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

        if(location.search.substring(1,5) == "room") {
            room = location.search.substring(6);
            sendMessage({"type" : "ENTERROOM", "value" : room * 1});
            initiator = true;
        } else {
            sendMessage({"type" : "GETROOM", "value" : ""});
            initiator = false;
        }
        doCreateDataChannel();
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
            createDataChannel();
        } else if (msg.type === 'WRONGROOM') {
            window.location.href = "/";
        }
    };

    function doCreateDataChannel() {
        createPeerConnection();

        if (initiator) doCall();
    };

    function createPeerConnection() {
        try {
            pc = new RTCPeerConnection(pc_config, pc_constraints);
            pc.onicecandidate = onIceCandidate;
        } catch (e) {
            pc = null;
            return;
        }
    };

    function createDataChannel() {
        sendDChannel = pc.createDataChannel("mydatachannel"+room,data_constraint);
        sendDChannel.onmessage = function(event) {
            try {
                var msg = JSON.parse(event.data);
                if (msg.type === 'file')
                {
                    onFileReceived(msg.name, msg.size);
                    function onFSinit(fs) {
                        fs.root.getFile(msg.name, {create: true}, function(fileEntry) {
                            console.log('received file written to ' + fileEntry.fullPath);
                            fileEntry.createWriter(function(fileWriter) {
                                fileWriter.onwriteend = function(e) {
                                    console.log('Write completed.');
                                };

                                fileWriter.onerror = function(e) {
                                    console.log('Write failed: ' + e.toString());
                                };


                                var hyperlink = document.createElement('a');
                                hyperlink.href = msg.data;
                                hyperlink.target = '_blank';
                                hyperlink.download = msg.name || msg.data;

                                var mouseEvent = new MouseEvent('click', {
                                    view: window,
                                    bubbles: true,
                                    cancelable: true
                                });

                                hyperlink.dispatchEvent(mouseEvent);
                                (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);



                            }, onFSerror);

                        }, onFSerror);
                    }
                    function onFSerror(e) {
                        console.log('Error: ' + e);
                    }
                    window.requestFileSystem(window.PERSISTENT, msg.size, onFSinit, onFSerror);
                }
            }
            catch (e) {}
        }
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
        var msg = new RTCSessionDescription(sessionDescription);
        pc.setLocalDescription(msg);
        sendMessage(msg);
    };

    function sendDataMessage(data) {
        sendDChannel.send(data);
    }


