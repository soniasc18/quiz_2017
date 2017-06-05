
var express = require('express');
var router = express.Router();

var quizController = require('../controllers/quiz_controller');
//var used = req.session...

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

// Pagina de creditos
router.get('/author', function(req, res, next) {
    res.render('author');
});

// Autoload de rutas que usen :quizId
router.param('quizId', quizController.load);


//Renderizo la pag de play
router.get('/quizzes/randomplay', quizController.random_play);
router.get('/quizzes/randomcheck/:quizId(\\d+)', quizController.random_check);
//ponemos o quitamos answer=respues?????


// Definición de rutas de /quizzes
router.get('/quizzes',                     quizController.index);
router.get('/quizzes/:quizId(\\d+)',       quizController.show);
router.get('/quizzes/new',                 quizController.new);
router.post('/quizzes',                    quizController.create);
router.get('/quizzes/:quizId(\\d+)/edit',  quizController.edit);
router.put('/quizzes/:quizId(\\d+)',       quizController.update);
router.delete('/quizzes/:quizId(\\d+)',    quizController.destroy);

router.get('/quizzes/:quizId(\\d+)/play',  quizController.play);
router.get('/quizzes/:quizId(\\d+)/check', quizController.check);

// Definición de rutas de sesion
//router.get('/session', sessionController.new);
//router.post('/session', sessionController.create);
//router.delete('/session', sessionController.destroy);


// Pagina de ayuda
router.get('/help', function(req, res, next) {
    res.render('help');
});

module.exports = router;
