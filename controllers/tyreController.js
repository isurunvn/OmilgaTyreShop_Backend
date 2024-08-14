const fs = require('fs');
const path = require('path');
const Tyre = require('../models/tyre');
const Counter = require('../models/counter');
const mongoose = require('mongoose');

exports.addTyre = async (req, res) => {
  try {
    let { tyreWidth, profile, rimSize, tube, tyreBrand, vehicleCategory, makes, description, price, oldPrice } = req.body;

    console.log('Received query parameters:', { tyreWidth, profile, rimSize, tube, tyreBrand, vehicleCategory, makes, description, price, oldPrice });

    // Check if all image files were uploaded
    if (!req.files || !req.files.mainImage || !req.files.secondImage || !req.files.thirdImage) {
      return res.status(400).json({ message: 'All three image files are required' });
    }

    // Convert tyreBrand and vehicleCategory to uppercase and lowercase respectively, and remove spaces
    tyreBrand = tyreBrand.toUpperCase().replace(/\s+/g, '');
    vehicleCategory = vehicleCategory.toLowerCase().replace(/\s+/g, '');

    // Read image files from filesystem
    const mainImage = fs.readFileSync(req.files.mainImage[0].path);
    const secondImage = fs.readFileSync(req.files.secondImage[0].path);
    const thirdImage = fs.readFileSync(req.files.thirdImage[0].path);

    console.log("Start of binary image");
    console.log(mainImage);
    console.log("End of binary image");

    // Get the next sequence value for tyreId
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'tyreId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const tyreId = counter.seq;

    console.log(tyreBrand);

    // Create tyre object with image data
    const newTyre = new Tyre({
      tyreId,
      tyreWidth,
      profile,
      rimSize,
      tube: tube === 'true',
      tyreBrand,
      vehicleCategory,
      makes,
      description,
      price,
      oldPrice,
      images: [
        {
          data: mainImage,
          contentType: req.files.mainImage[0].mimetype
        },
        {
          data: secondImage,
          contentType: req.files.secondImage[0].mimetype
        },
        {
          data: thirdImage,
          contentType: req.files.thirdImage[0].mimetype
        }
      ]
    });

    console.log(newTyre);

    // Save the tyre to the database
    await newTyre.save();

    // Delete temporary image files after saving to database
    fs.unlinkSync(req.files.mainImage[0].path);
    fs.unlinkSync(req.files.secondImage[0].path);
    fs.unlinkSync(req.files.thirdImage[0].path);

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

// exports.getFilteredTyres = async (req, res) => {
// try {
//   // Extract search criteria from request query parameters
//   const { tyreWidth, profile, rimSize, tube, tyreBrand, vehicleCategory } = req.query;

//   // Construct the filter object based on provided search criteria
//   const filter = {};
//   if (tyreWidth) filter.tyreWidth = tyreWidth;
//   if (profile) filter.profile = profile;
//   if (rimSize) filter.rimSize = rimSize; 
//   if (tube) filter.tube = tube; 
//   if (tyreBrand) filter.tyreBrand = { $regex: `^${tyreBrand}`, $options: 'i' };
//   if (vehicleCategory) filter.vehicleCategory = { $regex: vehicleCategory, $options: 'i' };

//   console.log('Constructed filter:', filter);

//   const tyres = await Tyre.find(filter).select({
//     tyreWidth: 1,
//     profile: 1,
//     rimSize: 1,
//     tube: 1,
//     tyreBrand: 1,
//     vehicleCategory: 1,
//     oldPrice: 1,
//     price: 1,
//     images: { $arrayElemAt: ['$images', 0] } // Select the 0th index image
//   });

//   res.status(200).json({ tyres });
// } catch (err) {
//   res.status(500).json({ message: 'Failed to fetch filtered tyres' });
// }
// };




exports.getFilteredTyres = async (req, res) => {
  try {
    // Extract search criteria and pagination parameters from request query
    const { tyreWidth, profile, rimSize, tube, tyreBrand, vehicleCategory, limit, page, lastId } = req.query;
    const pageSize = parseInt(limit) || 2;
    const currentPage = parseInt(page) || 1;
    const lastObjectId = lastId ? new mongoose.Types.ObjectId(lastId) : null;

    // Construct the filter object based on provided search criteria
    const filter = {};
    if (tyreWidth) filter.tyreWidth = tyreWidth;
    if (profile) filter.profile = profile;
    if (rimSize) filter.rimSize = rimSize; 
    if (tube) filter.tube = tube; 
    if (tyreBrand) filter.tyreBrand = { $regex: `^${tyreBrand}`, $options: 'i' };
    if (vehicleCategory) filter.vehicleCategory = { $regex: vehicleCategory, $options: 'i' };

    if (lastObjectId) {
      filter._id = { $gt: lastObjectId }; // Cursor-based pagination
    }

    console.log('Constructed filter:', filter);

    // Find tyres with pagination and sorting
    const tyres = await Tyre.find(filter)
      .sort({ _id: 1 }) // Ensure consistent ordering for pagination
      .limit(pageSize)
      .select({
        tyreWidth: 1,
        profile: 1,
        rimSize: 1,
        tube: 1,
        tyreBrand: 1,
        vehicleCategory: 1,
        oldPrice: 1,
        price: 1,
        images: { $arrayElemAt: ['$images', 0] } // Select the first image
      });

    // Count how many tyres are in the returned array
    const tyreCount = tyres.length;

    // Get the total count of documents that match the filter
    const totalTyres = await Tyre.countDocuments(filter);

    // Calculate total pages based on the limit
    const totalPages = Math.ceil(totalTyres / pageSize);

    // Determine the last ID for the next pagination call
    const lastProductId = tyres.length > 0 ? tyres[tyres.length - 1]._id : null;

    // Return the tyres along with pagination information
    res.status(200).json({
      tyres,
      totalTyres,
      returnedTyreCount: tyreCount,
      totalPages,
      currentPage,
      pageSize,
      lastId: lastProductId
    });
  } catch (err) {
    console.error('Failed to fetch filtered tyres:', err);
    res.status(500).json({ message: 'Failed to fetch filtered tyres' });
  }
};






exports.getFilteredById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID (MongoDB ObjectId format)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    console.log('Recieved id:', id);

    const tyres = await Tyre.findById(id);

    res.status(200).json({ tyres });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch filtered tyres', error:err.message });
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
    let { tyreBrand, vehicleCategory } = req.body;

    // Log received query parameters
    console.log('Received query parameters:', { tyreBrand, vehicleCategory });

    // Ensure that tyreBrand and vehicleCategory are provided
    if (!tyreBrand || !vehicleCategory) {
      return res.status(400).json({ message: 'Missing tyreBrand or vehicleCategory' });
    }

    const filter = {};
    if (tyreBrand) filter.tyreBrand = tyreBrand.toUpperCase().replace(/\s+/g, ''); // Ensure consistency with stored data
    if (vehicleCategory) filter.vehicleCategory = vehicleCategory.toLowerCase().replace(/\s+/g, ''); // Ensure consistency with stored data

    // // Log constructed filter
    console.log('Constructed filter:', filter);

    const removedTyre = await Tyre.deleteMany(filter);

    if (!removedTyre) {
      console.log('Tyre not found');
      return res.status(404).json({ message: 'Tyre not found' });
    }

    // // Log success message
    // console.log('Tyre removed successfully:', removedTyre);

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


//for pagination purposes

//get total product count
// exports.getTyreCount = async (req, res) => {
//   try {
//     const count = await Tyre.countDocuments();
//     res.json({ count });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// //get products for a specific page with limit
// exports.getPageWithLimit = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 15;
//   const skip = (page - 1) * limit;

//   try {
//     const products = await Tyre.find().skip(skip).limit(limit);
//     res.json(products);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getPageAndLimit = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const lastId = req.query.lastId ? new mongoose.Types.ObjectId(req.query.lastId) : null; // Use the last _id for cursor-based pagination

  try {
    // Cursor-based pagination: Find documents greater than the lastId
    let query = {};
    if (lastId) {
      query = { _id: { $gt: lastId } };
    }

    // Retrieve only the necessary fields
    const products = await Tyre.find(query)
      .sort({ _id: 1 }) // Sort by _id to ensure consistent ordering
      .limit(limit)
      .select('tyreid tyrename image sizeinfo oldprice newprice'); // Select only necessary fields

      console.log('Fetched Products:', products);


    // Get the total count of documents (only once, not paginated)
    const totalProducts = await Tyre.countDocuments();

    // Calculate total pages (based on limit)
    const totalPages = Math.ceil(totalProducts / limit);

    // Return the products, along with pagination info
    res.json({
      products,
      totalProducts,
      totalPages,
      currentPage: req.query.page || 1,
      pageSize: limit,
      lastId: products.length > 0 ? products[products.length - 1]._id : null,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: error.message });
  }
};
