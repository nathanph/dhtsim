/**
 * Created by nate on 6/1/15.
 */

var KBucket = require('k-bucket');

var kBucket = new KBucket({numberOfNodePerKBucket : 4});
console.log(kBucket.localNodeId);

