import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Post title is required"],
            trim: true,
            maxlength: [120, "Title cannot exceed 120 characters"],
        },
        content: {
            type: String,
            required: [true, "Post content is required"],
        },
        image: {
            type: String,
            default: null,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        // comments: [
        //     {
        //         user: {
        //             type: mongoose.Schema.Types.ObjectId,
        //             ref: "User",
        //         },
        //         text: {
        //             type: String,
        //             required: true,
        //         },
        //         createdAt: {
        //             type: Date,
        //             default: Date.now,
        //         },
        //     },
        // ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Post", postSchema);
