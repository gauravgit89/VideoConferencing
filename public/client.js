var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btngoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;


//Global variables
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;

//STUN servers
var iceServers = {
    "iceServers":[
            { "url": "stun:stun.services.mozilla.com"},
            { "url": "stun:stun1.google.com:19302"}
    ]}

var streamContraints = {audio: true, video: true};
var isCaller;


var socket = io();

btngoRoom.onclick = function(){
    if(inputRoomNumber.value === ""){
        alert("Please type a room number");
    }
    else{
        roomNumber = inputRoomNumber.value;
        socket.emit("create or join", roomNumber);
        divSelectRoom.style = "display: none";
        divConsultingRoom.style = "display: block";
    }
}

socket.on("created", function(room){
    //caller gets user media with defined constraints
    navigator.mediaDevices.getUserMedia(streamContraints).then(function(stream){
        console.log("creating");
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function(err){
        console.log(err);
        console.log("Error occurred while accessing media devices. Create");
    });
});


socket.on("joined", function(room){
    //callee gets user media services
    navigator.mediaDevices.getUserMedia(streamContraints).then(function(stream){
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit("ready", roomNumber);
    }).catch(function(err){
        console.log(err);
        console.log("Error occurred while accessing media devices. Join")
    })
})

socket.on("ready", function(){
    if(isCaller){
        //creates an RTCPeerConnection object
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        
        //adds event listeners 
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        rtcPeerConnection.addStream(localStream);

        rtcPeerConnection.createOffer(setLocalAndOffer, function(e){console.log(e)});
    }
})

socket.on("offer", function(event){
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        rtcPeerConnection.addStream(localStream);

        //stores offer as remote description
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));

        //prepares an answer
        rtcPeerConnection.createAnswer(setLocalAndAnswer, function(e){console.log(e)});
    }
})

socket.on("answer", function(event){
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})

socket.on("candidate", function(event){
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });

    rtcPeerConnection.addIceCandidate(candidate);
})

function onAddStream(event){
    remoteVideo.srcObject = event.stream;
    remoteStream = event.stream;
}

function onIceCandidate(event){
    if(event.candidate){
        console.log("sending ice candidate");

        socket.emit("candidate", {
            type: "candidate",
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function setLocalAndOffer(sessionDescription){
    rtcPeerConnection.setLocalDescription(sessionDescription);

    socket.emit("offer", {
        type: "offer",
        sdp: sessionDescription,
        room: roomNumber
    })
}

function setLocalAndAnswer(sessionDescription){
    rtcPeerConnection.setLocalDescription(sessionDescription);

    socket.emit("answer", {
        type: "answer",
        sdp: sessionDescription,
        room: roomNumber
    });
}