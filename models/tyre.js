const mongoose = require('mongoose');

const tyreSchema = new mongoose.Schema({
  tyreId: { type: Number, required: true, unique: true },
  tyreWidth: { type: String, required: true },
  profile: { type: String, required: false },
  rimSize: { type: String, required: true },  
  tube: { type: Boolean, required: true },
  tyreBrand: { type: String, required: true },
  vehicleCategory: { type: String, required: true },
  makes: { type: [String] },
  description: { type: String },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  images: [
    {
    data: Buffer,
    contentType: String,
    }
  ]
});

module.exports = mongoose.model('Tyre', tyreSchema);
