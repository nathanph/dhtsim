/**
 * Created by nate on 5/28/15.
 */

/**
 * Client implementation.
 *
 * @namespace
 */
var Client = {
    session : null,
    sessionHash : null,
    peers : [],
    files : []
};

$( document ).ready(function() {

    // The session generated after connecting.

    // The session hash.

    // Initialize an array of peers in the network.
    var peers = [
        {
            "hash" : "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
            "sessionID" : "1"
        },
        {
            "hash": "c3499c2729730a7f807efb8676a92dcb6f8a3f8f",
            "sessionid" : "2"
        },
        {
            "hash": "77de68daecd823babbb58edb1c8e14d7106e83bb",
            "sessionid" : "3"
        },
        {
            "hash": "1b6453892473a467d07372d45eb05abc2031647a",
            "sessionid" : "4"
        }
    ];

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
        // Session hash.
        var sessionHash = Sha1.hash(session.sessionID);

        // Listen for announcements from clients (a new peer).
        session.subscribe('client/' + sessionHash + '/announce').on('update', function (data) {
            $('#announce').append('<br>' + data);
            addPeer(data);
        });

        // Listen for put requests (a peer wants you to track a file).
        session.subscribe('client/' + sessionHash + '/put').on('update', function (data) {
            $('#put').append('<br>' + data);
        });

        // Listen for lookup requests (a peer wants to know if you're tracking a file).
        session.subscribe('client/' + sessionHash + '/lookup').on('update', function (data) {
            $('#put').append('<br>' + data);
        });
    }

    /**
     * Determines if a peer should be added to the peer list and adds it if it should.
     *
     * @param peerHash
     */
    function addPeer(topic) {

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
        // TODO:: Bootstrap with server to discover peers.
        // Let's cheat for now and use a wildcard within the topic.
        // session.topics.remove('?client//'); // Remove this later, it's just for cleaning up topics.

        var subscription = session.subscribe('?client/.*');

        // Add the client to our peer list.
        subscription.on('subscribe', function(data, topic) {
            hash = topic.substring(7);
            addPeer(hash);
        });

        // Delete the client from the peer-list if it disconnects.
        subscription.on('unsubscribe', function(data, topic) {
            hash = topic.substring(7);
            Client.peers.forEach( function(peer, index) {
                if(peer.hash === hash) {
                    Client.peers.splice(index, 1);
                }
            });
            console.log(Client.peers);
            // TODO:: Re-render here!
        });
    }

    /**
     * Initialize everything after we've connected to the Reappt server.
     */
    function initConnection(session) {
        Client.session = session;
        Client.hash = Sha1.hash(session.sessionID);

        $('#session-id').append(" " + session.sessionID);
        $('#client-hash').append(" " + Client.hash);


        // Init all the things.
        initSubscriptions(session);
        initTopics(session);
        bootstrap(session);
    }

    diffusion.connect({
        host: 'disloyalAristotle.eu.reappt.io',
        principal: '',
        credentials: '',
        port: '443'
    }).then(initConnection, function() {alert("Failed to connect.");});
});

