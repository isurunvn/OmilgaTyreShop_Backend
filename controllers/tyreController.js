const fs = require('fs');
const path = require('path');
const Tyre = require('../models/tyre');
const Counter = require('../models/counter');
const multer = require('multer');

exports.addTyre = async (req, res) => {
  try {
    let { tyreWidth, profile, rimSize, tube, tyreBrand, vehicleCategory, price, oldPrice } = req.body;

    // Check if image file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Convert tyreBrand and vehicleCategory to lowercase and remove spaces
    tyreBrand = tyreBrand.toUpperCase().replace(/\s+/g, '');
    vehicleCategory = vehicleCategory.toLowerCase().replace(/\s+/g, '');

    // Read image file from filesystem
    const image = fs.readFileSync(req.file.path);

    // Get the next sequence value for tyreId
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'tyreId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const tyreId = counter.seq;

    // Create tyre object with image data
    const newTyre = new Tyre({
      tyreId,
      tyreWidth,
      profile,
      rimSize,
      tube: tube === 'true',
      tyreBrand,
      vehicleCategory,
      price,
      oldPrice,
      image: {
        data: image,
        contentType: req.file.mimetype
      }
    });

    console.log(newTyre);

    // Save the tyre to the database
    await newTyre.save();

    // Delete temporary image file after saving to database
    // fs.unlinkSync(req.file.path);

    res.status(201).json({ message: 'Tyre added successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllTyres = async (req, res) => {
  try {
    const tyres = await Tyre.find();

    res.status(200).json({ tyres });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tyre details' });
  }
};

exports.getFilteredTyres = async (req, res) => {
try {
  // Extract search criteria from request query parameters
  const { tyreWidth, profile, rimSize, tube, tyreBrand, vehicleCategory } = req.query;

  // Construct the filter object based on provided search criteria
  const filter = {};
  if (tyreWidth) filter.tyreWidth = tyreWidth;
  if (profile) filter.profile = profile;
  if (rimSize) filter.rimSize = rimSize; 
  if (tube) filter.tube = tube; 
  if (tyreBrand) filter.tyreBrand = tyreBrand;
  if (vehicleCategory) filter.vehicleCategory = vehicleCategory;

  console.log('Constructed filter:', filter);

  const tyres = await Tyre.find(filter);

  res.status(200).json({ tyres });
} catch (err) {
  res.status(500).json({ message: 'Failed to fetch filtered tyres' });
}
};

exports.getBySize = async (req, res) => {
try {
  const { tyreWidth, profile, rimSize } = req.query;

  const filter = {};
  if (tyreWidth) filter.tyreWidth = tyreWidth;
  if (profile) filter.profile = profile;
  if (rimSize) filter.rimSize = rimSize;

  console.log('Constructed filter:', filter);

  const tyres = await Tyre.find(filter);

  res.status(200).json({ tyres });
} catch (err) {
  res.status(500).json({ message: 'Failed to fetch filtered tyres' });
}
};


exports.removeTyre = async (req, res) => {
  try {
    const { tyreBrand, vehicleCategory } = req.query;

    // Log received query parameters
    console.log('Received query parameters:', { tyreBrand, vehicleCategory });

    const filter = {};
    if (tyreBrand) filter.tyreBrand = tyreBrand.toUpperCase().replace(/\s+/g, ''); // Ensure consistency with stored data
    if (vehicleCategory) filter.vehicleCategory = vehicleCategory.toLowerCase().replace(/\s+/g, ''); // Ensure consistency with stored data

    // Log constructed filter
    console.log('Constructed filter:', filter);

    const removedTyre = await Tyre.deleteMany(filter);

    if (!removedTyre) {
      console.log('Tyre not found');
      return res.status(404).json({ message: 'Tyre not found' });
    }

    // Log success message
    console.log('Tyre removed successfully:', removedTyre);

    res.status(200).json({ message: 'Tyre removed successfully' });
  } catch (err) {
    // Log the error
    console.error('Error occurred while removing tyre:', err);
    res.status(500).json({ message: 'Failed to remove tyre' });
  }
};

exports.getTyreWidths = async (req, res) => {
  try {
    const tyreWidths = await Tyre.distinct('tyreWidth');
    res.status(200).json(tyreWidths);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tyre widths' });
  }
};

exports.getTyreProfiles = async (req, res) => {
  try {
    const tyreProfiles = await Tyre.distinct('profile');
    res.status(200).json(tyreProfiles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tyre profiles' });
  }
};

exports.getRimSizes = async (req, res) => {
  try {
    const rimSizes = await Tyre.distinct('rimSize');
    res.status(200).json(rimSizes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch rim sizes' });
  }
};