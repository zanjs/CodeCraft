/**
 * Created by william on 30.08.15.
 */
var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var articleSchema = new Schema({
    title         		: { type: String, required: true },
    content             : { type: String },
    tags                : [],
    albumId             : { type: Schema.Types.ObjectId, required: true },
    author              : { type: Schema.Types.Mixed, required: true },
    hasVideo            : { type: Boolean, default: false },
    videoUrl            : { type: String },
    comments            : [],
    contributors        : [],
    likedBy             : [],
    sharedBy            : [],
    createdAt           : { type: Date },
    updatedAt           : { type: Date },
    createdBy           : { type: Schema.Types.Mixed },
    updatedBy           : { type: Schema.Types.Mixed }
}, { collection: "articles" });

exports.getArticleModel = function() {
    return mongoose.model("Article", articleSchema);
};