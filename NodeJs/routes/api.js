const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const fetch = require("node-fetch");

const scheduleController = require('../controllers/scheduleController');
const villageResourcesController = require('../controllers/villageResourcesController');
const villageMaxResourcesController = require('../controllers/villageMaxResourcesController');
const villageResourceFieldsController = require('../controllers/villageResourceFieldsController');
const villageProductionsController = require('../controllers/villageProductionsController');
const villageResFieldUpgradesController = require('../controllers/villageResFieldUpgradesController');
const villageBuildingUpgradesController = require('../controllers/villageBuildingUpgradesController');
const villageOwnTroopsController = require('../controllers/villageOwnTroopsController');
const villageReinforcementsController = require('../controllers/villageReinforcementsController');
const sendTroopsController = require('../controllers/sendTroopsController');
const barracksProductionsController = require('../controllers/barracksProductionsController');
const stableProductionsController = require('../controllers/stableProductionsController');
const userController = require('../controllers/userController');
const villageController = require('../controllers/villageController');
const villageBuildingFieldsController = require('../controllers/villageBuildingFieldsController');
const auth = require('../auth/auth');

router.get('/', function (req, res) {
    res.json({
        status: 'API Its Working',
        message: 'Welcome to RESTHub crafted with love!',
    });
});
router.route('/register')
    .post(
        passport.authenticate('register', {
            session: false
        }),
        async (req, res, next) => {
            res.json({
                message: 'Registration successful',
                user: req.user
            });
        }
    );

router.route('/login')
    .post(
        async (req, res, next) => {
            passport.authenticate(
                'login',
                async (err, user, info) => {
                    try {
                        if (err || !user) {
                            const error = new Error('An error occurred.');

                            return next(error);
                        }

                        req.login(
                            user, {
                                session: false
                            },
                            async (error) => {
                                if (error) return next(error);

                                const body = {
                                    _id: user._id,
                                    email: user.email,
                                };
                                const token = jwt.sign({
                                    //expiresIn: 60,
                                    user: body
                                }, 'RgUkXp2s5v8y/B?E(H+MbPeShVmYq3t6w9z$C&F)J@NcRfUjWnZr4u7x!A%D*G-KaPdSgVkYp2s5v8y/B?E(H+MbQeThWmZq4t6w9z$C&F)J@NcRfUjXn2r5u8x!A%D*');
                                //res.cookie('capital',token,{maxAge:9000000,httpOnly:true});
                                //res.cookie('jwt',token,{maxAge:9000000,httpOnly:true});
                                return res.json({
                                    token: token,
                                    capital: user.capital,
                                    userId: user._id
                                });
                            }
                        );
                    } catch (error) {
                        return next(error);
                    }
                }
            )(req, res, next);
        }
    );

router.route('/profile')
    .get(passport.authenticate('jwt', {
            session: false
        }),
        (req, res, next) => {
            res.json({
                message: 'You made it to the secure route',
                user: req.user,
                token: req.query.secret_token
            })
        }
    );

router.route('/schedule')
    .post(scheduleController.new)
    .get(scheduleController.view);
/*
router.route('/schedule/:idTask')
    .get(scheduleController.view)
    .put(scheduleController.update)
    .patch(scheduleController.update)
    .delete(scheduleController.delete);
*/
/* Authenticated

router.route('/villageResources')
    .post(passport.authenticate('jwt', {session: false}), checkIdVillage, villageResourcesController.new);
router.route('/villageResources/:idVillage')
    .get(passport.authenticate('jwt', {session: false}), checkIdVillage, villageResourcesController.view)
    .put(passport.authenticate('jwt', {session: false}), checkIdVillage, villageResourcesController.update)
    .patch(passport.authenticate('jwt', {session: false}), checkIdVillage, villageResourcesController.update)
    .delete(passport.authenticate('jwt', {session: false}), checkIdVillage, villageResourcesController.delete);
*/

router.route('/villages')
    .post(villageController.new)
    .get(villageController.find);
router.route('/villages/:mapTileId')
    .get(villageController.view) //ugly but works - pls change
    .put(villageController.update)
    .patch(villageController.update)
    .delete(villageController.delete);
router.route('/generateMapVillages')
    .post(villageController.insertMany);
router.route('/villages/owner/:uid')
    .get(villageController.findByOwner);

router.route('/villageResources')
    .post( villageResourcesController.new);
router.route('/villageResources/:idVillage')
    .get(villageResourcesController.view)
    .put(villageResourcesController.update)
    .patch(villageResourcesController.update)
    .delete(villageResourcesController.delete);

router.route('/villageMaxResources')
    .post(villageMaxResourcesController.new);
router.route('/villageMaxResources/:idVillage')
    .get(villageMaxResourcesController.view)
    .put(villageMaxResourcesController.update)
    .patch(villageMaxResourcesController.update)
    .delete(villageMaxResourcesController.delete);

router.route('/villageResourceFields')
    .post(villageResourceFieldsController.new);
router.route('/villageResourceFields/:idVillage')
    .get(villageResourceFieldsController.view)
    .put(villageResourceFieldsController.update)
    .patch(villageResourceFieldsController.update)
    .delete(villageResourceFieldsController.delete);

router.route('/villageProductions')
    .post(villageProductionsController.new);
router.route('/villageProductions/:idVillage')
    .get(villageProductionsController.view)
    .put(villageProductionsController.update)
    .patch(villageProductionsController.update)
    .delete(villageProductionsController.delete);

router.route('/villageResFieldUpgrades')
    .post(villageResFieldUpgradesController.new);
router.route('/villageResFieldUpgrades/:idVillage')
    .get(villageResFieldUpgradesController.view);
router.route('/villageResFieldUpgrade/:upgradeId')
    .get(villageResFieldUpgradesController.find)
    .put(villageResFieldUpgradesController.update)
    .patch(villageResFieldUpgradesController.update);
router.route('/villageResFieldUpgrade/:upgradeId')
    .get(villageResFieldUpgradesController.find)
    .delete(villageResFieldUpgradesController.delete);
router.route('/cancelVillageResFieldUpgrade/:upgradeId')
    .delete(villageResFieldUpgradesController.cancel);

router.route('/villageOwnTroops')
    .post(villageOwnTroopsController.new);
router.route('/villageOwnTroops/:idVillage')
    .get(villageOwnTroopsController.view)
    .put(villageOwnTroopsController.update)
    .patch(villageOwnTroopsController.update)
    .delete(villageOwnTroopsController.delete);

router.route('/villageReinforcements')
    .post(villageReinforcementsController.new);
router.route('/villageReinforcements/:idVillage')
    .get(villageReinforcementsController.view);
router.route('/villageReinforcements/:reinforcementId')
    .put(villageReinforcementsController.update)
    .patch(villageReinforcementsController.update)
    .delete(villageReinforcementsController.delete);

router.route('/sendTroops')
    .post(sendTroopsController.new);
router.route('/sendTroops/:idVillage')
    .get(sendTroopsController.view);
router.route('/sendTroops/:sendTroopsId')
    .put(sendTroopsController.update)
    .patch(sendTroopsController.update)
    .delete(sendTroopsController.delete);

router.route('/barracksProductions')
    .post(barracksProductionsController.new);
router.route('/barracksProductions/:idVillage')
    .get(barracksProductionsController.view);
router.route('/barracksProductions/:barrProdId')
    .put(barracksProductionsController.update)
    .patch(barracksProductionsController.update)
    .delete(barracksProductionsController.delete);

router.route('/stableProductions')
    .post(stableProductionsController.new);
router.route('/stableProductions/:idVillage')
    .get(stableProductionsController.view);
router.route('/stableProductions/:barrProdId')
    .put(stableProductionsController.update)
    .patch(stableProductionsController.update)
    .delete(stableProductionsController.delete);

router.route('/users')
    .post(userController.new)
    .get(userController.view);
router.route('/users/:uid')
    .get(userController.find);
/*
router.route('/user/:user')
    .get(userController.view)
    .put(userController.update)
    .patch(userController.update)
    .delete(userController.delete);
    */

router.route('/villageBuildingFields')
    .post(villageBuildingFieldsController.new);
router.route('/villageBuildingFields/:idVillage')
    .get(villageBuildingFieldsController.view)
    .put(villageBuildingFieldsController.update)
    .patch(villageBuildingFieldsController.update)
    .delete(villageBuildingFieldsController.delete);

router.route('/villageBuildingUpgrades')
    .post(villageBuildingUpgradesController.new);
router.route('/villageBuildingUpgrades/:idVillage')
    .get(villageBuildingUpgradesController.view);
router.route('/villageBuildingUpgrades/:upgradeId')
    .put(villageBuildingUpgradesController.update)
    .patch(villageBuildingUpgradesController.update);
router.route('/villageBuildingUpgrade/:upgradeId')
    .get(villageBuildingUpgradesController.find)
    .delete(villageBuildingUpgradesController.delete);
router.route('/cancelVillageBuildingUpgrade/:upgradeId')
    .delete(villageBuildingUpgradesController.cancel);

module.exports = router;

async function checkIdVillage(req, res, next) {
    let villagesApiUrl = "http://localhost:8080/api/villages/" + req.params.idVillage;
    let village = await(await(await fetch(villagesApiUrl)).json()).data;
    console.log("villageOwner", village.owner);
    console.log("req.user._id", req.user._id);

    if(req.user._id == village.owner || req.user.email == "admin@openTravian.com"){
        return next();
    } else{
        res.json({
            message: 'Authentication failed',
            data: ""
        });
        return;
    }
}