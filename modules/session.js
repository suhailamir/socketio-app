module.exports = function(server){
    var exports = {};
    // middleware function to check for logged-in users
    exports.sessionControl = function(req, res, next) {
        if (req.session.user && req.cookies.user_sid) {
            res.redirect('/dashboard');
        } else {
            next();
        }    
    }
}