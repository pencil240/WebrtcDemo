/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

var getMediaButton = document.querySelector('button#getMedia');
var connectButton = document.querySelector('button#connect');
var hangupButton = document.querySelector('button#hangup');
var autoTestButton = document.querySelector('button#AutoTest');  

var counts = 0;
getMediaButton.onclick = getMedia;
connectButton.onclick = createPeerConnection;
hangupButton.onclick = hangup;
autoTestButton.onclick = autotest;

var minWidthInput = document.querySelector('div#minWidth input');
var maxWidthInput = document.querySelector('div#maxWidth input');
var minHeightInput = document.querySelector('div#minHeight input');
var maxHeightInput = document.querySelector('div#maxHeight input');
var minFramerateInput = document.querySelector('div#minFramerate input');
var maxFramerateInput = document.querySelector('div#maxFramerate input');

minWidthInput.onchange = maxWidthInput.onchange =
    minHeightInput.onchange = maxHeightInput.onchange =
    minFramerateInput.onchange = maxFramerateInput.onchange = displayRangeValue;

var getUserMediaConstraintsDiv =
    document.querySelector('div#getUserMediaConstraints');
//var OldConstraintsDiv = document.querySelector('div#OldConstraints');
//var NewConstraintsDiv = document.querySelector('div#NewConstraints');
var bitrateDiv = document.querySelector('div#bitrate');
var peerDiv = document.querySelector('div#peer');
var senderStatsDiv = document.querySelector('div#senderStats');
var receiverStatsDiv = document.querySelector('div#receiverStats');

var localVideo = document.querySelector('div#localVideo video');
var remoteVideo = document.querySelector('div#remoteVideo video');
var localVideoStatsDiv = document.querySelector('div#localVideo div');
var remoteVideoStatsDiv = document.querySelector('div#remoteVideo div');

var localPeerConnection;
var remotePeerConnection;
var localStream;
var bytesPrev;
var timestampPrev;

var isSetRemoteDSPDone = false;
var CandidateArray = new Array();

 var currentconstraints =
                {
					frameRate: {max: 0},
					width: { min: 0, max: 0 },
					height: {min: 0, max: 0},
					max_fs:0,
					max_fr:0
                };

var TestFlag = false;
var TestVideoWidth = 640;
var TestVideoHeight = 360;
var TestFrameRate = 15;
var TestResult = {width:0,height:0,frameRate:0};
var TestArray =[{width:1920,height:1080,frameRate:15},{width:1280,height:720,frameRate:15},{width:640,height:360,frameRate:15}];
var TestCount = 0;

main();

function TestReport()
{
	if (true == TestFlag)
	{
		var testresult = '';
		if (TestResult.width *  TestResult.height !=0 && TestResult.width *  TestResult.height <= TestVideoWidth*TestVideoHeight  && TestResult.width *  TestResult.height <= currentconstraints.max_fs * 256)
		{
			testresult += '<font color="#00FF00">' +TestResult.width + '*'  + TestResult.height + '</font>'
		}
		else
		{
			testresult += '<font color="#FF0000">' +TestResult.width + '*'  + TestResult.height + '</font>'
		}
		if(TestResult.frameRate != 0 && TestResult.frameRate <= TestFrameRate)
		{
			testresult += '<font color="#00FF00">'  + '*'  + TestResult.frameRate + '</font>'
		}
		else
		{
			testresult += '<font color="#FF0000">'  + '*'  + TestResult.frameRate + '</font>'
		}
		
		var constraints = ' <strong>applyconstraints : </strong> ' + 
			'width (' + currentconstraints.width.min + ' - ' + currentconstraints.width.max + ') ' +
			'height (' + currentconstraints.height.min + ' - ' + currentconstraints.height.max + ') ' + 
			'frameRate (0 - ' + currentconstraints.frameRate.max + ') ' + 
			' <strong>SDP : </strong> '  + 
			'max-fs=' + currentconstraints.max_fs + ' ' +
			'max-fr=' + currentconstraints.max_fr;
			
		var currentresult = '\r\n' + '<strong>Parameter : </strong> '+ TestVideoWidth + '*' + TestVideoHeight +  '*' + TestFrameRate + ' <strong>Test Result : </strong>' + testresult + constraints;

		console.log(currentresult);
		$("<p>"+currentresult+"</p>").appendTo("#AutoTestResult");
	}
	//TestFlag = false;
	hangup();
	getMedia();
}

function autotest()
{
	TestFlag = true;
	getMedia();
	
	//hangup();
}

function main() {
  displayGetUserMediaConstraints();
  //autotest();
}

function hangup() {
  console.log('Ending call');
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;

  localStream.getTracks().forEach(function(track) {
    track.stop();
  });
  localStream = null;

  hangupButton.disabled = true;
  getMediaButton.disabled = false;
}

function getMedia() {
	if(TestFlag == true && TestArray.length > 0 && TestCount >= 0)
	{
		//just auto test the parameter in TestArray once.
		
		if(TestArray.length <= TestCount)
		{
			TestCount = 0;
			TestFlag = false;
			return;
		}
		
		TestVideoWidth = TestArray[TestCount%TestArray.length].width;
		TestVideoHeight = TestArray[TestCount%TestArray.length].height;
		TestFrameRate = TestArray[TestCount%TestArray.length].frameRate;
		TestCount++;
	}
	counts = 0;
  getMediaButton.disabled = true;
  if (localStream) {
    localStream.getTracks().forEach(function(track) {
      track.stop();
    });
    var videoTracks = localStream.getVideoTracks();
    for (var i = 0; i !== videoTracks.length; ++i) {
      videoTracks[i].stop();
    }
  }
  navigator.mediaDevices.getUserMedia(getUserMediaConstraints())
  .then(gotStream)
  .catch(function(e) {
    var message = 'getUserMedia error: ' + e.name + '\n' +
        'PermissionDeniedError may mean invalid constraints.';
    alert(message);
    console.log(message);
    getMediaButton.disabled = false;
  });
}

function applyNewConstrains(nWidth,nHeight,nFramerate,desp)
{
	
		   //add code for testing firefox applyConstraints
	  var vTracks = localStream.getVideoTracks();
	var lovTrack = undefined;
	if( vTracks.length )
		lovTrack = vTracks[0];
	
	if( lovTrack )
	{
		//var oldconstraints = lovTrack.getConstraints();
		//OldConstraintsDiv.innerHTML='<oldc>Old Constraints :</oldc> ' +'\r\n' + JSON.stringify(oldconstraints, null, '    ');
		//oldconstraints.frameRate.max=15;
		//NewConstraintsDiv.innerHTML='<newc>New Constraints :</newc> ' +'\r\n' + JSON.stringify(oldconstraints, null, '    ');
		
		// user the constraints  width : nWidth - nWidth  ;  height: nHeight - nHeight   ;  frameRate:  0 - nFramerate
		 var constraints =
                {
					frameRate: {max: 30},
					width: { min: 0, max: 1920 },
					height: {min: 0, max: 1080}
                };
         constraints.frameRate.max = nFramerate;
		 constraints.width.min = nWidth;
		 constraints.width.max = nWidth;
		 constraints.height.min = nHeight;
		 constraints.height.max = nHeight;

         var mb_width = (parseInt(nWidth,10) + 15) / 16;
		var mb_height = (parseInt(nHeight,10) + 15) / 16;
		var resolution = Math.floor(mb_width) * Math.floor(mb_height);

        var newfs = 'max-fs=' + resolution;
		var newfr = 'max-fr=' + nFramerate;
         
        counts++;
		lovTrack.applyConstraints(constraints)
			.then(function(val) {
					//var newconstraints = lovTrack.getConstraints();
					//NewConstraintsDiv.innerHTML='<newc>New Constraints :</newc> ' +'\r\n' + JSON.stringify(newconstraints, null, '    ');
					console.log("succeed to applyConstraints : " + JSON.stringify(constraints, null, '    '));

					currentconstraints.frameRate.max = constraints.frameRate.max;
					currentconstraints.width.min = constraints.width.min;
					currentconstraints.width.max = constraints.width.max;
					currentconstraints.height.min = constraints.height.min;
					currentconstraints.height.max = constraints.height.max;
					currentconstraints.max_fs = resolution;
					currentconstraints.max_fr = nFramerate;
					var newsting = desp.sdp.replace(new RegExp(/max-fs=([0-9]){1,}/, 'g'),newfs);
					newsting = newsting.replace(new RegExp(/max-fr=([0-9]){1,}/, 'g'),newfr);

					desp.sdp = newsting;
					console.log(desp.sdp);
					localPeerConnection.setRemoteDescription(desp);
					 isSetRemoteDSPDone = true;
					  while(CandidateArray.length > 0)
					  {
						  var icecandidate  = CandidateArray.pop();
						  localPeerConnection.addIceCandidate(icecandidate)
							.then(
							onAddIceCandidateSuccess,
							onAddIceCandidateError
						);
					  };
             })//.then 1
		  .catch(function(e) {
					console.log("fail to applyConstraints : " + JSON.stringify(constraints, null, '    ') + " retrying new constraints .");
					//use a new constraints  width : 0 - nWidth  ;  height: 0 - nHeight   ;  frameRate:  0 - nFramerate
					constraints.width.min = 0;
					constraints.height.min = 0;

					counts++;
					lovTrack.applyConstraints(constraints)
						.then(function(val) {
								//var newconstraints = lovTrack.getConstraints();
								//NewConstraintsDiv.innerHTML='<newc>New Constraints :</newc> ' +'\r\n' + JSON.stringify(newconstraints, null, '    ');
								console.log("succeed to applyConstraints : " + JSON.stringify(constraints, null, '    '));

								currentconstraints.frameRate.max = constraints.frameRate.max;
								currentconstraints.width.min = constraints.width.min;
								currentconstraints.width.max = constraints.width.max;
								currentconstraints.height.min = constraints.height.min;
								currentconstraints.height.max = constraints.height.max;
								currentconstraints.max_fs = resolution;
								currentconstraints.max_fr = nFramerate;

								var newsting = desp.sdp.replace(new RegExp(/max-fs=([0-9]){1,}/, 'g'),newfs);
								newsting = newsting.replace(new RegExp(/max-fr=([0-9]){1,}/, 'g'),newfr);

								desp.sdp = newsting;
								console.log(desp.sdp);
								localPeerConnection.setRemoteDescription(desp);
								 isSetRemoteDSPDone = true;
								  while(CandidateArray.length > 0)
								  {
									  var icecandidate  = CandidateArray.pop();
									  localPeerConnection.addIceCandidate(icecandidate)
										.then(
										onAddIceCandidateSuccess,
										onAddIceCandidateError
									);
								  };
						})
						.catch(function(e){
								console.log("fail to applyConstraints : " + JSON.stringify(constraints, null, '    ') + " retrying new constraints .");
								//use a new constraints  width : 0 - 1920  ;  height: 0 - 1080   ;  frameRate: 0 - nFramerate * 2
								constraints.width.max = 1920;
								constraints.height.max = 1080;
								constraints.frameRate.max = nFramerate * 2;

								counts++;
								lovTrack.applyConstraints(constraints)
									.then(function(val) {
											//var newconstraints = lovTrack.getConstraints();
											//NewConstraintsDiv.innerHTML='<newc>New Constraints :</newc> ' +'\r\n' + JSON.stringify(newconstraints, null, '    ');
											console.log("succeed to applyConstraints : " + JSON.stringify(constraints, null, '    '));

											currentconstraints.frameRate.max = constraints.frameRate.max;
											currentconstraints.width.min = constraints.width.min;
											currentconstraints.width.max = constraints.width.max;
											currentconstraints.height.min = constraints.height.min;
											currentconstraints.height.max = constraints.height.max;
											currentconstraints.max_fs = resolution/2;
											currentconstraints.max_fr = nFramerate;


											//const senders = localPeerConnection.getSenders();
											//const sender = senders[1];
											//sender.setParameters({
											//encodings: [{ scaleResolutionDownBy: 2 }]
											//});

											// reset the max-fs to max-fs/2 to make sure the max-bmps is equal to the server requests.
											//'max-fs=12288;max-fr=60'
											newfs = 'max-fs=' + resolution/2;
											newfr =  'max-fr=' + nFramerate;


											var newsting = desp.sdp.replace(new RegExp(/max-fs=([0-9]){1,}/, 'g'),newfs);
											newsting = newsting.replace(new RegExp(/max-fr=([0-9]){1,}/, 'g'),newfr);

											desp.sdp = newsting;
											console.log(desp.sdp);
											localPeerConnection.setRemoteDescription(desp);
											 isSetRemoteDSPDone = true;
											  while(CandidateArray.length > 0)
											  {
												  var icecandidate  = CandidateArray.pop();
												  localPeerConnection.addIceCandidate(icecandidate)
													.then(
													onAddIceCandidateSuccess,
													onAddIceCandidateError
												);
											  };
									})
					   .catch(function(e){
										var message = 'applyConstraints error: ' + e.name;
										alert(message);
										console.log(message);
							});// .catch 3
						});// .catch 2
		  });// .catch 1
	}//if( lovTrack )
	//localVideoStatsDiv.innerHTML = '<trycount>Try applyConstraints :</trycount> ' +counts;
}//applyNewConstrains


function gotStream(stream) {
  connectButton.disabled = false;
  console.log('GetUserMedia succeeded');
  localStream = stream;
  localVideo.srcObject = stream;

   if(TestFlag == true)
	{
	createPeerConnection();
	}
  
}

function getUserMediaConstraints() {
  var constraints = {};
  constraints.audio = true;
  constraints.video = {};
  if (minWidthInput.value !== '0') {
    constraints.video.width = {};
    constraints.video.width.min = minWidthInput.value;
  }
  if (maxWidthInput.value !== '0') {
    constraints.video.width = constraints.video.width || {};
    constraints.video.width.max = maxWidthInput.value;
  }
  if (minHeightInput.value !== '0') {
    constraints.video.height = {};
    constraints.video.height.min = minHeightInput.value;
  }
  if (maxHeightInput.value !== '0') {
    constraints.video.height = constraints.video.height || {};
    constraints.video.height.max = maxHeightInput.value;
  }
  if (minFramerateInput.value !== '0') {
    constraints.video.frameRate = {};
    constraints.video.frameRate.min = minFramerateInput.value;
  }
  if (maxFramerateInput.value !== '0') {
    constraints.video.frameRate = constraints.video.frameRate || {};
    constraints.video.frameRate.max = maxFramerateInput.value;
  }

  return constraints;
}

function displayGetUserMediaConstraints() {
  var constraints = getUserMediaConstraints();
  console.log('getUserMedia constraints', constraints);
  getUserMediaConstraintsDiv.textContent =
      JSON.stringify(constraints, null, '    ');
}

function createPeerConnection() {
  connectButton.disabled = true;
  hangupButton.disabled = false;

  bytesPrev = 0;
  timestampPrev = 0;
  localPeerConnection = new RTCPeerConnection(null);
  remotePeerConnection = new RTCPeerConnection(null);


  localStream.getTracks().forEach(
    function(track) {
      track.onended = function()
      {
        console.log('... onended ...');
      }
      localPeerConnection.addTrack(
        track,
        localStream
      );
    }
  );
  console.log('localPeerConnection creating offer');
  localPeerConnection.onnegotiationeeded = function() {
    console.log('Negotiation needed - localPeerConnection');
  };
  remotePeerConnection.onnegotiationeeded = function() {
    console.log('Negotiation needed - remotePeerConnection');
  };
    
  localPeerConnection.onicecandidate = function(e) {
    console.log('Candidate localPeerConnection');
    remotePeerConnection.addIceCandidate(e.candidate)
    .then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
  };

  remotePeerConnection.onicecandidate = function(e) {
    console.log('Candidate remotePeerConnection');
	if (false == isSetRemoteDSPDone)
	{
		CandidateArray.push(e.candidate);
		return;
	}	
    localPeerConnection.addIceCandidate(e.candidate)
    .then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
  };
  
  remotePeerConnection.ontrack = function(e) {
    if (e.streams != undefined && remoteVideo.srcObject !== e.streams[0]) {
      console.log('remotePeerConnection got stream');
      remoteVideo.srcObject = e.streams[0];
    }
  };
  localPeerConnection.createOffer().then(
    function(desc) {
      console.log('localPeerConnection offering');
	  //desc.sdp = desc.sdp.replace(new RegExp(/m=video(.*?)\r\n/, 'g'),'m=video 9 UDP/TLS/RTP/SAVPF 126 97\r\n');
      localPeerConnection.setLocalDescription(desc);
      remotePeerConnection.setRemoteDescription(desc);
	  isSetRemoteDSPDone = false;
      remotePeerConnection.createAnswer().then(
        function(desc2) {
          console.log('remotePeerConnection answering');
          remotePeerConnection.setLocalDescription(desc2);
          if(adapter.browserDetails.browser == "firefox")
          {
            applyNewConstrains(TestVideoWidth,TestVideoHeight,TestFrameRate,desc2);
          }
          else
          {
            localPeerConnection.setRemoteDescription(desc2);
          }
		  if(TestFlag == true)
		  {
			  setTimeout(TestReport,10000);
		  }
		  
        },
        function(err) {
          console.log(err);
        }
      );
    },
    function(err) {
      console.log(err);
    }
  );
  displayGetUserMediaConstraints();
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log('Failed to add Ice Candidate: ' + error.toString());
}

// Display statistics
setInterval(function() {
  if (remotePeerConnection && remotePeerConnection.getRemoteStreams()[0]) {
    remotePeerConnection.getStats(null)
    .then(function(results) {
      var statsString = dumpStats(results);
      receiverStatsDiv.innerHTML = '<h2>Receiver stats</h2>' + statsString;
      // calculate video bitrate
      results.forEach(function(report) {
        var now = report.timestamp;

        var bitrate;
		var framerateMean;
        if ( (report.type === 'inboundrtp'|| report.type === 'inbound-rtp') && report.mediaType === 'video') {
          // firefox calculates the bitrate for us
          // https://bugzilla.mozilla.org/show_bug.cgi?id=951496
          bitrate = Math.floor(report.bitrateMean / 1024);
          framerateMean = Math.floor(report.framerateMean);
        } else if (report.type === 'ssrc' && report.bytesReceived &&
             report.googFrameHeightReceived) {
          // chrome does not so we need to do it ourselves
          var bytes = report.bytesReceived;
          if (timestampPrev) {
            bitrate = 8 * (bytes - bytesPrev) / (now - timestampPrev);
            bitrate = Math.floor(bitrate);
          }
          bytesPrev = bytes;
          timestampPrev = now;
        }
        if (bitrate) {
          bitrate += ' kbits/sec';
		  var frMeam = framerateMean + 'fps';
          bitrateDiv.innerHTML = '<strong>Bitrate: </strong>' + bitrate + '<strong> Framerate: </strong>'+frMeam;
		  TestResult.frameRate = framerateMean;
        }
      });

      // figure out the peer's ip
      var activeCandidatePair = null;
      var remoteCandidate = null;

      // Search for the candidate pair, spec-way first.
      results.forEach(function(report) {
        if (report.type === 'transport') {
          activeCandidatePair = results.get(report.selectedCandidatePairId);
        }
      });
      // Fallback for Firefox and Chrome legacy stats.
      if (!activeCandidatePair) {
        results.forEach(function(report) {
          if (report.type === 'candidate-pair' && report.selected ||
              report.type === 'googCandidatePair' &&
              report.googActiveConnection === 'true') {
            activeCandidatePair = report;
          }
        });
      }
      if (activeCandidatePair && activeCandidatePair.remoteCandidateId) {
        remoteCandidate = results.get(activeCandidatePair.remoteCandidateId);
      }
      if (remoteCandidate) {
        if (remoteCandidate.ip && remoteCandidate.port) {
          peerDiv.innerHTML = '<strong>Connected to:</strong> ' +
              remoteCandidate.ip + ':' + remoteCandidate.port;
        } else if (remoteCandidate.ipAddress && remoteCandidate.portNumber) {
          // Fall back to old names.
          peerDiv.innerHTML = '<strong>Connected to:</strong> ' +
              remoteCandidate.ipAddress +
              ':' + remoteCandidate.portNumber;
        }
      }
    }, function(err) {
      console.log(err);
    });
    localPeerConnection.getStats(null)
    .then(function(results) {
      var statsString = dumpStats(results);
      senderStatsDiv.innerHTML = '<h2>Sender stats</h2>' + statsString;
    }, function(err) {
      console.log(err);
    });
  } else {
    console.log('Not connected yet');
  }
  // Collect some stats from the video tags.
  if (localVideo.videoWidth) {
    localVideoStatsDiv.innerHTML = '<strong>Video dimensions:</strong> ' +
      localVideo.videoWidth + 'x' + localVideo.videoHeight + 'px' + '\r\n applyConstraints : ' +counts;
  }
  if (remoteVideo.videoWidth) {
    remoteVideoStatsDiv.innerHTML = '<strong>Video dimensions:</strong> ' +
      remoteVideo.videoWidth + 'x' + remoteVideo.videoHeight + 'px';
	TestResult.width = remoteVideo.videoWidth;
	TestResult.height = remoteVideo.videoHeight;
  }
}, 1000);

// Dumping a stats variable as a string.
// might be named toString?
function dumpStats(results) {
  var statsString = '';
  results.forEach(function(res) {
    statsString += '<h3>Report type=';
    statsString += res.type;
    statsString += '</h3>\n';
    statsString += 'id ' + res.id + '<br>\n';
    statsString += 'time ' + res.timestamp + '<br>\n';
    Object.keys(res).forEach(function(k) {
      if (k !== 'timestamp' && k !== 'type' && k !== 'id') {
        statsString += k + ': ' + res[k] + '<br>\n';
      }
    });
  });
  return statsString;
}

// Utility to show the value of a range in a sibling span element
function displayRangeValue(e) {
  var span = e.target.parentElement.querySelector('span');
  span.textContent = e.target.value;
  displayGetUserMediaConstraints();
}
