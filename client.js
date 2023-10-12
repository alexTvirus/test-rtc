const nodeDataChannel = require('node-datachannel');
var net = require("net");
var WebSocket = require('rpc-websockets').Client


//worker(6)
//worker(12)

function worker(socket) {
    //console.log("id")
    var ws = new WebSocket('ws://treasure-woozy-court.glitch.me/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        }
    })
    ws.on('open', function() {
        // pussher

        var id, room, caller;

        id = randomId(6);
        ws.notify('client-add-prepare-client', {
                "id": id
            })
            //console.log(id)
        ws.subscribe('client-add-new-server')
        ws.subscribe('client-add-complete-server')

        ws.on('client-add-new-server', function(answer) {
            ////console.log(answer.client_id)
            if (answer.client_id == id) {
                makeConnection(answer.server_id)
            }
        })

        ws.on('client-add-complete-server', function(answer) {
            ////console.log(answer.client_id)
            if (answer.client_id == id) {
                ws.notify('client-add-new-client', {
                    "id": id
                })
            }
        })


        var gdc;
        var peerId;

        function makeConnection(peerId) {

            caller = createPeerConnection(peerId);

            gdc = caller.createDataChannel(peerId);

            room = peerId

            gdc.onMessage((msg) => {
                // nhận dữ liệu từ server udp , rồi trả về cho socket
                ////console.log("onMessage 1");
                socket.write(msg);
            });

        }


        function endCall() {
            room = undefined;
            try {
                socket.close();
                caller.close();
            } catch (err) {

            }
        }

        function endCurrentCall() {
            // ws.notify('client-endcall', {
            //     "room": room
            // })
            endCall();
        }

        ws.subscribe('client-candidate')
        ws.on('client-candidate', function(msg) {
            if (msg.is_server && msg.room == room) {
                // add addRemoteCandidate

                caller.addRemoteCandidate(msg.candidate, msg.mid);
            }
        })

        ws.subscribe('client-answer')
        ws.on('client-answer', function(answer) {
            if (answer.is_server && answer.room == room) {
                // add addRemoteCandidate
                ////console.log("candidate received");
                caller.setRemoteDescription(answer.description, answer.type);
            }
        })

        ws.subscribe('client-endcall')
        ws.on('client-endcall', function(answer) {
            if (answer.is_server){
                console.log("endcall")
                endCall();
            }

        })

        //

        function createPeerConnection(peerId) {

            // Create PeerConnection
            ////console.log(' createPeerConnection  ', peerId);
            let peerConnection = new nodeDataChannel.PeerConnection('pc', {
                iceServers: ['stun:stun.l.google.com:19302']
            });
            peerConnection.onStateChange((state) => {
                if (state == 'connected') {
                    socket
                        .on("data", function(msg) {
                            ////console.log(msg)
                            var socks_version = msg[0];
                            if (socks_version === 4) {
                                var address = {
                                    port: msg.slice(2, 4).readUInt16BE(0),
                                    address: formatIPv4(msg.slice(4)),
                                };
                                // var user = greeting.slice(8, -1).toString();
                                net.connect(address.port, address.address, function() {
                                    // the socks response must be made after the remote connection has been
                                    // established
                                    socket.pipe(this).pipe(socket);
                                    socket.write(Buffer.from([0, 0x5a, 0, 0, 0, 0, 0, 0]));
                                });
                            } else if (socks_version === 5 && (msg.length == 3 || msg.length == 4)) {
                                try {
                                    socket.write(Buffer.from([5, 0]));
                                } catch (e) {}
                            } else {
                                if (!socket.address5) {
                                    // gdc.onMessage((msg) => {
                                    //  //console.log("onMessage 2");
                                    // });
                                    // lấy ip/port từ message socket
                                    var address_type = msg[3];
                                    var address5 = readAddress(address_type, msg.slice(4));
                                    var response = Buffer.from(msg);
                                    response[1] = 0;
                                    try {
                                        socket.write(response);
                                    } catch (e) {}

                                    socket.address5 = address5;
                                    // gửi address / port sang server , thông qua udp

                                    try {
                                        gdc.sendMessageBinary(Buffer.from(socket.address5.address + ":" + socket.address5.port));
                                    } catch (e) {}
                                } else {
                                    // gửi data sang server thông qua udp
                                    try {
                                        gdc.sendMessageBinary(msg);
                                    } catch (e) {}


                                }
                            }
                        })
                        .on("error", function(err) {
                            console.error("socket error: %s", err.message);
                        })
                        .on("end", function() {
                            socket.end(); // is this unnecessary?
                        });
                }
                ////console.log('State: ', state);
            });
            peerConnection.onGatheringStateChange((state) => {
                ////console.log('GatheringState: ', state);
            });
            peerConnection.onLocalDescription((description, type) => {
                // send des len pusher
                //console.log(`clon client-sdp : ` + description);
                ws.notify("client-sdp", {
                    "description": description,
                    "room": peerId,
                    "is_client": true,
                    "from": id,
                    type
                })

                room = peerId;
            });
            peerConnection.onLocalCandidate((candidate, mid) => {
                //console.log(`clon client-candidate : ` + candidate);
                ws.notify("client-candidate", {
                    "candidate": candidate,
                    "room": peerId,
                    "is_client": true,
                    "mid": mid,
                    "type": 'candidate'
                })
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

    })
}

//--------------------------------

function formatIPv4(buffer) {
    // buffer.length == 4
    return buffer[0] + "." + buffer[1] + "." + buffer[2] + "." + buffer[3];
}

function formatIPv6(buffer) {
    // buffer.length == 16
    var parts = [];
    for (var i = 0; i < 16; i += 2) {
        parts.push(buffer.readUInt16BE(i).toString(16));
    }
    return parts.join(":");
}

/**
 Returns an object with three properties designed to look like the address
 returned from socket.address(), e.g.:

 { family: 'IPv4', address: '127.0.0.1', port: 12346 }
 { family: 'IPv6', address: '1404:abf0:c984:ed7d:110e:ea59:69b6:4490', port: 8090 }
 { family: 'domain', address: '1404:abf0:c984:ed7d:110e:ea59:69b6:4490', port: 8090 }

 The given `type` should be either 1, 3, or 4, and the `buffer` should be
 formatted according to the SOCKS5 specification.
 */
function readAddress(type, buffer) {
    if (type == 1) {
        // IPv4 address
        return {
            family: "IPv4",
            address: formatIPv4(buffer),
            port: buffer.readUInt16BE(4),
        };
    } else if (type == 3) {
        // Domain name
        var length = buffer[0];
        return {
            family: "domain",
            address: buffer.slice(1, length + 1).toString(),
            port: buffer.readUInt16BE(length + 1),
        };
    } else if (type == 4) {
        // IPv6 address
        return {
            family: "IPv6",
            address: formatIPv6(buffer),
            port: buffer.readUInt16BE(16),
        };
    }
}

var server = net
    .createServer(function(socket) {
        worker(socket)
    })
    .on("listening", function() {
        var address = this.address();
        console.log(
            "server listening on tcp://%s:%d",
            address.address,
            address.port
        );
    })
    .on("error", function(err) {
        console.error("server error: %j", err);
    });

var port = parseInt(1101, 10);
var host = process.env.HOST || "localhost";
server.listen(port, host);