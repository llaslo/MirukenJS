new function(){	

	var sampleApp = new base2.Package(this, {
		name: "sampleApp",
		imports: 'miruken.ioc',
		exports: 'sampleAppInstaller', 
		ngModule: ['ngRoute']
	});

	eval(this.imports);

	var sampleAppInstaller = Installer.extend({
		$inject: ['$routeProvider'],
		constructor: function($routeProvider){
			$routeProvider.when('/', {
				templateUrl: 'app/welcome/welcome.html',
				controller: 'WelcomeController',
				controllerAs: 'vm'
			});
		}
	});

	eval(this.exports);

}