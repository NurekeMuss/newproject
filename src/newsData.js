import mongoose from 'mongoose';

const newsHistorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    publishedAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

const News = mongoose.model('NewsHistory', newsHistorySchema);

export default News;
