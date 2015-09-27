/**
 * Created by william on 20.08.15.
 */
module.exports = function(app, security) {
    require('./routes')(app, security);
};