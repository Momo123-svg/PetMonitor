const socket = io();

let pc;
let stream;
let room;

document.getElementById("start").onclick = async () => {

    document.getElementById("start").disabled = true;

    room = document.getElementById("room").value;

    socket.emit("join-room", {
        room,
        role: "camera"
    });

    stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    document.getElementById("localVideo").srcObject = stream;

    console.log("Camera ready");
};

socket.on("viewer-joined", async () => {

    console.log("Viewer joined");

    pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            }
        ]
    });

    stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                room,
                candidate: event.candidate
            });
        }
    };

    socket.on("answer", async (answer) => {
        await pc.setRemoteDescription(answer);
    });

    const offer = await pc.createOffer();

    await pc.setLocalDescription(offer);

    socket.emit("offer", {
        room,
        offer
    });
});

socket.on("ice-candidate", async (candidate) => {

    if (!pc) return;

    try {
        await pc.addIceCandidate(candidate);
    } catch (err) {
        console.error(err);
    }
});