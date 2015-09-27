/**
 * Created by william on 20.08.15.
 */
var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var albumSchema = new Schema({
    name           		: { type: String, required: true },
    introduction        : { type: String },
    tags                : [],
    articles            : [],
    author              : { type: Schema.Types.Mixed, required: true },
    cover               : { type: String },
    comments            : [],
    contributors        : [],
    bookmarkedBy        : [],
    likedBy             : [],
    sharedBy            : [],
    createdAt           : { type: Date },
    updatedAt           : { type: Date },
    createdBy           : { type: Schema.Types.Mixed },
    updatedBy           : { type: Schema.Types.Mixed },
    isPublic            : { type: Boolean, default: true }
}, { collection: "albums" });

exports.getAlbumModel = function() {
    return mongoose.model("Album", albumSchema);
};
