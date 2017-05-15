/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var moment = require('moment'),
    q = require('q'),
    Medication = require('../api/medication/medication.model');

    // The following list are medications that have adverse interaction.
    //
    var rxcuiArr = [];
    rxcuiArr.push({
        rxcui: "152923",
        name: "Simvastatin 40 MG Oral Tablet [Zocor]"
    });
    rxcuiArr.push({
        rxcui: "656659",
        name: "bosentan 125 MG Oral Tablet"
    });
    rxcuiArr.push({
        rxcui: "207106",
        name: "Fluconazole 50 MG Oral Tablet [Diflucan]"
    });
    rxcuiArr.push({
        rxcui: "1726325",
        name: "5 ML Irinotecan hydrochloride 20 MG/ML Injection [Camptosar]"
    });

    q(Medication.findOne({}).exec()).then(function (med) {
        var currentDate = moment().startOf('day'),
            numMeds,
            i;
        numMeds = rxcuiArr.length;
        while (!med && currentDate.isBefore(moment().add(1, 'year'))) {
            var randomIndex = Math.floor((Math.random() * numMeds));
            for (i = 0; i < numMeds; i++) {

                // For each day, choose 3 random medications.
                //
                if (i == randomIndex) {
                    continue;
                }         
                        
                Medication.create({
                    rxcui: rxcuiArr[i].rxcui,
                    name: rxcuiArr[i].name,
                    dosage: i * 10 + ' mL',
                    time: currentDate.clone().add(i * 24 / numMeds, 'hours').toDate(),
                    completed: false,
                    d: {
                        c: moment().toDate()
                    }
                }, function (err, result) {
                    if (err) {
                        console.error(err);
                    }
                });
            }
            currentDate.add(1, 'day')
        }
    }).catch(function (err) {
        console.log('Error running seed', err);
    });

