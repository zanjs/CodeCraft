/**
 * Created by william on 28.06.15.
 */
var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var pendingSchema = new Schema({
    email       	    : { type: String, required: true },
    password            : { type: String, required: true },
    username            : { type: String, required: true },
    created             : { type: Date, required: true, expires: "7d" },
    hashCode            : { type: String, required: true }
}, { collection: "pending" });

exports.getPendingModel = function(){
    return mongoose.model("Pending", pendingSchema);
};