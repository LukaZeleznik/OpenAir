const path = require('path');
const fetch = require("node-fetch");
const villageOwnTroopsModel = require('../models/villageOwnTroopsModel');
var tools = require('../tools/tools');
var config = require('../config.json');

exports.view = function (req, res) {
    villageOwnTroopsModel.findOne({idVillage: req.params.idVillage}, async function (err, villageOwnTroops) {
        if (err){
            res.status(400).send(err);
            return;
        }
        else{
            var idVillage = req.params.idVillage;
            var userTribe = await tools.getTribeFromIdVillage(idVillage);

            let barracksProductions = await(await(await tools.doApiRequest("barracksProductions/" + idVillage, "GET", "", false)).json()).data;
            let stableProductions = await(await(await tools.doApiRequest("stableProductions/" + idVillage, "GET", "", false)).json()).data;
            doProcessTroopProductions(barracksProductions, villageOwnTroops, 'barracksProductions');
            doProcessTroopProductions(stableProductions, villageOwnTroops, 'stableProductions');

            for(let troop of tools.troopInfoLookup[userTribe]){
                villageOwnTroops['troop' + troop['id']] = villageOwnTroops['troop' + troop['id']].toFixed(2);
            }

            villageOwnTroops.save(function (err) {
                if (err){
                    res.status(500).json(err);
                    return;
                }
                //Return floored values of troops
                for(let troop of tools.troopInfoLookup[userTribe]){
                    villageOwnTroops['troop' + troop['id']] = Math.floor(villageOwnTroops['troop' + troop['id']].toFixed(2));
                }
                res.json({
                    message: 'villageOwnTroops Info updated',
                    data: villageOwnTroops
                });
            });
        }
    });
};

// Handle create villageOwnTroops actions
exports.new = async function (req, res) {
    let userTribe = await tools.getTribeFromIdVillage(req.body.idVillage);

    var villageOwnTroops = new villageOwnTroopsModel();
    villageOwnTroops.idVillage = req.body.idVillage;
    villageOwnTroops.tribe = userTribe;
    for(let troop of tools.troopInfoLookup[userTribe]){
        villageOwnTroops['troop' + troop['id']] = req.body['troop' + troop['id']];
    }

    villageOwnTroops.save(function (err) {
        if (err){
            res.status(500).json(err);
            console.log(err);
            return;
        }
        else{
            res.json({
                message: 'villageOwnTroops success',
                data: villageOwnTroops
            });
        }
    });
};

exports.update = function (req, res) {
    villageOwnTroopsModel.findOne({idVillage: req.params.idVillage}, async function (err, villageOwnTroops) {
        if (err){
            res.status(500).json(err);
            console.log(err);
            return;
        }

        let userTribe = await tools.getTribeFromIdVillage(req.body.idVillage);
        villageOwnTroops.idVillage = req.body.idVillage;
        villageOwnTroops.tribe = userTribe;
        for(let troop of tools.troopInfoLookup[userTribe]){
            villageOwnTroops['troop' + troop['id']] = req.body['troop' + troop['id']];
        }

        villageOwnTroops.save(function (err) {
            if (err) {
                res.status(500).json({
                    message: err.toString(),
                    data: ""
                });
                return;
            }
            res.json({
                status: 'success',
                message: 'villageOwnTroops updated',
                data: villageOwnTroops
            });
        });
    });
};

exports.delete = function (req, res) {
    villageOwnTroopsModel.deleteOne({idVillage: req.params.idVillage}, function (err, villageOwnTroops) {
        if (err){
            res.status(500).json(err);
            console.log(err);
            return;
        }
        res.json({
            status: "success",
            message: 'villageOwnTroops deleted'
        });
    });
};

function doProcessTroopProductions(productions, villageOwnTroops, path){
    productions.forEach(async (production) => {
        const currentUnixTime = Math.round(new Date().getTime()/1000);
        const timeDiffFromStart = currentUnixTime - production.timeStarted;

        let timeDiff = (production.lastUpdate < production.timeStarted) ? timeDiffFromStart : currentUnixTime - production.lastUpdate; 
        if (timeDiff < 0) return;       

        let troopsProduced = timeDiff / production.troopProdTime;
        let troopsProducedAlready = timeDiffFromStart / production.troopProdTime;

        if(troopsProduced + production.troopsDoneAlready >= production.troopCount){

            villageOwnTroops["troop"+production.troopId] += production.troopCount - production.troopsDoneAlready;
            villageOwnTroops["troop"+production.troopId] = Number(villageOwnTroops["troop"+production.troopId].toFixed(0));
            await tools.doApiRequest(path + "/" + production._id, "DELETE", "", false);
        }
        else{
            villageOwnTroops["troop"+production.troopId] += troopsProduced;
            if(troopsProducedAlready < 0) troopsProducedAlready = 0;
            production.troopsDoneAlready = troopsProducedAlready;
            production.lastUpdate = currentUnixTime;

            await tools.doApiRequest(path + "/" + production._id, "PATCH", production, true);
        }
        villageOwnTroops["troop"+production.troopId] = villageOwnTroops["troop"+production.troopId].toFixed(2);
    });
}