/**
 * Created by william on 27.06.15.
 */
module.exports = function(app, security) {
    require('./user')(app, security);
    require('./tutorial')(app, security);
};
