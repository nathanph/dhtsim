/**
 * Created by nate on 5/28/15.
 */

var KBucket = require('k-bucket');

/**
 * Client implementation.
 *
 * @namespace
 */
var Client = {
    // The session generated after connecting.
    session : null,

    // The size and number of Kademlia buckets.
    kSize: 4,

    // A SHA-1 hash representing the client in the network.
    hash: null,

    // The k-bucket to be used to hold peer information.
    kBucket : null,

    // The files this client is tracking.
    files : [],

    // Bins for building the radial graph.
    visBins : null
};
$( document ).ready(function() {
    // Initialize an array of files that you're tracking.
    var files = [
        {
            "name" : "File 1",
            "hash" : "b68d386047afd22136cb1e7b4d9a961c446f73f2",
            "trackers" : [
                {
                    "hash" : "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
                    "sessionID" : "1"
                },
                {
                    "hash": "c3499c2729730a7f807efb8676a92dcb6f8a3f8f",
                    "sessionid" : "2"
                }
            ]
        },
        {
            "name" : "File 2",
            "hash" : "efa0f7ef05346073b4848f9836f623acc8594155",
            "trackers" : [
                {
                    "hash": "77de68daecd823babbb58edb1c8e14d7106e83bb",
                    "sessionid" : "3"
                },
                {
                    "hash": "1b6453892473a467d07372d45eb05abc2031647a",
                    "sessionid" : "4"
                }
            ]
        }
    ]

    /**
     * Initializes subscriptions to the topics relevant to this client session (announce, put, and lookup).
     */
    function initSubscriptions(session) {
        // Listen for announcements from clients (a new peer).
        session.subscribe('client/' + Client.hash + '/announce').on('update', function (data) {
            $('#announce').append('<br>' + data);
            addPeer(data);
        });

        // Listen for put requests (a peer wants you to track a file).
        session.subscribe('client/' + Client.hash + '/put').on('update', function (data) {
            $('#put').append('<br>' + data);
        });

        // Listen for lookup requests (a peer wants to know if you're tracking a file).
        session.subscribe('client/' + Client.hash + '/lookup').on('update', function (data) {
            $('#put').append('<br>' + data);
        });
    }

    /**
     * Determines if a peer should be added to the peer list and adds it if it should.
     *
     * @param peerHash
     */
    function addPeer(topic) {
        return true;
    }

//     function addPeer(peerHash) {
//         // TODO:: Add DHT bin logic.
//         var shouldAdd = true;
//         if(shouldAdd){
//             Client.peers.forEach( function(peer, index) {
//                 if(peer.hash !== peerHash) {
//                     Client.session.subscribe('client/' + peerHash);
//                     Client.peers.push({"hash" : peerHash});
//                     console.log("Added new peer: " + peerHash);
//                     // TODO:: Re-render here!
//                 }
//             });
//         } else {
//             Client.session.remove();
//         }
//     }

    /**
     * Removes a peer from the DHT data structure.
     *
     * @param peerHash
     */
    function removePeer(peerHash) {
        Client.peers.forEach( function(peer, index) {
            if (peer.hash === hash) {
                Client.peers.splice(index, 1);
            }
        });
    }

    /**
     * Initializes topics for the client session.
     */
    function initTopics(session) {
        // Add topics for this client.
        session.topics.add('client/' + Client.hash + '/id', session.sessionID);
        session.topics.add('client/' + Client.hash + '/announce');
        session.topics.add('client/' + Client.hash + '/peers');
        session.topics.add('client/' + Client.hash + '/files');
        session.topics.add('client/' + Client.hash + '/lookup');
        session.topics.add('client/' + Client.hash + '/put');

        // Remove all topics for client when session disconnects.
        session.topics.removeWithSession('client/' + Client.hash + '/');
    }

    /**
     * Use the server to bootstrap into the network. The server will provide a few active peers.
     */
    function bootstrap(session) {
        // session.topics.remove('?client//'); // Remove this later, it's just for cleaning up topics.

        var promise = new Promise(function(resolve, reject) {
            // Let's cheat for now and use a wildcard within the topic.
            var subscription = session.subscribe('?client/.*');
            var bootstrapPeers = [];

            // Add the client to our peer list.
            subscription.on('subscribe', function (data, topic) {
                hash = topic.substring(7);

                if(hash !== Client.hash) {
                    bootstrapPeers.push(hash);
                }

                if (bootstrapPeers.length == 3) {
                    session.unsubscribe('?client/.*');
                    resolve(bootstrapPeers);
                }
            });
        });

        promise.then(function(peers) {
            peers.forEach(function(peer) {
                Client.kBucket.add(peer);
                console.log("Added peer: " + peer);
                $('#bootstrap').append("<br>" + peer);
            });
            buildVisBins();
            console.log(Client.visBins);
            $('#bootstrap').append("<br><em>Bootstrap complete!</em>");
        });
    }

    /**
     * Initialize everything after we've connected to the Reappt server.
     */
    function connectionSuccess(session) {
        Client.session = session;
        Client.hash = Sha1.hash(session.sessionID);
        Client.kBucket = new KBucket({
            numberOfNodesPerKBucket : Client.kSize,
            localNodeId : Client.hash
        });

        $('#session-id').append(" " + session.sessionID);
        $('#client-hash').append(" " + Client.hash);

        // Init all the things.
        initVisBins();
        bootstrap(session);
        initSubscriptions(session);
        initTopics(session);
    }

    /**
     * Connect to the Reappt server.
     */
    diffusion.connect({
        host: 'disloyalAristotle.eu.reappt.io',
        principal: '',
        credentials: '',
        port: '443'
    }).then(connectionSuccess, function() {alert("Failed to connect.");});

    function initVisBins() {
        Client.visBins = [];
        while(Client.visBins.push([]) < 360);
    }

    function determineVisBin(hash) {
        hash = parseInt(hash, 64);
        console.log("atob hash: " + hash);
        var range = Math.pow(2,160)/360;
        for(i=0; i<360; i++) {
            if(hash>=range*i && hash<range*i+1) {
                return i;
            }
        }
    }

    function buildVisBins() {
        var peers = Client.kBucket.toArray();
        var clientBin = determineVisBin(Client.hash);
        console.log("Client hash: " + Client.hash);
        console.log("Client bin: " + clientBin);
        peers.forEach(function(hash, index) {
            var bin = determineVisBin(hash);
            Client.visBins[clientBin].push(bin);
        });
    }

    function buildJSON() {

    }

});
