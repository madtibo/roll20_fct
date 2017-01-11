
on("chat:message", function(msg) {
	if(msg.type == "api") {
		var is_roll=false;
		var speak;
		// is it a special message?
		if (msg.content.indexOf("!sr") {
			speak="/em";
			is_roll=true;
		}
	  if (msg.content.indexOf("!gr") {
			speak="/w gm";
			is_roll=true;
		}
		if (is_roll){
			// set default params
			var difficulty=6;
			var nb_dice=4;
			var text="Danse et Om̐";
			var param = msg.content.split(" ", 8);
			if(param[1]!=undefined) {
				difficulty=param[1];
				if(param[2]!=undefined) {
					nb_dice=param[2];
					if(param[3]!=undefined) {
						text = "";
						for(var i=3; i<8; i++) {
							if(param[i]!=undefined) {
								text += param[i] + " ";
							}
						}
					}
				}
			}
			sendChat(msg.who, speak + " " + text
					 + " [[{" + nb_dice + "d10!}>" + difficulty + "f1]]");
		}
	}
});

