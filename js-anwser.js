const readline = require("readline");
const nodeDataChannel= require('node-datachannel');
const dgram =require('dgram');

var client = dgram.createSocket('udp4');

// Read Line Interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Init Logger
nodeDataChannel.initLogger('Debug');

let peerConnection = new nodeDataChannel.PeerConnection('pc', { iceServers: [] });

// let gdc = peerConnection.createDataChannel("peerId");

peerConnection.onStateChange((state) => {
    console.log('State: ', state);
if(state == "connected"){

    let gdc2 = peerConnection.createDataChannel("peerIdx1",{
            negotiated:true,
            id: 123,
            portRangeBegin: 6000,
            portRangeEnd: 9999,
        }
    );

    gdc2.onOpen((event)=>{

        try{
            // console.log(`data channel onopen: ${gdc2.readyState}`)
            console.log(`data channel onopen: ${gdc2.getId()} ${gdc2.getLabel()}`)
            // if(gdc2.readyState  == "open")
            //     gdc2.sendMessage(" test " + 123)
        }catch(err){
            console.log(err)
        }

    })

    gdc2.onMessage((msg)=>{
        console.log(`data channel msg: ${msg}`)

    })
    }

});
peerConnection.onGatheringStateChange((state) => {
    // console.log('GatheringState: ', state);

    if (state == 'complete') {
        // tao des để gửi cho bên kia
        let desc = peerConnection.localDescription();
        console.log('');
        console.log('## Please copy the offer below to the web page:');
        console.log(JSON.stringify(desc));
        console.log('\n\n');
        console.log('## Expect RTP video traffic on localhost:5000');

    }
});

// let video = new nodeDataChannel.Video('video', 'RecvOnly');
// video.addH264Codec(96);
// video.setBitrate(3000);

// let track = peerConnection.addTrack(video);
// let session = new nodeDataChannel.RtcpReceivingSession();




// track.setMediaHandler(session);
// track.onMessage((msg) => {
//     client.send(msg, 5000, '127.0.0.1', (err, n) => {
//         if (err) console.log(err, n);
//     });
// });

// peerConnection.setLocalDescription();
    
    // dán anwser vaof ddaay
        rl.question('## Please copy/paste the answer provided by the browser: \n', (sdp) => {
            let sdpObj = JSON.parse(sdp);
            peerConnection.setRemoteDescription(sdpObj.sdp, sdpObj.type);
            // console.log(track.isOpen());
            // rl.close();
        });