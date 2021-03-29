const mongoose = require('mongoose')
const Schema = mongoose.Schema

const secretCodeSchema = new Schema({
    email: { type: String, required: true, unique: true },
    code: {
        type: String,
        required: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now(),
        expires: 600,
    }
}, { timestamps: true })

module.exports = mongoose.model('Secretcode', secretCodeSchema)