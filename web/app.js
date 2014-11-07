function ToothBrushCtrl($scope, $http) {
	$scope.accel = [];
	$http.get('accelData.json').
		success(function(data) {
		    data.forEach(function(point) {
		        $scope.accel.push(point);
		    });
		}).
		error(function() {
		    alert('Error fetching accel data');
		});
}
