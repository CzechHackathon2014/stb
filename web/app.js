angular.module('SmartToothBrush', [ 'angularCharts' ]).controller("ToothBrushCtrl", function($scope, $http, $timeout) {
	var reqHeaders = {
		'X-Parse-Application-Id': 'LTxpj4PZ88hs9OwNLobWYwzI2Xr1nAAQpD555oPc',
		'X-Parse-REST-API-Key': 'NOl6eSpzXjySARLWGrIHgLD4qohcTQ8zzq0clLQP'
	};
	
	$scope.brushStyle = '';
	
	$scope.data = [];
	$scope.lastCreatedAt = undefined;
	$scope.lastBatchCount = 0;
	$scope.lastSampleCount = 0;
	
	$scope.currentFrame = 0;
	$scope.totalFrames = 0;
	$scope.currentPoint = [];
	
	var setActive = function(record) {
		$scope.currentPoint = record;
		$scope.direction = getDirection(record.accel);
		//$scope.brushStyle = sampleToStyle(record);
	};
		
	var sampleToStyle = function(rec) {
		if (rec) {
			var p2s = function(aa) {
				return (aa * 10) + 'px';
			};
			
			return 'transform: perspective(100px) translateX(' + p2s(rec.accel[0]) + ') translateY(' + p2s(rec.accel[1]) + ') translateZ(' + p2s(rec.accel[2]) + ')';
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
				return Math.sign(ac[0]) > 0 ? 'nose' : 'wc';
			case 'y':
				return Math.sign(ac[1]) > 0 ? 'right' : 'left';
			case 'z':
				return Math.sign(ac[2]) > 0 ? 'up' : 'down';
		}
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
		if ($scope.currentFrame < $scope.totalFrames) {
			$timeout(function() {
				setActive($scope.data[$scope.currentFrame++]);
				animLoop();
			}, 100);
		}
		else {
			$timeout(function() {
				animLoop();
			}, 1000);
		}
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
				
				$scope.currentFrame = prevCount;
				$scope.totalFrames = newCount;
			}
			
			$scope.lastBatchCount = data.results.length;
			$scope.lastSampleCount = newCount - prevCount;
			
			$scope.lastRequestResp = new Date();
			
			$timeout(requestLoop, 5000);
		});
		
		request.error(function() {
		    alert('Error fetching accel data');
		});
	};
	
	requestLoop();
	animLoop();
});

