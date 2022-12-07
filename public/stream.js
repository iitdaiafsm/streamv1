let socket = io();
var errorText = document.getElementById("error");
var video = document.getElementById("video");

let creator = false;

let userStream;
let rtcPeerConnection;

errorText.style.display = "none";
video.style.display = "block";

const urlString = window.location.href;
let paramString = urlString.split("?")[1];
let queryString = new URLSearchParams(paramString);
let cameraCount = 0;

var pair = queryString.entries().next();
console.log(pair.value[1]);

navigator.mediaDevices.enumerateDevices().then(function (devices) {
  for (let i = 0; i < devices.length; i++) {
    var device = devices[i];
    if (device.kind === "videoinput") {
      cameraCount++;
      console.log(device.deviceId);
    }
  }

  console.log(cameraCount);

  if (cameraCount == 0) {
    video.style.display = "none";
    errorText.style.display = "block";
    errorText.innerHTML = "Camera in not connected";
    socket.emit("no_camera", "");
  } else {
    getStarted();
  }
});

socket.on("no_camera", function (data) {
  video.style.display = "none";
  errorText.style.display = "block";
  errorText.innerHTML = "Camera in not connected";
});

let iceServer = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

function getStarted() {
  errorText.style.display = "none";
  video.style.display = "block";

  socket.emit("join", pair.value[1]);
}

socket.on("created", function () {
  creator = true;
  console.log("chat.js : created");
  navigator.mediaDevices
    .getUserMedia({
      audio: false,
      video: true,
    })
    .then(function (stream) {
      userStream = stream;
      video.srcObject = stream;
      video.onloadedmetadata = function (e) {
        video.play();
      };
    })
    .catch(function (err) {
      console.log(err);
      alert("Couldn't access user media");
    });
});
socket.on("joined", function () {
  creator = false;
  console.log("chat.js : joined");
  socket.emit("ready", pair.value[1]);
});

socket.on("ready", function () {
  console.log("chat.js : ready");
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServer);
    rtcPeerConnection.onicecandidate = onIceCandidateFun;
    rtcPeerConnection.ontrack = onTrackFun;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.createOffer(
      function (offer) {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, pair.value[1]);
      },
      function (error) {
        console.log(error);
      }
    );
  }
});
socket.on("offer", function (offer) {
  console.log("chat.js : offer");
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServer);
    rtcPeerConnection.onicecandidate = onIceCandidateFun;
    rtcPeerConnection.ontrack = onTrackFun;
    //   rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection.addTransceiver("video", { direction: "recvonly" });
    rtcPeerConnection.createAnswer(
      function (answer) {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, pair.value[1]);
      },
      function (error) {
        console.log(error);
      }
    );
  }
});
socket.on("answer", function (answer) {
  console.log("chat.js : answer");
  rtcPeerConnection.setRemoteDescription(answer);
});
socket.on("candidate", function (candidate) {
  console.log("chat.js : candidate");
  var iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
});

function onIceCandidateFun(event) {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, pair.value[1]);
  }
}

function onTrackFun(event) {
  video.srcObject = event.streams[0];
  video.onloadedmetadata = function (e) {
    video.play();
  };
}
