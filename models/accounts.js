const tablename = 'accounts';

/**
 * The account class
 */
var Accounts = function () {
};

/**
 * Get an accounts by its email
 */
Account.GetByEmail = function (cfg, e, cb) {
    cb = cb || function () {};
    dbcmd.cmd(cfg.pool, 'SELECT * FROM ' + cfg.db.db + '.' + tablename + ' WHERE email = ? LIMIT 1', [e], function (result) {
        cb(null, result.length > 0
            ? new Account(result[0])
            : null);
    }, function (err) {
        cb(err);
    });
};
