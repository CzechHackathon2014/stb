angular.module('SmartToothBrush', []).controller("ToothBrushCtrl", function($scope, $http, $timeout) {
	var initProgress = function() {
		var dirs = ['up', 'down', 'left', 'right', 'up-inner', 'down-inner'],
			prog = {},
			i, len;
		
		for (i = 0, len = dirs.length; i < len; i++) {
			prog[dirs[i]] = { count: 0, points: 0 };
		}
		
		return prog;
	};
	
	var updateProgress = function(activity) {
		var dir = $scope.progress[activity.direction];
		
		if (dir) {
			dir.count++;
			dir.points += activity.intensity;
		}
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
				return Math.sign(ac[0]) > 0 ? 'inner-up' : 'inner-down';
			case 'y':
				return Math.sign(ac[1]) > 0 ? 'right' : 'left';
			case 'z':
				return Math.sign(ac[2]) > 0 ? 'up' : 'down';
		}
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
		
		$scope.fftSource = result.fftSource;
		$scope.fftResults = result.fftResults;
		
		$scope.activity.unshift(result);
		if ($scope.activity.length > 10) {
			$scope.activity.pop();
		}
		
		updateProgress(result);
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
		while ($scope.currentFrame < $scope.totalFrames) {
			$scope.currentPoint = $scope.data[$scope.currentFrame++];
			
			var fftSize = 20;
			
			if ($scope.currentFrame > fftSize && (($scope.currentFrame % fftSize) === 0)) {
				analyze($scope.data, $scope.currentFrame, fftSize);
			}
		}

		$timeout(animLoop, 10);
	};
	
	var requestLoop = function() {
		var params;
		
		if ($scope.lastCreatedAt) {
			params = {
				where: { createdAt: { $gt: {__type: 'Date', iso: $scope.lastCreatedAt }}}
			}
		}
		
		var request = $http.get('https://api.parse.com/1/classes/SensorData', {
			headers: reqHeaders,
			params: params
		});
		
		$scope.lastRequestSent = new Date();
		
		request.success(function(data) {
			var lastCreatedAt, prevCount = $scope.data.length, newCount;
			
		    data.results.forEach(function(rec) {
				var samples = rec.data.split('|');
			
				samples.forEach(function(s) {
					$scope.data.push(parseSample(s));
				});
				
				lastCreatedAt = rec.createdAt;
		    });
		
			newCount = $scope.data.length;
			
			if (lastCreatedAt) {
				$scope.lastCreatedAt = lastCreatedAt;
				$scope.totalFrames = newCount;
			}
			
			$scope.lastBatchCount = data.results.length;
			$scope.lastSampleCount = newCount - prevCount;
			
			$scope.lastRequestResp = new Date();
			
			$timeout(requestLoop, 2000);
		});
		
		request.error(function() {
		    alert('Error fetching accel data');
		});
	};
	var reqHeaders = {
		'X-Parse-Application-Id': 'LTxpj4PZ88hs9OwNLobWYwzI2Xr1nAAQpD555oPc',
		'X-Parse-REST-API-Key': 'NOl6eSpzXjySARLWGrIHgLD4qohcTQ8zzq0clLQP'
	};
	
	$scope.floor = Math.floor;
	
	$scope.data = [];
	$scope.activity = [];
	$scope.progress = initProgress();
	
	$scope.lastCreatedAt = undefined;
	$scope.lastBatchCount = 0;
	$scope.lastSampleCount = 0;

	$scope.fftSource = [];
	$scope.fftResults = [];
	
	$scope.currentFrame = 0;
	$scope.totalFrames = 0;
	$scope.currentPoint = [];
	
	requestLoop();
	animLoop();
});

