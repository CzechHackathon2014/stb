window.twttr=(function(d,s,id){
	var t,js,fjs=d.getElementsByTagName(s)[0];
	if(d.getElementById(id)){return}
	js=d.createElement(s);
	js.id=id;
	js.src="https://platform.twitter.com/widgets.js";
	fjs.parentNode.insertBefore(js,fjs);
	return window.twttr||(t={_e:[],ready:function(f){t._e.push(f)}})
}(document,"script","twitter-wjs"));

angular.module('SmartToothBrush', []).controller("ToothBrushCtrl", function($scope, $http, $timeout) {
	var initPoints = function() {
		var dirs = ['up', 'down', 'left', 'right', 'up-inner', 'down-inner'],
			points = {},
			i, len;
		
		for (i = 0, len = dirs.length; i < len; i++) {
			points[dirs[i]] = 0;
		}
		
		return points;
	};
	
	var awardPoints = function(activity) {
		if (qualifies(activity)) {
			var dirPoints = $scope.points[activity.direction];
		
			if (dirPoints !== undefined && dirPoints < 10) {
				$scope.points[activity.direction]++;
			}
		}
		
		$scope.cleaningComplete = cleaningComplete();
	};
	
	$scope.pointToColor = function(points) {
		var yellow = [ 255, 204, 51 ],
			white = [ 238, 238, 238 ],
			result = [ 0, 0, 0 ];
			
		for (var i = 0; i < 3; i++) {
			result[i] = Math.floor(yellow[i] + points * 0.1 * (white[i] - yellow[i]));
		}
		
		return 'background-color: rgb(' + result[0] + ',' + result[1] + ',' + result[2] + ');';		
	};
	
	var totalPoints = function() {
		var p = $scope.points;
		
		return p.up + p.down + p.left + p.right;
	};
	
	$scope.pointsToWidth = function() {
		return 'width: ' + totalPoints() * 100 / 40 + '%';
	};
	
	var cleaningComplete = function() {
		return totalPoints() === 40;
	};
	
	var getDirection = function(ac) {
		var absX = Math.abs(ac[0]),
			absY = Math.abs(ac[1]),
			absZ = Math.abs(ac[2]),
			axis = 'x';
			
		if (absY > absX) {
			axis = 'y';
		}
		
		if (absZ > absX && absZ > absY) {
			axis = 'z';
		}
		
		switch (axis) {
			case 'x':
				return ac[0] > 0 ? 'inner-up' : 'inner-down';
			case 'y':
				return ac[1] > 0 ? 'right' : 'left';
			case 'z':
				return ac[2] > 0 ? 'up' : 'down';
		}
	};
	
	var qualifies = function(activity) {
		return activity.frequency >= 2.0 && activity.intensity > 0.3;
	};
	
	var analyzeDirection = function(data, offset, count, result) {
		var avg = [ 0, 0, 0 ], i, j;
		
		for (i = 0; i < count; i++) {
			var a = data[offset + i].accel;
			
			for (j = 0; j < 3; j++) {
				avg[j] += a[j];
			}
		}
		
		for (j = 0; j < 3; j++) {
			avg[j] /= count;
		}
		
		result.avgAccel = avg;
		result.direction = getDirection(avg);
	};
	
	var analyzeFFT = function(data, offset, count, result) {
		var samples = new complex_array.ComplexArray(count),
			norm = Math.sqrt(count),
			fftResults = new Array(count),
			fftSource;
		
		samples.map(function(value, i) {
			var a = data[offset + i].accel;
			value.real = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
		});
		
		fftSource = samples.magnitude();		

		samples.FFT();
	
		samples.magnitude().forEach(function(value, i) {
			fftResults[i] = value / norm;
		});
		
		
		var max = 0, maxi = 1;
		
		for (var i = 1; i < count / 2; i++) {
			if (fftResults[i] > max) {
				max = fftResults[i];
				maxi = i;
			}
		}

		result.fftSource = fftSource;
		result.fftResults = fftResults;
		result.frequency = (maxi * 10.0) / count;
		result.intensity = max;
	};
	
	var analyze = function(data, current, fftSize) {
		var result = {};
		
		analyzeDirection(data, current - fftSize, fftSize, result);
		analyzeFFT(data, current - fftSize, fftSize, result);
		
		result.qualifies = qualifies(result);
		
		$scope.fftSource = result.fftSource;
		$scope.fftResults = result.fftResults;
		
		$scope.activity.unshift(result);
		if ($scope.activity.length > 10) {
			$scope.activity.pop();
		}
		
		awardPoints(result);
		$scope.indiClass = indiClass(result);
	};
	
	var parseSample = function(s) {
		var match = s.match(/timestamp:(.+) point:(.+),(.+),(.+),(.+),(.+),(.+)/);
			
		if (match) {
			return {
				timestamp: match[1],
				accel: [ parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4]) ],
				angle: [ parseFloat(match[5]), parseFloat(match[6]), parseFloat(match[7]) ]
			};
		}
		else {
			console.log('cannot parse: ', s);
			return null;
		}			
	};
	
	var animLoop = function() {
		while ($scope.currentFrame < $scope.data.length) {
			$scope.currentPoint = $scope.data[$scope.currentFrame++];
			
			var fftSize = 30;
			
			if ($scope.currentFrame > fftSize && (($scope.currentFrame % fftSize) === 0)) {
				analyze($scope.data, $scope.currentFrame, fftSize);
			}
		}

		$timeout(animLoop, 10);
	};
	
	var indiClass = function(activity) {
		return (activity.qualifies ? 'good' : 'bad') + ' ' + activity.direction;
	};
	
	var requestLoop = function() {
		var params;
		
		if ($scope.lastCreatedAt) {
			params = {
				where: { "createdAt": { "$gt": {__type: 'Date', iso: $scope.lastCreatedAt }}},
				count: 1
			}
		}
		
		var request = $http.get('https://api.parse.com/1/classes/SensorData', {
			headers: {
				'X-Parse-Application-Id': 'LTxpj4PZ88hs9OwNLobWYwzI2Xr1nAAQpD555oPc',
				'X-Parse-REST-API-Key': 'NOl6eSpzXjySARLWGrIHgLD4qohcTQ8zzq0clLQP'
			},
			params: params
		});
		
		$scope.lastRequestSent = new Date();
		
		request.success(function(data) {
			var lastCreatedAt, sampleCount = 0;
			
		    data.results.forEach(function(rec) {
				if (rec.cleaningId !== $scope.cleaningId) {
					newCleaning(rec.cleaningId);
				}
				
				var samples = rec.data.split('|');
			
				samples.forEach(function(s) {
					$scope.data.push(parseSample(s));
				});
				
				sampleCount += samples.length;
				lastCreatedAt = rec.createdAt;
		    });
		
			if (lastCreatedAt) {
				$scope.lastCreatedAt = lastCreatedAt;
			}
			else {
				$scope.indiClass = 'bad no-data';
			}
			
			$scope.lastBatchCount = data.results.length;
			$scope.lastBatchServerCount = data.count;
			$scope.lastSampleCount = sampleCount;
			$scope.lastRequestResp = new Date();
			
			if (data.count && data.count > data.results.length) {
				requestLoop();
			}
			else {
				$timeout(requestLoop, 1000);
			}
		});
		
		request.error(function() {
		    alert('Error fetching accel data');
		});
	};
	
	var newCleaning = function(cleaningId) {
		$scope.cleaningId = cleaningId;
		$scope.data = [];
		$scope.activity = [];
		$scope.points = initPoints();
		$scope.cleaningComplete = cleaningComplete();
		
		$scope.currentFrame = 0;
	};
	
	$scope.floor = Math.floor;
		
	$scope.lastCreatedAt = undefined;
	$scope.lastBatchCount = 0;
	$scope.lastSampleCount = 0;

	$scope.fftSource = [];
	$scope.fftResults = [];
	
	$scope.data = [];
	$scope.activity = [];
	$scope.points = initPoints();
	
	$scope.currentFrame = 0;
	$scope.currentPoint = [];
	$scope.indiClass = '';
	
	requestLoop();
	animLoop();
});

