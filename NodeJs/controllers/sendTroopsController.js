const path = require('path');
const fetch = require('node-fetch');
const sendTroopsModel = require('../models/sendTroopsModel');
const troopInfoLookup = require('../infoTables/troopInfoLookup');
var tools = require('../tools/tools');
var config = require('../config.json');

exports.view = function (req, res) {
    sendTroopsModel.find({$or: [{idVillageFrom: req.params.idVillage}, {idVillageTo: req.params.idVillage}] }, function (err, sendTroops) {
        if (err)
            res.send(err);
        res.json({
            message: 'Loading sendTroops..',
            data: sendTroops
        });
    });
};

exports.new = async function (req, res) {
    var userTribe = await tools.getTribeFromIdVillage(req.body.idVillageFrom);
    var taskType = req.body.sendType;
    if (!checkValidIdVillageTo(req.body.idVillageFrom,req.body.idVillageTo,res)) return;
    if (!checkSentAmount(req,res)) return;

    (async () => {
        if (!await updateVillageOwnTroops(req.body.idVillageFrom,req,res)) return;
        switch (taskType) {
            case 'full':
            case 'raid':
            case 'reinf':
            case 'return':
            default: 
                doSendTroops(req,res); 
                break;
        }
    })();
};

exports.update = function (req, res) {
    sendTroopsModel.findOne({_id: req.params.sendTroopsId}, function (err, sendTroops) {
        if (err)
            res.send(err);
        sendTroops.sendType = req.body.sendType;
        sendTroops.idVillageFrom = req.body.idVillageFrom;
        sendTroops.idVillageTo = req.body.idVillageTo;
        sendTroops.timeSent = req.body.timeSent;
        sendTroops.timeArrived = req.body.timeArrived;
        sendTroops.troopTribe = req.body.troopTribe;
        for(let troop in tools.troopInfoLookup[req.body.troopTribe]){
            sendTroops['troop' + tools.troopInfoLookup[req.body.troopTribe][troop].id + 'num'] = req.body['troop' + tools.troopInfoLookup[req.body.troopTribe][troop].id + 'num'];
        }

        sendTroops.save(function (err) {
            if (err)
                res.json(err);
            res.json({
                message: 'sendTroops Info updated',
                data: sendTroops
            });
        });
    });
};

exports.delete = function (req, res) {
    sendTroopsModel.deleteOne({_id: req.params.sendTroopsId}, function (err, sendTroops) {
        if (err)
            res.send(err);
        res.json({
            status: 'success',
            message: 'sendTroops deleted'
        });
    });
};

function checkValidIdVillageTo(idVillage,idVillageTo,res){
    if(idVillage == idVillageTo){
        res.json({
            message: 'Cannot send troops to the same village',
            data: ''
        });
        return false;
    }
    return true;
}

function checkSentAmount(req,res,userTribe){
    let totalTroops = 0;
    for(let troop of troopInfoLookup[userTribe]){
        totalTroops += req.body['troop' + troop['id'] + 'num'];
    }
    if(totalTroops <= 0){
        res.json({
            message: 'You need to send at least one troop',
            data: ''
        });
        return false;
    }
    return true; 
}

async function updateVillageOwnTroops(idVillage,req,res){
    let villageOwnTroops = await(await(await tools.doApiRequest('villageOwnTroops/' + idVillage, 'GET', '', false)).json()).data;

    for(let troop of troopInfoLookup[userTribe]){
        villageOwnTroops['troop' + troop['id']] -= Number(req.body['troop' + troop['id'] + 'num']);
        if(villageOwnTroops['troop' + troop['id']] < 0){
            res.json({
                message: 'Not enough troops',
                data: ''
            });
            return false;
        }
    }

    const villageOwnTroopsResponse = await tools.doApiRequest('villageOwnTroops/' + idVillage, 'PATCH', villageOwnTroops, true);
    if (villageOwnTroopsResponse.status == 200){
        return true;
    }
    return false;
}

function calculateTroopArrival(idVillageToData,idVillageFromData){
    const distance = Math.hypot(idVillageToData['xCoordinate']-idVillageFromData['xCoordinate'], idVillageToData['yCoordinate']-idVillageFromData['yCoordinate']);
    let troopSpeed = 99;
    for(let troop of troopInfoLookup[userTribe]){
        if(req.body['troop' + troop['id'] + 'num'] > 0){
            let tempSpeed = troop['speed'];
            if(tempSpeed < troopSpeed) troopSpeed = tempSpeed;
        }
    }

    return (distance / troopSpeed * 3600) / config.TROOP_SPEED
}

async function doSendTroops(req,res){
    const currentUnixTime =  Math.round(new Date().getTime()/1000);
    const idVillageFromData = await(await(await tools.doApiRequest('villageOwnTroops/' + idVillage, 'GET', '', false)).json()).data;
    const idVillageToData   = await(await(await tools.doApiRequest('villageOwnTroops/' + idVillage, 'GET', '', false)).json()).data;
    const timeArrived = calculateTroopArrival(idVillageToData,idVillageFromData)

    let sendTroops = new sendTroopsModel();
    sendTroops.sendType = taskType;
    sendTroops.idVillageFrom = req.body.idVillageFrom;
    sendTroops.idVillageTo = req.body.idVillageTo;
    sendTroops.timeSent = currentUnixTime;
    sendTroops.timeArrived = timeArrived;
    sendTroops.troopTribe = userTribe;
    for(let troop of troopInfoLookup[userTribe]){
        sendTroops['troop' + troop['id'] + 'num'] = req.body['troop' + troop['id'] + 'num'];
    }

    sendTroops.save(async function (err, sendTroopsId) {
        if (err){
            res.json(err);
        }
        else{
            let scheduleData = {
                'taskType': taskType,
                'taskUnixTime': timeArrived,
                'taskData': {
                    'sendTroopsId': sendTroopsId._id,
                    'idVillageFrom': req.body.idVillageFrom,
                    'idVillageTo': req.body.idVillageTo,
                    'troopTribe': userTribe,
                }
            };

            for(let troop of troopInfoLookup[userTribe]){
                scheduleData['taskData']['troop' + troop['id'] + 'num'] = req.body['troop' + troop['id'] + 'num'];
            }

            const scheduleApiUrlResponse = await tools.doApiRequest('schedule', 'POST', scheduleData, true);
            if(scheduleApiUrlResponse.status == 200) {
                res.json({
                    message: 'sendTroops success',
                    data: sendTroops
                }); 
            } else {
                res.json({
                    message: 'sendTroops schedule failed',
                    data: ''
                }); 
            }
        }
    });
}