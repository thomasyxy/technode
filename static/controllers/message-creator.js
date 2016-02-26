angular.module('technodeApp').controller('MessageCreatorCtrl',function($scope,socket){
	$scope.createMessage = function(){
		socket.emit('messages.create', {
			message: $scope.newMessage,
			creator: $scope.me
		});
		$scope.newMessage = '';

		// if($scope.newMessage == ''){
		// 	return
		// }
		// socket.emit('createMessage',$scope.newMessage);
		// $scope.newMessage = '';
	}
});