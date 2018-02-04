const Screen = require('../models/Screen');
const Project = require('../models/Project');

/**
 * GET /screen/:id/delete
 * Delete screen.
 */
exports.deleteScreen = (req, res, next) => {
  Screen.findOneAndRemove({ _id: req.params.id }, (err, removedScreen) => {
    if (err) return next(err);

    Project.findOneAndUpdate({ screens: removedScreen }, { $push: { screens: removedScreen._id } }, (err, updatedProject) => {
      if (err) return next(err);

      req.flash('success', { msg: 'Screen removed successfully' });
      res.redirect(`/project/${updatedProject._id}`);
    });
  });
};

/**
 * POST /screen
 * Create screen.
 */
exports.createScreen = (req, res, next) => {
  req.assert('url', 'URL cannot be blank').notEmpty();
  req.assert('url', 'URL must be in valid URL format (http:// or https://')
    .matches(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect(`/project/${req.body.projectId}`);
  }

  const screen = new Screen({
    url: req.body.url
  });

  screen.save((err, newScreen) => {
    if (err) return next(err);

    Project.findOneAndUpdate({ _id: req.body.projectId }, { $push: { screens: newScreen._id } }, (err, project) => {
      if (err) return next(err);

      res.redirect(`/project/${project._id}`);
    });
  });
};
