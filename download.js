var maxWidth = 0;
var jszip = null;
var project = null;
var id = null;
var soundId = 0;
var costumeId = 0;
var soundsToDownload = [];
var costumesToDownload = [];
var totalAssets = 0;
var completeAssets = 0;

function startDownload(projectId){
	$("#log").text("");
	$("#progress").text("");
	logMessage("Downloading project: "+projectId);
	soundId = 0;
	costumeId = 0;
	totalAssets = 0;
	completeAssets = 0;
	soundsToDownload = [];
	  costumesToDownload = [];
	id = projectId;
	setProgress(0);
	jszip = new JSZip();
	jszip.comment = "Created with MegaApuTurkUltra's Project Downloader";
	fetch("https://cdn.projects.scratch.mit.edu/internalapi/project/"+projectId+"/get/").then(data=>data.json()).then(function(data){
		// FIX 2018-07-16
		if (typeof data == "string") {
			data = JSON.parse(data);
		}
		setProgress(10);
		logMessage("Loaded JSON");
		project = data;
		processSoundsAndCostumes(project);
		if(project.hasOwnProperty("children")){
			for(child in project.children){
				processSoundsAndCostumes(project.children[child]);
			}
		}
		logMessage("Found "+totalAssets+" assets");
		jszip.file("project.json", JSON.stringify(project));
		downloadCostume();
	}).catch(perror);
}

function downloadCostume(){
	if(costumesToDownload.length > 0){
		var current = costumesToDownload.pop();
		logMessage("Loading asset "+current.costumeName+" ("+completeAssets+"/"+totalAssets+")");
		fetch("https://cdn.assets.scratch.mit.edu/internalapi/asset/"+current.baseLayerMD5+"/get/").then(data => data.blob()).then(blob => {
			var reader = new FileReader();
			reader.onload = () => {
				var data = reader.result.split(',')[1];
				var ext = current.baseLayerMD5.match(/\.[a-zA-Z0-9]+/)[0];
				jszip.file(current.baseLayerID+ext, data, {base64: true});
				completeAssets++;
				setProgress(10+89*(completeAssets/totalAssets));
				downloadCostume();
			};
			reader.readAsDataURL(blob);
		});
	} else {
		downloadSound();
	}
}

function downloadSound(){
	if(soundsToDownload.length > 0){
		var current = soundsToDownload.pop();
		logMessage("Loading asset "+current.soundName+" ("+completeAssets+"/"+totalAssets+")");
		fetch("https://cdn.assets.scratch.mit.edu/internalapi/asset/"+current.md5+"/get/").then(data => data.blob()).then(blob => {
			var reader = new FileReader();
			reader.onload = () => {
				var data = reader.result.split(',')[1];
				var ext = current.md5.match(/\.[a-zA-Z0-9]+/)[0];
				jszip.file(current.soundID+ext, data, {base64: true});
				completeAssets++;
				setProgress(10+89*(completeAssets/totalAssets));
				downloadSound();
			};
			reader.readAsDataURL(blob);
		});
	} else {
		logMessage("Generating ZIP...");
		var content = jszip.generate({type:"base64"});
		logMessage("Loading...");
		window.gotZipBase64(content);
		logMessage("Complete");
		var content2 = jszip.generate({type:"blob"});
		/*
		var a = document.createElement("a");
		a.style.display = 'none';
		document.body.appendChild(a);
		a.href = URL.createObjectURL(content2);
		a.click();
		*/
		psuccess();
	}
}

function processSoundsAndCostumes(node){
	if(node.hasOwnProperty("costumes")){
		for(var i=0;i<node.costumes.length;i++){
			var current = node.costumes[i];
			current.baseLayerID = costumeId;
			costumeId++;
			totalAssets++;
			costumesToDownload.push(current);
		}
	}
	if(node.hasOwnProperty("sounds")){
		for(var i=0;i<node.sounds.length;i++){
			var current = node.sounds[i];
			current.soundID = soundId;
			soundId++;
			totalAssets++;
			soundsToDownload.push(current);
		}
	}
}

function perror(){
	alert("Failed to download. Perhaps you used a bad project ID?\nRemember that this tool only supports sb2 projects.\n(It won't work if the project has been modified and saved in 3.0!)");
	logMessage("Download error");
	setProgress(100);
	$("#progress").addClass("error");
	$("#progress").animate({opacity:0}, 1000, function(){
		$(this).css({"opacity":1, width:0});
	});
}

function psuccess(){
	setProgress(100);
	setTimeout(() => {
		$("#progress").addClass("success");
		$("#progress").animate({opacity:0}, 1000, function(){
			$(this).css({"opacity":1, width:0});
		});
	}, 100);
}

function setProgress(perc){
	maxWidth = $("#downloader").width();
	$("#progress").width(perc + '%');// * maxWidth * 1.055 / 100);
}

function logMessage(msg){
	$("#log").text(msg+"\n"+$("#log").text());
}