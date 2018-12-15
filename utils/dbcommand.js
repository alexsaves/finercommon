/**
 * Common place for DB commands
 * @type {exports}
 */
const mysql = require('mysql');

/**
 * Run a command against the pool.
 * @param pool {ConnectionPool} DB Connection Pool
 * @param dbcmd {String} SQL
 * @param args {Object} Arguments
 * @param callback {Function} The success callback
 */
function cmd(pool, dbcmd, args, callback, errorcallback) {
  callback = callback || function () { };
  errorcallback = errorcallback || function () { };

  if (typeof (args) == 'function') {
    errorcallback = callback;
    callback = args;
    args = [];
  }
  
  // Is this a pool or a connection?
  if (pool.getConnection) {
    // Start getting a connection
    pool.getConnection((err, connection) => {
      if (err || !connection) {
        errorcallback(err);
      } else {
        // Use the connection
        connection
          .query(dbcmd, args, (err, rows) => {
            // And done with the connection.
            connection.release();
            if (err) {
              errorcallback(err);
            } else {
              callback(rows || []);
            }
          });
      }
    });
  } else {
    pool
      .query(dbcmd, args, (err, rows) => {
        if (err) {
          errorcallback(err);
        } else {
          callback(rows || []);
        }
      });
  }
};

/**
 * Build an update statement
 * @param {*} obj
 * @param {*} table
 * @param {*} dbname
 */
function constructUpdate(obj, table, dbname, wherecol, whereval) {
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
  return { query: query, params: params };
};

// Tell the world
module.exports = {
  cmd, constructUpdate
};