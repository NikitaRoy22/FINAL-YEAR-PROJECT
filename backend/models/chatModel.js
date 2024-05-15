const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  chatName: {
    type: String,
    required: true,
  },
  isGroupChat: {
    type: Boolean,
    required: true,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  publicKeys: {
    type: Map,
    of: String,
  },
  groupAdmins: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
