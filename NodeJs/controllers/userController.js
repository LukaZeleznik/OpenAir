const path = require('path');
const userModel = require('../models/userModel');

exports.find = function (req, res) {
    userModel.findOne({_id: req.params.uid}, function (err, user) {
        if (err)
            res.send(err);
        res.json({
            message: 'Finding user..',
            data: user
        });
    });
};

exports.view = function (req, res) {
    userModel.find(function (err, users) {
        if (err)
            res.send(err);
        res.json({
            message: 'Finding users..',
            data: users
        });
    });
};

// Handle create user actions
exports.new = function (req, res) {
    var user = new userModel();
    user.email = req.body.email;
    user.password = req.body.password;
    user.nickname = req.body.nickname;
    user.tribe = req.body.tribe;
    user.population = req.body.population;
    user.capital = req.body.capital;
    user.group = req.body.group ? req.body.group : 1;
    user.clan = req.body.clan ? req.body.clan : "";

    user.save(function (err) {
        if (err){
            res.json(err);
        }
        else{
            res.json({
                message: 'User created',
                data: user
            });
        }
    });
};

exports.update = function (req, res) {
    userModel.findById(req.params.uid, function (err, user) {
        if (err)
            res.send(err);
        
        user.email = req.body.email;
        user.password = req.body.password;
        user.nickname = req.body.nickname;
        user.tribe = req.body.tribe;
        user.population = req.body.population;
        user.capital = req.body.capital;
        user.group = req.body.group ? req.body.group : user.group;
        user.clan = req.body.clan ? req.body.clan : user.clan;

        user.save(function (err) {
            if (err)
                res.json(err);
            res.json({
                message: 'User info updated',
                data: user
            });
        });
    });
};

exports.delete = function (req, res) {
    userModel.findById(req.params.id, function (err, user) {
        if (err)
            res.send(err);
        res.json({
            message: 'User deleted',
            data: user,
        });
    });
};
