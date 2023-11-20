

 const CHAT_CHANNEL = "chat"


 function waitForAllICE(peerConnection) {
    return waitForEvent((fulfill) => {
		console.log("iceEvent1 ")
        peerConnection.onLocalCandidate = (iceEvent) => {
			console.log("iceEvent2 "+iceEvent)
            if (iceEvent.candidate === null) {
                fulfill()
            }
        }
    })
}

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


function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
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

 function waitForEvent(user_function, delay=15000) {
    return new Promise((fulfill, reject) => {
        user_function(fulfill)
        setTimeout(() => reject("Waited too long"), delay)
    })
}

 function addConnectionStateHandler(peerConnection) {
    peerConnection.onconnectionstatechange = function (event) {
        console.log("onconnectionstatechange ", event.type, " is ", peerConnection.connectionState)
    };

    peerConnection.onsignalingstatechange = function (event) {
        console.log("onsignalingstatechange ", peerConnection.signalingState)
    };
    peerConnection.onicecandidateerror = function (event) {
        console.log("onicecandidateerror", event)
    };
}

function guid(){
        let s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

function checkConnectChannel(datachannel1,id) {
    if (datachannel1.isConnect === false) {
        setTimeout(() => checkConnectChannel(datachannel1,id), 100); /* this checks the flag every 100 milliseconds*/
    } else {
        arrayDatas[id] = datachannel1
    }
}

module.exports = {
    addConnectionStateHandler,waitForEvent,waitForAllICE,
    randomId,getRandomInt,readAddress,guid,checkConnectChannel

}
