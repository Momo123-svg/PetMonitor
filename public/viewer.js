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

    pc.ontrack = (event) => {
        document.getElementById("remoteVideo").srcObject =
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

        await pc.setRemoteDescription(offer);

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        socket.emit("answer", {
            room,
            answer
        });
    });

    socket.on("ice-candidate", async (candidate) => {

        try {
            await pc.addIceCandidate(candidate);
        } catch (err) {
            console.error(err);
        }
    });

    socket.emit("join-room", {
        room,
        role: "viewer"
    });
};