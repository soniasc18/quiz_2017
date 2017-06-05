var models = require("../models");
var Sequelize = require('sequelize');

var paginate = require('../helpers/paginate').paginate;

// Autoload el quiz asociado a :quizId
exports.load = function (req, res, next, quizId) {

    models.Quiz.findById(quizId)
    .then(function (quiz) {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('No existe ningún quiz con id=' + quizId);
        }
    })
    .catch(function (error) {
        next(error);
    });
};

// ARRAY






// GET /quizzes
exports.index = function (req, res, next) {

    var countOptions = {};

    // Busquedas:
    var search = req.query.search || '';
    if (search) {
        var search_like = "%" + search.replace(/ +/g,"%") + "%";

        countOptions.where = {question: { $like: search_like }};
    }

    models.Quiz.count(countOptions)
    .then(function (count) {

        // Paginacion:

        var items_per_page = 10;

        // La pagina a mostrar viene en la query
        var pageno = parseInt(req.query.pageno) || 1;

        // Crear un string con el HTML que pinta la botonera de paginacion.
        // Lo añado como una variable local de res para que lo pinte el layout de la aplicacion.
        res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

        var findOptions = countOptions;

        findOptions.offset = items_per_page * (pageno - 1);
        findOptions.limit = items_per_page;

        return models.Quiz.findAll(findOptions);
    })
    .then(function (quizzes) {
        res.render('quizzes/index.ejs', {
            quizzes: quizzes,
            search: search
        });
    })
    .catch(function (error) {
        next(error);
    });
};


// GET /quizzes/:quizId
exports.show = function (req, res, next) {

    res.render('quizzes/show', {quiz: req.quiz});
};


// GET /quizzes/new
exports.new = function (req, res, next) {

    var quiz = {question: "", answer: ""};

    res.render('quizzes/new', {quiz: quiz});
};


// POST /quizzes/create
exports.create = function (req, res, next) {

    var quiz = models.Quiz.build({
        question: req.body.question,
        answer: req.body.answer
    });

    // guarda en DB los campos pregunta y respuesta de quiz
    quiz.save({fields: ["question", "answer"]})
    .then(function (quiz) {
        req.flash('success', 'Quiz creado con éxito.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, function (error) {

        req.flash('error', 'Errores en el formulario:');
        for (var i in error.errors) {
            req.flash('error', error.errors[i].value);
        }

        res.render('quizzes/new', {quiz: quiz});
    })
    .catch(function (error) {
        req.flash('error', 'Error al crear un Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = function (req, res, next) {

    res.render('quizzes/edit', {quiz: req.quiz});
};


// PUT /quizzes/:quizId
exports.update = function (req, res, next) {

    req.quiz.question = req.body.question;
    req.quiz.answer = req.body.answer;

    req.quiz.save({fields: ["question", "answer"]})
    .then(function (quiz) {
        req.flash('success', 'Quiz editado con éxito.');
        res.redirect('/quizzes/' + req.quiz.id);
    })
    .catch(Sequelize.ValidationError, function (error) {

        req.flash('error', 'Errores en el formulario:');
        for (var i in error.errors) {
            req.flash('error', error.errors[i].value);
        }

        res.render('quizzes/edit', {quiz: req.quiz});
    })
    .catch(function (error) {
        req.flash('error', 'Error al editar el Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = function (req, res, next) {

    req.quiz.destroy()
    .then(function () {
        req.flash('success', 'Quiz borrado con éxito.');
        res.redirect('/quizzes');
    })
    .catch(function (error) {
        req.flash('error', 'Error al editar el Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = function (req, res, next) {

    var answer = req.query.answer || '';

    res.render('quizzes/play', {
        quiz: req.quiz,
        answer: answer
    });
};


// GET /quizzes/:quizId/check
exports.check = function (req, res, next) {

    var answer = req.query.answer || "";

    var result = answer.toLowerCase().trim() === req.quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz: req.quiz,
        result: result,
        answer: answer
    });
};



// GET /quizzes/randomplay
exports.random_play = function (req, res, next){

	//Si no existe el array de preguntas contestadas lo creo inicializado a -1
	if(!req.session.aciertos) 
		req.session.aciertos=0;
	if(!req.session.hechas)
		req.session.hechas=[-1];

	//Contamos las preguntas que NO estan hechas aun
	models.Quiz.count({where:{id:{$notIn:req.session.hechas}}})
		.then(function(c){ //c es un entero 
			//var a=Math.floor(Math.random()*c});
            var r=models.Quiz.findAll({ //r es un array con todas las preguntas NO hechas
			where:{id:{$notIn:req.session.hechas}}
		});
        return r;
		}).then(function(noHechas){ //noHechas es el array r que retornaba justo antes
			if(noHechas.length===0){
                req.session.aciertos=0;
                req.session.hechas=[-1];
				res.render('quizzes/random_nomore', {
				score:req.session.hechas.length-1
			});
			}else{
				var a=Math.floor(Math.random()*noHechas.length);
				var q=noHechas[a];
                req.session.hechas.push(q.id);
                //req.session.aciertos++;
				res.render('quizzes/random_play', {
				quiz:q,
                //score:req.session.aciertos;
				score:req.session.hechas.length-1
                });
            }
        }).catch(function(error) {
        req.flash('error', 'Error al cargar el Quiz: ' + error.message);
        next(error);
    });
};


//GET /quizzes/randomcheck/:quizId?answer=respuesta

//vamos a tener que recuperar lo introducido en el formulario
//	req.quiz.question = req.body.question;
//	req.quiz.answer = req.body.answer;
exports.random_check = function (req, res, next){

    //Si no existe el array de preguntas contestadas lo creo inicializado a -1
    if(!req.session.practica52) 
        req.session.practica52=0;
    if(!req.session.hechas)
        req.session.hechas=[-1];

    var answer = req.query.answer || "";

    var result = answer.toLowerCase().trim() === req.quiz.answer.toLowerCase().trim();

    res.render('quizzes/random_result', {
        quiz: req.quiz,
        result: result,
        answer: answer,
        score:req.session.hechas.length-1;
    });
}
};
