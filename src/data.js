import mongoose from 'mongoose';

const weatherSchema = new mongoose.Schema({
    city: String,
    temperature: Number,
    description: String,
    icon: String,
    imageURL: String,
    windSpeed: Number, // Add windSpeed field to the schema
    createdAt: { type: Date, default: Date.now }
});

const Weather = mongoose.model('Weather', weatherSchema);

export default Weather;
