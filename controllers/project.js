const Project = require('../models/Project');
const Screen = require('../models/Screen');
const User = require('../models/User');

/**
 * GET /projects
 * Projects page.
 */
exports.getProjects = (req, res, next) => {
  Project
    .find({ users: req.user._id })
    .exec((err, projects) => {
      if (err) return next(err);

      res.render('projects', {
        title: 'Projects',
        projects
      });
    });
};

/**
 * POST /projects
 * Create new project.
 */
exports.postProjects = (req, res, next) => {
  req.assert('name', 'Name cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/projects');
  }

  const project = new Project({
    name: req.body.name,
    description: req.body.description,
    users: [req.user._id]
  });

  project.save((err, newProject) => {
    if (err) return next(err);

    req.flash('success', { msg: 'Project created successfully.' });
    res.redirect(`/project/${newProject._id}`);
  });
};

/**
 * GET /project/:id
 * Single project page.
 */
exports.getProject = (req, res, next) => {
  Project.findOne({ _id: req.params.id })
    .populate('screens')
    .exec((err, project) => {
      if (err) return next(err);

      res.render('project', {
        title: project.name,
        project
      });
    });
};

/**
 * GET /project/:id/delete
 * Delete project.
 */
exports.deleteProject = (req, res, next) => {
  Project.findOneAndRemove({ _id: req.params.id }, (err, deletedProject) => {
    if (err) return next(err);

    req.flash('success', { msg: `Project "${deletedProject.name}" deleted successfully.` });
    res.redirect('/projects');
  });
};
