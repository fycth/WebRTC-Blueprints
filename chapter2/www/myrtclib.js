
    var RTCPeerConnection = null;
    var webrtcDetectedBrowser = null;

    var room = null;
    var initiator;

    var pc = null;
    var signalingURL;

    var sendDChannel = null;

    var channelReady;
    var channel;

    var pc_config = {"iceServers":
       [{url:'stun:23.21.150.121'},
        {url:'stun:stun.l.google.com:19302'}]};

//    var sdpConstraints = {'mandatory': {'OfferToReceiveAudio':false, 'OfferToReceiveVideo':false }};

    function myrtclibinit(sURL) {
        signalingURL = sURL;
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
//        var pc_constraints = {"optional": [{"DtlsSrtpKeyAgreement": true},{RtpDataChannels: true}]};
        var pc_constraints = null;
        try {
            pc = new RTCPeerConnection(pc_config, pc_constraints);
            pc.onicecandidate = onIceCandidate;
        } catch (e) {
            pc = null;
            return;
        }
    };

    function createDataChannel() {
//        var data_constraint = {reliable :false};
        var data_constraint = null;
        sendDChannel = pc.createDataChannel("mydatachannel"+room,data_constraint);
        sendDChannel.onmessage = function(event) {
            alert("received: " + event.data);
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
//        var constraints = {"optional": [], "mandatory": {"MozDontOfferDataChannel": true}};
//        if (webrtcDetectedBrowser === "chrome")
//            for (var prop in constraints.mandatory) if (prop.indexOf("Moz") != -1) delete constraints.mandatory[prop];

//        constraints = mergeConstraints(constraints, sdpConstraints);
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
/*
    function mergeConstraints(cons1, cons2) {
        var merged = cons1;
        for (var name in cons2.mandatory) merged.mandatory[name] = cons2.mandatory[name];
        merged.optional.concat(cons2.optional);
        return merged;
    };
*/


