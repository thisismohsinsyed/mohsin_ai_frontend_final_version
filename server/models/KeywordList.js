import mongoose from "mongoose";

const keywordSchema = new mongoose.Schema(
  {
    listName: {
      type: String,
      required: true,
      enum: ["human", "voicemail", "honeypot"], // restrict to these values
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const KeywordList = mongoose.model("KeywordList", keywordSchema);

export default KeywordList;
