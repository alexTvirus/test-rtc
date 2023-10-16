const nodeDataChannel = require('node-datachannel');
var net = require("net");
var WebSocket = require('rpc-websockets').Client
// instantiate Client and connect to an RPC server
var ws = new WebSocket('ws://treasure-woozy-court.glitch.me/', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    }
})

const { Worker } = require("worker_threads");

function createWorker(client_id) {
    let id = client_id
   const worker = new Worker("./worker1.js", {
      workerData: { id: id },
    });
}



const fs = require('fs');

var isFirst1 = true
ws.on('open', function() {
    console.log(" open1 ")
    if (isFirst1) {
        

        isFirst1 = false
        ws.subscribe('client-add-prepare-client')

        ws.on('client-add-prepare-client', function(answer) {
            console.log("client_id " + answer.id)
           
            createWorker(answer.id)
        })
    }

    function worker(client_id) {
        let isFirst = true
        var ws1 = new WebSocket('ws://treasure-woozy-court.glitch.me/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            }
        })
        ws1.on('open', function() {
            console.log(" open2 ")
            if (isFirst) {
                var client = null;
                isFirst = false

                function makeSocketConnection(ip, port) {
                    // tạo connection đến remote
                    client = new net.Socket();
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

                // pussher

                let id, room, caller;
                var isConnect = false;
                id = randomId(16);
                room = id;
                //console.log("id " + id)
                ws1.notify('client-add-complete-server', {
                    "id": id,
                    "client_id": client_id
                })

                ws1.subscribe('client-add-new-client')

                ws1.on('client-add-new-client', function(answer) {
                    if (answer.id == client_id) {
                        ws1.notify("client-add-new-server", {
                            "server_id": id,
                            "client_id": answer.id
                        });
                    }
                })


                let gdc;

                function endCall() {
                    room = undefined;
                    try {
                        caller.close();
                    } catch (err) {

                    }
                }

                function endCurrentCall() {
                    ws1.notify('client-endcall', {
                        "room": room,
                        "is_server": true
                    })
                    endCall();
                }

                ws1.subscribe('client-candidate')
                ws1.on('client-candidate', function(msg) {
                    //console.log(`ser client-candidate : ` + msg.candidate);
                    if (!isConnect && msg.is_client && msg.room == room) {
                        // add addRemoteCandidate
                        try {
                            caller.addRemoteCandidate(msg.candidate, msg.mid);
                        } catch (e) {}

                    }
                })

                ws1.subscribe('client-sdp')
                ws1.on('client-sdp', function(msg) {
                    //console.log("client-sdp  " + msg.is_client + " " + msg.room + " " + id);
                    if (!isConnect && msg.is_client && msg.room == id) {

                        //console.log("msg.room ",msg.room);
                        //console.log("room ",room);
                        room = msg.room;
                        caller = createPeerConnectionOffer(room);
                        caller.setRemoteDescription(msg.description, msg.type);
                    }
                })

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
                        // send des len pusher
                        //console.log(`clon client-sdp : ` + description);

                        // fs.appendFile('message.txt', `\r\n\r\n "description": ${description} "type": ${type} \r\n\r\n`, function(err) {
                        //     if (err) throw err;
                        // });
                        ws1.notify("server-answer", {
                            "description": description,
                            "room": peerId,
                            "from": id,
                            "is_server": true,
                            type
                        });


                        room = peerId;
                    });
                    peerConnection.onLocalCandidate((candidate, mid) => {
                        //console.log(`clon client-candidate : ` + candidate);

                        // fs.appendFile('message.txt', `\r\n\r\n "candidate": ${candidate} "mid": ${mid} \r\n\r\n`, function(err) {
                        //     if (err) throw err;
                        // });
                        ws1.notify("server-candidate", {
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
                                    } catch (e) {}
                                }
                                // ngươc lại ko phải là address thì truyền dữ liệu qua socket connect
                            });
                        }
                    });
                    return peerConnection;
                }

                function randomId(length) {
                    var result = '';
                    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    var charactersLength = characters.length;
                    for (var i = 0; i < length; i++) {
                        result += characters.charAt(Math.floor(Math.random() * charactersLength));
                    }
                    return result;
                }
            }
        })
    }
})