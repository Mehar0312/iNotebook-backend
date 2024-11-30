const mongoose = require('mongoose');
const mongoURI = "mongodb://localhost:27017";

const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoURI, {});
        console.log("connected to mongo successfully"); 
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

module.exports = connectToMongo;