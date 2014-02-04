
    var RTCPeerConnection = null;
    var getUserMedia = null;
    var attachMediaStream = null;
    var reattachMediaStream = null;
    var webrtcDetectedBrowser = null;

    var room = null;
    var initiator;

    var localStream;
    var remoteStream;

    var pc = null;
    var signalingURL;

    var localVideo;
    var remoteVideo;

    var channelReady;
    var channel;

    var pc_config = {"iceServers":
       [{url:'stun:23.21.150.121'},
        {url:'stun:stun.l.google.com:19302'}]};

    var sdpConstraints = {'mandatory': {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true }};

    function myrtclibinit(sURL, lv, rv) {
        signalingURL = sURL;
        localVideo = lv;
        remoteVideo = rv;
        initWebRTCAdapter();
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
        doGetUserMedia();
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
        if (msg.type === 'CHATMSG') {
            onChatMsgReceived(msg.value);
        } else if (msg.type === 'offer') {
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
        } else if (msg.type === 'WRONGROOM') {
            window.location.href = "/";
        }
    };

    function doGetUserMedia() {
        var constraints = {"audio": true, "video": {"mandatory": {}, "optional": []}};
        try {
            getUserMedia(constraints, onUserMediaSuccess,
                function(e) {
                        console.log("getUserMedia error "+ e.toString());
                });
        } catch (e) {
            console.log(e.toString());
        }
    };

    function onUserMediaSuccess(stream) {
        attachMediaStream(localVideo, stream);
        localStream = stream;
        createPeerConnection();
        pc.addStream(localStream);

        if (initiator) doCall();
    };

    function createPeerConnection() {
        var pc_constraints = {"optional": [{"DtlsSrtpKeyAgreement": true}]};
        try {
            pc = new RTCPeerConnection(pc_config, pc_constraints);
            pc.onicecandidate = onIceCandidate;
        } catch (e) {
            console.log(e.toString());
            pc = null;
            return;
        }
        pc.onaddstream = onRemoteStreamAdded;
    };

    function onIceCandidate(event) {
        if (event.candidate)
            sendMessage({type: 'candidate', label: event.candidate.sdpMLineIndex, id: event.candidate.sdpMid,
                candidate: event.candidate.candidate});
    };

    function onRemoteStreamAdded(event) {
        attachMediaStream(remoteVideo, event.stream);
        remoteStream = event.stream;
    };

    function doCall() {
        var constraints = {"optional": [], "mandatory": {"MozDontOfferDataChannel": true}};
        if (webrtcDetectedBrowser === "chrome")
            for (var prop in constraints.mandatory) if (prop.indexOf("Moz") != -1) delete constraints.mandatory[prop];

        constraints = mergeConstraints(constraints, sdpConstraints);
        pc.createOffer(setLocalAndSendMessage, errorCallBack, constraints);
    };

    function doAnswer() {
        pc.createAnswer(setLocalAndSendMessage, errorCallBack, sdpConstraints);
    };

    function errorCallBack(e) {
        console.log("Something is wrong: " + e.toString());
    }

    function setLocalAndSendMessage(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        sendMessage(sessionDescription);
    };

    function mergeConstraints(cons1, cons2) {
        var merged = cons1;
        for (var name in cons2.mandatory) merged.mandatory[name] = cons2.mandatory[name];
        merged.optional.concat(cons2.optional);
        return merged;
    };

    function chatSendMessage(msg) {
        if (!channelReady) return;
        sendMessage({"type" : "CHATMSG", "value" : msg});
    };



