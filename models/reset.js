/**
 * Created by william on 28.06.15.
 */
var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var resetSchema = new Schema({
    email       	    : { type: String, required: true },
    created             : { type: Date, required: true, expires: "7d" },
    hashCode            : { type: String, required: true }
}, { collection: "reset" });

exports.getResetModel = function(){
    return mongoose.model("Reset", resetSchema);
};