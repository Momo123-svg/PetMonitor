const socket = io();

let pc;
let room;

document.getElementById("join").onclick = async () => {

    document.getElementById("join").disabled = true;

    room = document.getElementById("room").value;

    pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            }
        ]
    });

    const localAudioStream =
        await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: false
        });

    localAudioStream.getTracks().forEach(track => {
        pc.addTrack(track, localAudioStream);
    });

    pc.ontrack = (event) => {

        const remoteVideo =
            document.getElementById("remoteVideo");

        remoteVideo.srcObject =
            event.streams[0];
    };

    pc.onicecandidate = (event) => {

        if (event.candidate) {

            socket.emit("ice-candidate", {
                room,
                candidate: event.candidate
            });
        }
    };

    socket.on("offer", async (offer) => {

        console.log("Offer received");

        try {

            await pc.setRemoteDescription(
                offer
            );

            const answer =
                await pc.createAnswer();

            await pc.setLocalDescription(
                answer
            );

            socket.emit("answer", {
                room,
                answer
            });

        }
        catch (err) {
            console.error(err);
        }
    });

    socket.on("ice-candidate",
        async (candidate) => {

            try {
                await pc.addIceCandidate(
                    candidate
                );
            }
            catch (err) {
                console.error(err);
            }
        });

    socket.emit("join-room", {
        room,
        role: "viewer"
    });
};