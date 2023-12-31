const { Schema, model } = require('mongoose');
 
const topicSchema = new Schema({
    creator: { type: Schema.Types.ObjectId, ref: "User" },
    topicName: { type: String, maxlength: 30,required: [true, 'Topic name is required.']},
    content: { type: String, required: [true, 'Write your question.']},
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    photo: {type: String}
  },
  {
    timestamps: true
  });
 
module.exports = model('Topic', topicSchema);