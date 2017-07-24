
function isNormalInteger(str) {
		'use strict';
		return (/^[0-9]\d*$/).test(str);
}

function getPlayerId(msg) {
		'use strict';
    var player_id;
    //log("playerid: "+msg.playerid+", obj.player: "+JSON.stringify(getObj('player', msg.playerid))+", speakingas: "+getObj('player', msg.playerid).get('speakingas')+", player_id: "+getObj('player', msg.playerid).get('speakingas').split("|",2)[1]);
    try {
        player_id = 
            getObj('player', msg.playerid).get('speakingas').split("|",2)[1];
        if(player_id === undefined) {
						player_id = msg.playerid;
				}
    }
    catch (e) {
        player_id = msg.playerid;
    }
    log("got player_id: "+player_id);
    return player_id;
}

function getCharacterId(msg) {
		'use strict';
    var char_id;
    //log("character for "+getPlayerId(msg)+": "+JSON.stringify(findObjs({type: 'character',controlledby: getPlayerId(msg)},{caseInsensitive: true})));
    try {
        char_id = findObjs({type: 'character',
                            controlledby: getPlayerId(msg)},
                           {caseInsensitive: true})[0].id;
        if(char_id === undefined) {
						char_id = msg.playerid;
				}
    }
    catch (e) {
        char_id = msg.playerid;
    }
    log("got char_id: "+char_id);
    return char_id;
}

function getPlayerName(msg) {
		'use strict';
    var name;
    try {
        name = msg.who;
    }
    catch (e) {
        name = getObj('player', msg.playerid).get('speakingas');
    }
    log("got player name: "+name);
    return name;
}

function getAttrValueByRegex(character_id,
                             attribute_regex) {
		'use strict';
    var attributes=
        findObjs({type: 'attribute', characterid: character_id},
                 {caseInsensitive: true});
    var index,len,attr_value=0,attribute_name="";
    var patt = new RegExp(attribute_regex, 'i');
    for (index=0, len=attributes.length; index<len; index++) {
        if (patt.test(attributes[index].get("name"))) {
            attr_value = attributes[index].get('current');
            attribute_name = attributes[index].get("name");
            log ("found attribute "+attribute_name+ " for "
                 +attribute_regex+": "+attr_value);
            break;
        }
    }
    return [ attribute_name, attr_value ];
}

// return the health malus
function getHealthLevel(character_id) {
	'use strict';
	if (getAttrValueByRegex(character_id, 'Incapacitated')[1] != 0) {
	    return -15;
	}
	if (getAttrValueByRegex(character_id, 'Crippled')[1] != 0) {
	    return -5;
	}
	if (getAttrValueByRegex(character_id, 'Mauled')[1] != 0) {
	    return -2;
	}
	if (getAttrValueByRegex(character_id, 'Wounded')[1] != 0) {
	    return -2;
	}
	if (getAttrValueByRegex(character_id, 'Injured')[1] != 0) {
	    return -1;
	}
	if (getAttrValueByRegex(character_id, 'Hurt')[1] != 0) {
	    return -1;
	}
}

// get the sum of maximum three parameters
// parameters can be numbers or attributes
// return an array with first the stringify parameters and then the result of the sum
function getAttrSum(character_id, attributes) {
		'use strict';
    var params = attributes.split("+", 3);
    var attr_sum=getHealthLevel(character_id);
    log('attr_sum = '+attr_sum);
    var attr_string=[];
		for(var i=0; i<3; i++) {
        if(isNormalInteger(params[i])) {
            attr_string.push(params[i]);
            attr_sum += Number(params[i]);
        }
        else if(typeof params[i] === 'string') {
            var attr_name_value = getAttrValueByRegex(character_id,params[i]);
            attr_string.push(attr_name_value[0]);
            attr_sum += Number(attr_name_value[1]);
        }
    }
    if (attr_sum<0) {
	    attr_sum=0;
    }
    return [ attr_string.join('+'), attr_sum ];
}

// get an attribute value for a given char_id, if not found, use and set the default
function getAttrValueByName(character_id,
                            attribute_name,
                            attribute_default_value) {
	'use strict';
    var attribute_default_value=attribute_default_value || '';
    var attribute=attribute_default_value;
    var attributes;
    //log("get value for player " + character_id + " " + attribute_name + " (" + attribute_default_value + ")");
    try {
        attributes=
            findObjs({type: 'attribute',
                      characterid: character_id,
                      name: attribute_name},
                     {caseInsensitive: true});
        //log("found attributes: "+JSON.stringify(attributes));
        _.each(attributes, function (obj){
                log('attribute '+obj.get('name')+': '+obj.get('current'));
                if (obj.get('current') !== undefined) {
                    if (attribute === attribute_default_value) {
                      attribute = obj.get('current');
                    }
                }
               });
    }
    catch (e) {
        log("attribute not found");
        log("error for attributes: "+JSON.stringify(attributes));
    }
    if (attributes.length === 0){
        log("set default value for player " + character_id + " " + attribute_name + " (" + attribute_default_value + ")");
        try {
            createObj(
                'attribute', 
                { characterid: character_id,
                  name: attribute_name,
                  current: attribute_default_value 
                }
            );
        }
        catch (e) {
            log("impossible to set attribute: "+attribute_name+" to char_id "+character_id);
        }
    }
    return attribute;
}

// roll the given number of dices against the difficulty and return a struct like :
// '{ difficulty: <int>, successes: <int>, botches: <int>, criticals: <int>, results: [<array_dices_res>] }'
function rollNormal(nb_dice, diff) {
	'use strict';
    var dice_results = { difficulty: diff, successes: 0, botches: 0, criticals: 0, results: [] };
    for(var i=0; i<nb_dice; i++) {
        var roll = randomInteger(10);
        if (roll === 10) { 
            dice_results["successes"] += 2;
            dice_results["criticals"] += 1;
        } else if (roll >= diff) {
            dice_results["successes"] += 1;
        } else if (roll === 1) {
            dice_results["botches"] += 1;
        }
        dice_results["results"].push(roll);
    }
    if (dice_results["successes"] > 0) {
        dice_results["botches"] = 0;
    }
    return dice_results;
}

// roll the given number of dices against the difficulty and return a struct like :
// '{ difficulty: <int>, successes: <int>, botches: <int>, criticals: <int>, results: [<array_dices_res>] }'
function rollMagick(nb_dice, diff) {
	'use strict';
    var dice_results = { difficulty: diff, successes: 0, botches: 0, criticals: 0, results: [] };
    for(var i=0; i<nb_dice; i++) {
        var roll = randomInteger(10);
        if (roll >= diff) {
            dice_results["successes"] += 1;
            if (roll === 10) { 
                dice_results["criticals"] += 1;
                i -= 1;
            }
        } else {
            if (roll === 1) {
                dice_results["botches"] += 1;
                dice_results["successes"] -= 1;
            }
        }
        dice_results["results"].push(roll);
    }
    return dice_results;
}

function getDiceColour(dice_result, difficulty) {
	'use strict';
	// color for each dice result
	var roll_colours = { none: "#FFFFFF", success: "#4A57ED", critsuccess: "#3FB315", critfail: "#B31515" };
	var roll_colour = roll_colours["none"];
	if (dice_result = 1) {
	    roll_colour = roll_colours["critfail"];
	} else if (dice_result = 10) {
	    roll_colour = roll_colours["critsuccess"];
	} else if (dice_result >= difficulty) {
	    roll_colour = roll_colours["success"];
	}
    return roll_colour;
}

function getDiceResults(dices_results, difficulty) {
	'use strict';
    // TODO get the array and convert them to coloured results
    var dice_list = "";
    var first_dice = true;
    _.each(dices_results,function (dice_result){
        if (! first_dice) {
            dice_list += "+";
        } else {
            first_dice = false;
        }
        dice_list += dice_result;
        //dice_list += "<span style=\"color:"+getDiceColour(dice_result,difficulty)+"\">"+dice_result+"</span>";
    });
    return dice_list;
}

// using a dice_results like:
// '{ successes: <int>, botches: <int>, criticals: <int>, results: [<array_dices_res>] }'
function formatRollResult(dice_results) {
	'use strict';
	// color for the overall success number
	var result_colors = { none: "#FEF68E", importantroll: "#4A57ED", fullcrit: "#3FB315", fullfail: "#B31515" };
	var result_color = result_colors["none"];
	if (dice_results["successes"] < 0) {
	    result_color = result_colors["fullfail"];
	} else if (dice_results["successes"] > 0) {
	    if (dice_results["criticals"] > 0) {
	        if (dice_results["botches"] > 0) {
	            result_color = result_colors["importantroll"];
	        } else {
	            result_color = result_colors["fullcrit"];
	        }
	    }
	}
	var box_style = "style=\"background-color:#FEF68E;padding:0 3px 0 3px;font-weight:bold;cursor:help;font-size:1.1em; border:2px solid "+result_color+"\"";
	var text = "<span class=\"dice_tooltip\" title=\""+getDiceResults(dice_results["results"], dice_results["difficulty"])+"\" "+box_style+">"+dice_results["successes"]+"</span> succès";
    return text;
}

function sendRollMsg(who, speak, text, nb_dice, difficulty) {
	'use strict';
    var message = speak + " " + text 
      	+ " [[{" + nb_dice[1] + "d10!}>" + difficulty + "f1]]"
      	+ "  ("+nb_dice[0]+" diff "+difficulty+")";
    log("envoi au chat " + who + ": " + message);
    sendChat(who, message);
}

// var build_command = { is_roll: false, is_sane: false, is_normal_roll: true,
//                       is_hidden: false, is_whisper: false, difficulty: 0, message: "" };
// build_command: command,  is_roll, is_sane, is_normal_roll, is_hidden, is_whisper, difficulty, message 
function parseRollCommand(message, build_command) {
    'use strict';
    // search for a normal or magick roll
    // group 1: specific command
    // group 2: roll type
    // group 3: difficulty
    var parse_msg = message.content.match(/^!([hw]*)(n|m)r([0-9]{0,2})/);
    if (parse_msg !== null) {
        //log("command: make roll");
        build_command["is_roll"]=true;
        if (parse_msg[1] !== null) {
            // specific command (whisper or hidden)
            //log("parse_msg[1]: "+parse_msg[1]);
            if (parse_msg[1].match("h")) {
                build_command["is_hidden"]=true;
                log("hidden roll");
            }
            if (parse_msg[1].match("w")) {
                build_command["is_whisper"]=true;
                log("whispered roll");
            }
        }
        if (parse_msg[2].match(/m/)) {
            build_command["is_normal_roll"]=false;
        }
        if ((parse_msg[3] !== null) && (parse_msg[3] !== "")) {
            build_command["difficulty"]=parse_msg[3];
            log("difficulty: "+build_command["difficulty"]);
        }
    }
}

// build and send the command
// build_command: command,  is_roll, is_sane, is_normal_roll, is_hidden, is_whisper, difficulty, message 
function sendRollCommand(message, build_command) {
    'use strict';
    if (build_command["is_roll"]) {
        var char_id = getCharacterId(message);
        var dice_roll="";
        var nb_dice=0;
        var text="";
        log("begin is_sane: "+build_command["is_sane"]);
        log ("message: "+message.content);

        var param=[]; 
        if (message !== undefined && message.content !== undefined) {param= message.content.split(" ", 10);}
        // get difficulty
        if(build_command["difficulty"]===0) {
            build_command["difficulty"] = getAttrValueByName(char_id,"dflt_difficulty","6");
        }
        log("difficulty: "+build_command["difficulty"]);
        if (build_command["difficulty"] === 0) { build_command["is_sane"]=false; }
        // get nb_dice
        if(param[1]!==undefined) {
        	nb_dice = getAttrSum(char_id,param[1]);
        }
        else {
            nb_dice=getAttrSum(char_id,getAttrValueByName(char_id,"dflt_nb_dice","4"));
        }
        log("nb_dice: "+nb_dice);
        if (nb_dice[1] === 0) { build_command["is_sane"]=false; }
        // get text
        if(param[2]!==undefined) {
        	for(var i=2; i<10; i++) {
        		if(param[i] !== undefined) {
        			log(""+param[i]+": "+typeof param[i]);
        			text += param[i] + " ";
        		}
        	}
        }
        else {
            text=getAttrValueByName(char_id,"dflt_text","mon action");
        }
        log("text: "+text);

        if (build_command["is_normal_roll"]) {
            dice_roll=rollNormal(nb_dice[1], build_command["difficulty"]);
        }
        else {
            dice_roll=rollMagick(nb_dice[1], build_command["difficulty"]);
        }
        log("dice_roll: "+dice_roll);
        log("end is_sane: "+build_command["is_sane"]);

        if (build_command["is_sane"]) {
            var roll_text = text+" "+dice_roll["successes"]+" succès ("+nb_dice[0]+" - "+nb_dice[1]+"d>"+build_command["difficulty"]+" => "+dice_roll["results"]+")";
            var direct_roll_text = text+" "+formatRollResult(dice_roll)+" ("+nb_dice[0]+" - "+nb_dice[1]+"d>"+build_command["difficulty"]+")";
            log("roll_text: "+roll_text);
            // how do we speak
            if (build_command["is_whisper"]) {
                if (build_command["is_hidden"]) {
                    // send only the roll text to the player
                    sendChat(message.who, "/w "+message.who+" "+text+" ("+nb_dice[1]+"d>"+build_command["difficulty"]+")");
                }
                else {
                    // send the roll to the player
                    sendChat(message.who, "/w "+message.who+" "+roll_text);
                }
                sendChat(message.who, "/w gm "+message.who+" tente "+roll_text);
            }
            else {
                if (build_command["is_hidden"]) {
                    // send only the roll text to the chat
                    sendChat(message.who, "/em "+text+" ("+nb_dice[1]+"d>"+build_command["difficulty"]+")");
                    sendChat(message.who, "/w gm "+message.who+" tente "+roll_text);
                }
                else {
		            sendChat(message.who, "/direct "+message.who+" "+direct_roll_text);
                }
            }
        }
    	else {
            sendChat(message.who, "/direct "+message.who+" impossible to roll");
	    }
    }
}

on("chat:message", function(msg) {
	'use strict';
    // is it a special message?
    if(msg.type == "api") {
        //log("msg: "+JSON.stringify(msg));
        log("rcv from "+msg.playerid+": "+msg.content);
        // build_command: command,  is_roll, is_sane, is_normal_roll, is_hidden, is_whisper, difficulty, message 
        var build_command = { command: "", is_roll: false, is_sane: true, is_normal_roll: true, 
                              is_hidden: false, is_whisper: false, difficulty: 0, message: "" };
        parseRollCommand(msg, build_command);
        sendRollCommand(msg, build_command);
        
        if (msg.content.match(/^!at/) !== null) {
            log("command: get attribute value");
            log('health: '+getHealthLevel(getCharacterId(msg)));
            var param = msg.content.split(" ", 8);
            var attr = getAttrSum(getCharacterId(msg),param[1]);
            sendChat(msg.who, "/w "+msg.who+" "+attr[0]+": "+attr[1]);
        }
        
        /*
        // v1
        var command;
        var speak;
        var is_roll=false;
        var is_sane=true;
        var char_id = getCharacterId(msg);
        if (msg.content.match(/^!sr/) !== null) {
			command = "!sr";
            speak="/em";
            is_roll=true;
        }
        if (msg.content.match(/^!gr/) !== null) {
			command = "!gr";
            speak="/w gm";
            is_roll=true;
        }
        if (is_roll){
            var difficulty=getAttrValueByName(char_id,"dflt_difficulty","6");
            //log("difficulty: "+difficulty);
            var nb_dice=getAttrSum(char_id,getAttrValueByName(char_id,"dflt_nb_dice","4"));
            //log("nb_dice: "+nb_dice);
            var text=getAttrValueByName(char_id,"dflt_text","mon action");
            //log("text: "+text);
            var param = msg.content.split(" ", 10);
            is_sane = true;
            var first_param = param[0].replace(command, "").replace(/ /g,'');
            if((first_param===undefined) || (first_param === "")) {
                first_param = difficulty;
            }
            difficulty = getAttrSum(char_id,first_param)[1];
            if (difficulty === 0) { is_sane = false; }
            if(param[1]!==undefined) {
            	nb_dice = getAttrSum(char_id,param[1]);
                if (nb_dice[1] === 0) { is_sane = false; }
                if(param[2]!==undefined) {
                    text = "";
            		for(var i=2; i<10; i++) {
            			if(param[i] !== undefined) {
            				log(""+param[i]+": "+typeof param[i]);
            				text += param[i] + " ";
            			}
            		}
            	}
            }
            if (is_sane) {
                sendRollMsg(msg.who, speak, text, nb_dice, difficulty);
                if (command === "!gr") {
                    // whisper to gm, echo the command (without the roll)
                    sendChat(msg.who, "/w "+msg.who+" exécute "+text+" - "+nb_dice[0]+" ("+nb_dice[1]+"d)"+" diff "+difficulty);
                }
            }
        }
        */
    }
}
);
