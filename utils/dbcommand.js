/**
 * Common place for DB commands
 * @type {exports}
 */
var mysql = require('mysql');

/**
 * Run a command against the pool.
 * @param pool {ConnectionPool} DB Connection Pool
 * @param dbcmd {String} SQL
 * @param args {Object} Arguments
 * @param callback {Function} The success callback
 */
var cmd = function (pool, dbcmd, args, callback, errorcallback) {
  if (!pool || !pool.getConnection) {
    throw new Error("Missing connection pool in DB CMD.");
  }
  if (typeof(args) == 'function') {
    errorcallback = callback;
    callback = args;
    args = [];
  }

  if (!callback || typeof(callback) != 'function') {
    throw new Error("Missing callback!");
  }

  // Mark the moment
  var startTime = new Date(),
    dbLongTimer = setTimeout(function () {
      console.log("Taking a long time to get a DB connection @" + (new Date()).toString() + ".", dbcmd);
    }, 5000);

  // Start getting a connection
  pool.getConnection(function (err, connection) {
    clearTimeout(dbLongTimer);
    var gotConnectionTime = new Date(),
      connectionAcquisitionTime = gotConnectionTime - startTime;
    if (err) {
      console.log(new Date(), connectionAcquisitionTime, "DB DCMD ERROR GETTING CONNECTION ON ", cmd, err);
      if (errorcallback) {
        errorcallback(err);
        return;
      } else {
        throw err;
      }
    }

    // Is it taking a while to get a connection?
    if (connectionAcquisitionTime > 500) {
      console.log("LONG CONNECTION ACQUISITION TIME: ", connectionAcquisitionTime);
    }

    dbLongTimer = setTimeout(function () {
      console.log("Taking a long time to perform a DB query @" + (new Date()).toString() + ".", dbcmd);
    }, 5000);

    // Use the connection
    try {
      connection
        .query(dbcmd, args, function (err, rows) {
          var didQueryTime = new Date(),
            queryTime = didQueryTime - gotConnectionTime;
          clearTimeout(dbLongTimer);
          // And done with the connection.
          connection.release();

          if (queryTime > 500) {
            console.log("LONG QUERY TIME: @" + (new Date()).toString(), queryTime);
          }

          if (err) {
            console.log(new Date(), connectionAcquisitionTime, "DB DCMD ERROR ON QUERY @" + (new Date()).toString(), cmd, err);
            if (errorcallback) {
              errorcallback(err);
              return;
            } else {
              throw err;
            }
          }

          // Fire the callback then
          if (callback) {
            callback(rows || []);
          }
        });
    } catch (e) {
      console.log("ERROR WITH SQL", dbcmd, args);
      throw e;
    }
  });
};

/**
 * Build an update statement
 * @param {*} obj
 * @param {*} table
 * @param {*} dbname
 */
var constructUpdate = function (obj, table, dbname, wherecol, whereval) {
  var query = "UPDATE " + dbname + "." + table + " SET ";
  var keys = Object.keys(obj);
  var params = [];
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] == wherecol) {
      keys.splice(i--, 1);
    }
  }
  for (var i = 0; i < keys.length; i++) {
    if (i > 0) {
      query += ", ";
    }
    query += keys[i] + " = ?";
    params.push(obj[keys[i]]);
  }
  query += " WHERE " + wherecol + " = ?";
  params.push(whereval);
  return {query: query, params: params};
};

// Tell the world
module.exports = {
  cmd: cmd,
  constructUpdate: constructUpdate
};