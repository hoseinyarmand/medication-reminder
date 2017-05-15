'use strict';

var q = require('q'),
    moment = require('moment'),
    Medication = require('../medication/medication.model');

var request = require('request');


// Funciton: parseAdverseInteractionJson
// Input: JSON string from adverse interaction REST api
// Output: Array of interaction pair of medications.
// Logic:
// Parsing the following JSON (simplified)
// fullInteractionTypeGroup: [
//    {sourceName,
//     fullInteractionType: [
//        {minConcept,
//         interactionPair: [
//            {severity,
//             description}               
//       ]}   
//    ]}
// ]            
//
function parseAdverseInteractionJson(body) {    
    var adverse = JSON.parse(body);
    var fullInteractionTypeGroup = adverse["fullInteractionTypeGroup"];
    var interactionArr = [];

    for (var fullInteractionType in fullInteractionTypeGroup) {
        var fullInteraction = fullInteractionTypeGroup[fullInteractionType]["fullInteractionType"];
        for (var key in fullInteraction) {                            
            var minConcept = fullInteraction[key]["minConcept"];
            var interactionPair = fullInteraction[key]["interactionPair"][0];                        

            // Insert into interactionArr, only if not already present.
            // An interaction pair could come from two different sources.
            // Alternatively we could merge the description from different resouces.
            //                            
            if (!interactionArr.some(function(med) {
                return ((med.rxcui1 ==  minConcept[0]["rxcui"] &&
                        med.rxcui2 ==  minConcept[1]["rxcui"]) ||
                        (med.rxcui1 ==  minConcept[1]["rxcui"] &&
                        med.rxcui2 ==  minConcept[0]["rxcui"]))
            })) {
                interactionArr.push({
                    rxcui1: minConcept[0]["rxcui"],
                    name1:  minConcept[0]["name"],
                    rxcui2: minConcept[1]["rxcui"],
                    name2:  minConcept[1]["name"],
                    severity: interactionPair["severity"],                                    
                    description: interactionPair["description"]
                });
            }
        }
    }
    return interactionArr;    
}

exports.show = function (req, res) {
    // dataQuery creates a range to filter for the date passed to the api.
    //
    var dateQuery = {
            $and: [
                { time: { $gte: moment(req.query.day, 'MM/DD/YYYY').toDate() } },
                { time: { $lte: moment(req.query.day, 'MM/DD/YYYY').add(1, 'day').toDate() } }
            ]
        };

    // Filter medications based on rxcui.    
    //
    var projection = {rxcui: 1};

    // Get all the medications for the specified date.
    //
    q(Medication.find(dateQuery, projection).exec()).then(function (react) {
        if (react) {
            var rxcuis = "";

            // Append rxcui of medications.
            //
            for (var myKey in react) {
                if (react[myKey]["rxcui"]) {                
                    rxcuis += react[myKey]["rxcui"] + "+";
                }
            }

            // Remove the last +.
            //
            rxcuis = rxcuis.substring(0, rxcuis.length - 1);
            
            // Call a REST api to retrieve adverse interactions.
            //
            request('https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=' + rxcuis, 
                    function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    res.json(parseAdverseInteractionJson(body));
                } else {
                    console.log("Failed to retrieve adverse interactions.");
                }                
            })
        } else {
            res.send(404);
        }
    }).catch(function (err) {
        console.error('Error occured getting medication', err);
        res.send(500);
    });    
};

