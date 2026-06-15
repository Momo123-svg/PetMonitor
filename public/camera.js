const socket = io();

let pc;
let stream;
let room;

const remoteAudio = document.createElement("audio");
remoteAudio.autoplay = true;
remoteAudio.controls = true;
document.body.appendChild(remoteAudio);

document.getElementById("start").onclick = async () => {

    document.getElementById("start").disabled = true;

    room = document.getElementById("room").value;

    socket.emit("join-room", {
        room,
        role: "camera"
    });

    stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }
    });

    document.getElementById("localVideo").srcObject = stream;

    console.log("Camera ready");
};

socket.on("viewer-joined", async () => {

    pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.relay.metered.ca:80"
            },
            {
                urls: "turn:global.relay.metered.ca:80",
                username: "14b4fa84570f8d23af9a4730",
                credential: "wWirEOQ7su3vcJ2p"
            },
            {
                urls: "turn:global.relay.metered.ca:80?transport=tcp",
                username: "14b4fa84570f8d23af9a4730",
                credential: "wWirEOQ7su3vcJ2p"
            },
            {
                urls: "turn:global.relay.metered.ca:443",
                username: "14b4fa84570f8d23af9a4730",
                credential: "wWirEOQ7su3vcJ2p"
            },
            {
                urls: "turns:global.relay.metered.ca:443?transport=tcp",
                username: "14b4fa84570f8d23af9a4730",
                credential: "wWirEOQ7su3vcJ2p"
            }
        ]
    });

    stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {

        console.log("Track received:", event.track.kind);

        if (event.track.kind === "audio") {

            remoteAudio.srcObject = event.streams[0];

            remoteAudio.play()
                .then(() => {
                    console.log("Audio playing");
                })
                .catch(err => {
                    console.error("Audio play failed", err);
                });
        }
    };

    pc.onicecandidate = (event) => {

        if (event.candidate) {

            socket.emit("ice-candidate", {
                room,
                candidate: event.candidate
            });
        }
    };

    socket.on("answer", async (answer) => {

        try {
            await pc.setRemoteDescription(answer);
        }
        catch (err) {
            console.error(err);
        }
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
    }
    catch (err) {
        console.error(err);
    }
});