'use strict';
/*
 * GET home page.
 */

exports.index = function (req, res) {
  if (req.user) {
    doWaad(res, req.user);
  } else {
    res.sendfile('/app/Index.html', {'root': '../'});
  }
};

exports.libs = function (req, res) {
  if (req.params['0']) {
    res.sendfile('/bower_components/' + req.params[0], {'root': '../'});
  }
}