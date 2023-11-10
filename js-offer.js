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



function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

var count = 1019
peerConnection.onStateChange((state) => {
    console.log('State: ', state);
    if(state == "connected"){

        // setInterval(()=>{
        //     count++
        //     let gdc2 = peerConnection.createDataChannel("peerIdx"+count,{
        //             negotiated:true,
        //             id: count}
        //             );

        //         gdc2.onOpen((event)=>{
                
        //         try{
        //             console.log(`data channel onopen: ${gdc2.getId()} ${gdc2.getLabel()}`)
        //             if(gdc2.readyState  == "open")
        //                 gdc2.sendMessage(" test " + count)    
        //         }catch(err){
        //           console.log(err)
        //         }
                
        //         })

        //         gdc2.onMessage((msg)=>{
        //             console.log(`data channel msg: ${msg}`)
                    
        //         })

        // },5000)
      
    }

});
peerConnection.onGatheringStateChange((state) => {
    // console.log('GatheringState: ', state);

    if (state == 'complete') {
        let desc = peerConnection.localDescription();
        console.log('');
        console.log('## Please copy the offer below to the web page:');
        console.log(JSON.stringify(desc));
        console.log('\n\n');
        console.log('## Expect RTP video traffic on localhost:5000');
        rl.question('## Please copy/paste the answer provided by the browser: \n', (sdp) => {
            let sdpObj = JSON.parse(sdp);
            peerConnection.setRemoteDescription(sdpObj.sdp, sdpObj.type);

            

            // console.log(track.isOpen());
            // rl.close();
        });
    }
});









let gdc = peerConnection.createDataChannel("peerId1");
let gdc1 = peerConnection.createDataChannel("peerId2");

gdc.onOpen((event)=>{
    console.log(`data channel onopen: id=${gdc.id}, label ${gdc.label}.`)
})

gdc1.onOpen((event)=>{
    console.log(`data channel onopen: id=${gdc1.id}, label ${gdc1.label}.`)
})

// track.setMediaHandler(session);
// track.onMessage((msg) => {
//     client.send(msg, 5000, '127.0.0.1', (err, n) => {
//         if (err) console.log(err, n);
//     });
// });

peerConnection.setLocalDescription();
