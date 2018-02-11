const fs = require('mz/fs');
const compareImages = require('resemblejs/compareImages');
const rimraf = require('rimraf');
const path = require('path');
const puppeteer = require('puppeteer');
const Screen = require('../models/Screen');
const Project = require('../models/Project');
const Comparison = require('../models/Comparison');

async function getDiff(file1, file2, directory, type){

	const options = {
		output: {
			errorColor: {
				red: 255,
				green: 0,
				blue: 255
			},
			errorType: 'movement',
			transparency: 0.3,
			largeImageThreshold: 1200,
			useCrossOrigin: false,
			outputDiff: true
		},
		scaleToSameSize: true,
		ignore: ['nothing', 'less', 'antialiasing', 'colors', 'alpha'],
	};
// The parameters can be Node Buffers
// data is the same as usual with an additional getBuffer() function
	const data = await compareImages(
		await fs.readFile(file1),
		await fs.readFile(file2),
		options
	);

	await fs.writeFile(`${directory}/output-${type}.png`, data.getBuffer());
}

/**
 * GET /screen/:id
 * Show screen.
 */
exports.getScreen = (req, res, next) => {
	Screen.findOne({ _id: req.params.id }, (err, screen) => {
	  if (err) return next(err);

	  res.render('screen', {
	    title: `Screen: ${screen.url}`,
			screen
    })
  });
};

/**
 * GET /screen/:id/compare
 * Compare screens.
 */
exports.getCompare = (req, res, next) => {
	const compare = new Comparison();
	compare.save((err, newCompare) => {
		if (err) return next(err);

		Screen.findOne({ _id: req.params.id }, async (err, screen) => {
			if (err) return next(err);

			try {
				await fs.mkdir(`public/screens/${screen._id}/${newCompare._id}`);

				const browser = await puppeteer.launch();
				const page = await browser.newPage();
				await page.goto(screen.url, { waitUntil: 'networkidle0' });

				await page.setViewport({ width: 1980, height: 1050 });
				await page.screenshot({path: `public/screens/${screen._id}/${newCompare._id}/comparison-wide.png`, fullPage: true });
				await getDiff(
					`public/screens/${screen._id}/golden-wide.png`,
					`public/screens/${screen._id}/${newCompare._id}/comparison-wide.png`,
					`public/screens/${screen._id}/${newCompare._id}`,
					'wide'
				);

				await page.setViewport({ width: 1440, height: 900 });
				await page.screenshot({path: `public/screens/${screen._id}/${newCompare._id}/comparison-laptop.png`, fullPage: true });
				await getDiff(
					`public/screens/${screen._id}/golden-laptop.png`,
					`public/screens/${screen._id}/${newCompare._id}/comparison-laptop.png`,
					`public/screens/${screen._id}/${newCompare._id}`,
					'laptop'
				);

				await page.setViewport({ width: 768, height: 1024 });
				await page.screenshot({path: `public/screens/${screen._id}/${newCompare._id}/comparison-tablet.png`, fullPage: true });
				await getDiff(
					`public/screens/${screen._id}/golden-tablet.png`,
					`public/screens/${screen._id}/${newCompare._id}/comparison-tablet.png`,
					`public/screens/${screen._id}/${newCompare._id}`,
					'tablet'
				);

				await page.setViewport({ width: 360, height: 640 });
				await page.screenshot({path: `public/screens/${screen._id}/${newCompare._id}/comparison-mobile.png`, fullPage: true });
				await getDiff(
					`public/screens/${screen._id}/golden-mobile.png`,
					`public/screens/${screen._id}/${newCompare._id}/comparison-mobile.png`,
					`public/screens/${screen._id}/${newCompare._id}`,
					'mobile'
				);

				screen.comparisons = [...screen.comparisons, newCompare._id]
				screen.save((err) => {
					if (err) return next(err)
				});
			}
			catch(e) {
				return next(e);
			}

			req.flash('Screen comparison created successfully');
			res.redirect(`/screen/${screen._id}`)
		})
	});
};

/**
 * GET /screen/:id/delete
 * Delete screen.
 */
exports.postDeleteScreen = (req, res, next) => {
  Screen.findOneAndRemove({ _id: req.params.id }, (err, removedScreen) => {
    if (err) return next(err);

    Project.findOneAndUpdate({ screens: removedScreen }, { $push: { screens: removedScreen._id } }, async (err, updatedProject) => {
      if (err) return next(err);

      const directory = `public/screens/${removedScreen._id}`;

      try {
				await rimraf(directory, err => {if (err) return next(err)});
			} catch(e) {
      	return next(e);
			}

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

  screen.save(async (err, newScreen) => {
    if (err) return next(err);

		try {
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto(newScreen.url, { waitUntil: 'networkidle0' });
			await fs.mkdir(`public/screens/${newScreen._id}/`);

			await page.setViewport({ width: 1980, height: 1050 });
			await page.screenshot({path: `public/screens/${newScreen._id}/golden-wide.png`, fullPage: true });

			await page.setViewport({ width: 1440, height: 900 });
			await page.screenshot({path: `public/screens/${newScreen._id}/golden-laptop.png`, fullPage: true });

			await page.setViewport({ width: 768, height: 1024 });
			await page.screenshot({path: `public/screens/${newScreen._id}/golden-tablet.png`, fullPage: true });

			await page.setViewport({ width: 360, height: 640 });
			await page.screenshot({path: `public/screens/${newScreen._id}/golden-mobile.png`, fullPage: true });

			await browser.close();
		} catch(e) {
			return next(e);
		}

    Project.findOneAndUpdate({ _id: req.body.projectId }, { $push: { screens: newScreen._id } }, (err, project) => {
      if (err) return next(err);

      res.redirect(`/project/${project._id}`);
    });
  });
};
