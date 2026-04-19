import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const postSchema = new mongoose.Schema({
  user: { type: String, ref: "User", required: true },
  content: { type: String },
  image_urls: [{ type: String }],
  post_type: { type: String, required: true },
  reposts_count: [{ type: String, ref: "User" }],
  repost_of: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
}, { timestamps: true, minimize: false });

const Post = mongoose.model("Post", postSchema);

const cleanDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/postly`);
        console.log("Connected to DB...");
        
        const allPosts = await Post.find({});
        let fixedCount = 0;

        for (const post of allPosts) {
            if (post.reposts_count && post.reposts_count.length > 0) {
                console.log(`Checking post ${post._id} with reposts:`, post.reposts_count);
                let validRepostsCount = [];
                for (const userId of post.reposts_count) {
                    const exists = await Post.findOne({ user: userId, repost_of: post._id });
                    if (exists) {
                        validRepostsCount.push(userId);
                    } else {
                        console.log(`Found orphaned repost for user ${userId} on post ${post._id}`);
                    }
                }
                
                if (validRepostsCount.length !== post.reposts_count.length) {
                    post.reposts_count = validRepostsCount;
                    await post.save();
                    console.log(`Fixed reposts_count for post ${post._id}`);
                    fixedCount++;
                }
            }
        }
        console.log(`Cleanup complete! Fixed ${fixedCount} posts.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanDB();
