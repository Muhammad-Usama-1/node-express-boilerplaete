const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour)
//       return next(
//         new AppEror(`No tour found with this id ${req.params.id}`, 404)
//       );
//     res.status(204).json({
//       status: 'Success',
//       data: null,
//     });
//   });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc)
      return next(
        new AppError(`No document found with this id ${req.params.id}`, 404)
      );
    res.status(204).json({
      status: 'Success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc)
      return next(
        new AppError(`No document found with this id ${req.params.id}`, 404)
      );
    res.status(200).json({
      status: 'Success',
      data: {
        data: doc,
      },
    });
  });
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(200).json({
      status: 'Success',
      data: {
        data: doc,
      },
    });
  });
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc)
      return next(
        new AppError(`No document found with this id ${req.params.id}`, 404)
      );
    res.status(200).json({
      status: 'Success',
      data: {
        data: doc,
      },
    });
  });
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //   To allow for nesed GET reviews on tour collection
    let filter;
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .paginate()
      .limitFields();
    // const docs = await features.query.explain();
    const docs = await features.query;

    res.status(200).json({
      status: 'Success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });
