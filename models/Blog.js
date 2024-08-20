const mongoose = require('mongoose');
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: String,
  tags: [String],
  likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  comments: [
    {
      text: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      replies: [
        {
          text: String,
          author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
