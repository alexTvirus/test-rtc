
var net = require("net");
const WebSocket = require('ws');
// instantiate Client and connect to an RPC server

const { workerData } = require("worker_threads");

var socket = workerData.socket


let isFirst = true
var ws1 = new WebSocket('ws://localhost:3000/', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    }
})

function randomId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


var id, room, caller;
var isConnect = false;
id = randomId(16);
room = id;
var client = null;
var gdc;

function publish(destination, content) {
    ws1.send(JSON.stringify({
        type: 'publish',
        destination: destination,
        content: content
    }));
}

function subscribe(destination) {
    ws1.send(JSON.stringify({
        type: 'subscribe',
        destination: destination
    }));
};

function endCall() {
    room = undefined;
    try {
        caller.close();
    } catch (err) {

    }
}

function endCurrentCall() {
    publish('client-endcall', {
        "room": room,
        "is_server": true
    })
    endCall();
}


ws1.on('open', function() {

    if (isFirst) {

        isFirst = false

        function makeSocketConnection(ip, port) {
            // tạo connection đến remote
            client = new net.Socket();
            console.log(" open2 ")
            client.setTimeout(15000);
            //console.log(ip,port)
            client.connect(port, ip, function() {
                //console.log("connect succed")
            });
            // nếu remote trả data về thì gửi mesage về cho client
            client.on("data", function(data) {
                try {
                    gdc.sendMessageBinary(data);
                } catch (e) {}
            });


            client.on('timeout', () => {
                try {
                    //console.log('socket timeout');
                    //gdc.sendMessageBinary(Buffer.from([-1]));
                    client.end();
                } catch (e) {
                    console.log(e)
                }
            });

            client.on("close", function() {
                try {
                    //console.log('socket timeout');
                    gdc.sendMessageBinary(Buffer.from([-1]));
                } catch (e) {
                    gdc.sendMessageBinary(Buffer.from([-1]));
                    console.log(e)
                }
            });

            client.on("end", function() {
                //console.log("end")
                //endCurrentCall();
            });

            client.on("error", function(err) {
                try {
                    //console.log("error")
                    //endCurrentCall();
                } catch (e) {}
            });

        }

        //console.log("id " + id)
        publish('client-add-complete-server', {
            "id": id,
            "client_id": client_id
        })

        subscribe('client-add-new-client')

        subscribe('client-candidate')

        subscribe('client-sdp')


        // ws1.subscribe('client-answer')
        // ws1.on('client-answer', function(answer) {
        //     console.log(`ser client-answer : ` + answer.description);
        //     console.log("answer.room ",answer.room);
        //     console.log("room ",room);
        //     if (answer.room == room) {
        //         // add addRemoteCandidate

        //         caller.setRemoteDescription(answer.description, answer.type);
        //     }
        // })


        // ws1.subscribe('client-endcall')
        // ws1.on('client-endcall', function(answer) {
        //     if(answer.is_client)
        //         endCall();
        // })

        function createPeerConnectionOffer(peerId) {
            let peerConnection = new nodeDataChannel.PeerConnection('pc', {
                iceServers: ['stun:stun.l.google.com:19302']
            });
            peerConnection.onStateChange((state) => {
                if (state == 'connected') {
                    isConnect = true;
                    try {
                        ws1.close();
                    } catch (e) {
                        console.log(e);
                    }
                }
                if (state == 'disconnected') {
                    gdc = null;
                }
                //console.log('State: ', state);
            });
            peerConnection.onGatheringStateChange((state) => {
                //console.log('GatheringState: ', state);
            });
            peerConnection.onLocalDescription((description, type) => {
                publish("server-answer", {
                    "description": description,
                    "room": peerId,
                    "from": id,
                    "is_server": true,
                    type
                });

                room = peerId;
            });
            peerConnection.onLocalCandidate((candidate, mid) => {
                publish("server-candidate", {
                    "candidate": candidate,
                    "room": peerId,
                    "is_server": true,
                    "mid": mid,
                    "type": 'candidate'
                });

            });
            peerConnection.onDataChannel((dc) => {
                if (!gdc) {
                    gdc = dc;
                    gdc.onMessage((msg) => {
                        if (msg.length == 1) {
                            try {
                                //console.log('end: ');
                                caller.close();
                            } catch (err) {
                                console.log(err)
                            }
                        }
                        // nhận data truyền từ client sang
                        // nếu msg là address thì tạo connected
                        if (!client) {
                            const myArray = msg.toString().split(":");
                            makeSocketConnection(myArray[0], myArray[1])
                        } else {
                            try {
                                client.write(msg);
                            } catch (e) {
                                console.log(err)
                            }
                        }
                        // ngươc lại ko phải là address thì truyền dữ liệu qua socket connect
                    });
                }
            });
            return peerConnection;
        }


    }
})

ws1.on('message', (responseData) => {
    var parsed = JSON.parse(responseData.data);


    if (parsed.match.includes("client-sdp")) {
        if (!isConnect && parsed.content.is_client && parsed.content.room == id) {

            //console.log("msg.room ",msg.room);
            //console.log("room ",room);
            room = parsed.content.room;
            caller = createPeerConnectionOffer(room);
            caller.setRemoteDescription(parsed.content.description, parsed.content.type);
        }


    }

    if (parsed.match.includes("client-candidate")) {

        if (!isConnect && parsed.content.is_client && parsed.content.room == room) {
            try {
                caller.addRemoteCandidate(parsed.content.candidate, parsed.content.mid);
            } catch (e) {}
        }
    }

    if (parsed.match.includes("client-add-new-client")) {
        if (parsed.content.id == client_id) {
            publish("client-add-new-server", {
                "server_id": id,
                "client_id": answer.id
            });
        }
    }

})