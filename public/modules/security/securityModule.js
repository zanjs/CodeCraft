/**
 * Created by william on 06.18.15.
 */
var ccSecurity = angular.module('cc.security', []);


/**
 * Security API
 */
ccSecurity.factory('securityApi', ['$http', 'promiseService', function($http, promiseService) {
	return {
		getCurrentUser: function() {
			return promiseService.wrap(function(promise) {
				$http.get(apiConfig.host + 'current-user').then(function (res) {
					promise.resolve(res.data);
				}, promise.reject);
			});
		},
		login: function(email, password) {
			return promiseService.wrap(function(promise) {
				$http.post(apiConfig.host + 'login', { email: email, password: password }).then(function(res) {
					promise.resolve(res.data);
				}, promise.reject);
			});
		},
		logout: function() {
			return promiseService.wrap(function(promise) {
				$http.post(apiConfig.host + 'logout').then(function(res) {
					promise.resolve(res.data);
				}, promise.reject);
			});
		},
		register: function(email, password, username) {
			return promiseService.wrap(function(promise) {
				$http.post(apiConfig.host + 'api/register', { email:email, password: password, username: username })
					.then(function(res) {
						promise.resolve(res.data);
					}, promise.reject);
			});
		},
		activate: function(hashCode) {
			return promiseService.wrap(function(promise) {
				$http.post(apiConfig.host + 'api/activate', { hashCode: hashCode })
					.then(function(res) {
						promise.resolve(res.data);
					}, promise.reject);
			});
		},
		findPassword: function(email) {
			return promiseService.wrap(function(promise) {
				$http.post(apiConfig.host + 'api/find-password', { email: email }).then(function(res) {
					promise.resolve(res.data);
				}, promise.reject);
			});
		},
		resetPassword: function(hashCode, password) {
			return promiseService.wrap(function(promise) {
				$http.post(apiConfig.host + 'api/reset-password', { hashCode: hashCode, password: password }).then(function(res) {
					promise.resolve(res.data);
				}, promise.reject);
			});
		}
	}
}]);


/**
 * Security Services
 */
ccSecurity.provider('security', ['$httpProvider', function() {
	var _lastMessage = undefined;

    return {
    	$get: ['$rootScope', 'securityApi', 'localStore', 'promiseService', function($rootScope, securityApi, localStore, promiseService) {
			var _user = _getUser();
			securityApi.getCurrentUser().then(function (res) {
				if (res.user !== null) {
					_user = _setUser(res.user);
					$rootScope.$broadcast('cc::security::login', _user);
				}
			});

			$rootScope.$on('cc::security::logout', function () {
				localStore.removeItem('user');
			});

			function _getUser() {
				return localStore.getItem('user');
			}
			function _setUser(user) {
				user = user;
				localStore.setItem('user', user);
				return user;
			}
			function _removeUser() {
				localStore.removeItem('user');
				_user = undefined;
			}

			return {
				lastMessage: function () {
					return _lastMessage;
				},
				currentUser: function () {
					return _user;
				},
    			login: function(email, password) {
    				return promiseService.wrap(function(promise) {
    					securityApi.login(email, password)
							.then(function(res) {
								if(res.user) {
									_setUser(res.user);
									_user = _getUser();
									$rootScope.$broadcast('cc::security::login', _user);
									promise.resolve(res.user);
								} else {
									_removeUser();
									promise.reject();
								}
    						}, function(err) {
								if(err.status === 404) {
									_lastMessage = {
										type: 'danger',
										text: '身份验证失败, 请检查您输入的电子邮箱和登录密码.'
									};
								} else {
									_lastMessage = {
										type: 'danger',
										text: '身份验证遇到问题, 请稍后重试或者联系 codecraft_cn@126.com 我们会努力解决您的问题.'
									}
								}
								_removeUser();
								promise.reject(err);
    						});
    				});
    			},
				logout: function() {
					return promiseService.wrap(function(promise) {
						securityApi.logout()
							.then(function(res) {
								_removeUser();
								$rootScope.$broadcast('cc::security::logout');
								promise.resolve();
							}, function(err) {
								_removeUser();
								promise.reject(err);
							});
					});
				},
				register: function(email, password, username) {
					return promiseService.wrap(function(promise) {
						securityApi.register(email, password, username)
							.then(function(res) {
								if(res.message == 'Email in use.') {
									_lastMessage = {
										type: 'warning',
										text: '该邮箱已经被注册, 请您尝试其他邮箱或直接进行登录.'
									};
								}
								if(res.message == 'Email sent.') {
									_lastMessage = {
										type: 'info',
										text: '验证邮件发送成功, 请登录邮箱并激活您的账户.'
									};
								}
								promise.resolve();
							}, function(err) {
								if(err.status === 400) {
									_lastMessage = {
										type: 'danger',
										text: '您刚刚提交了一个无效的请求, 请通过源艺页面提交注册.'
									}
								} else {
									_lastMessage = {
										type: 'danger',
										text: '用户注册遇到问题, 请您稍后重试或者联系 codecraft_cn@126.com 我们会努力解决您的问题.'
									}
								}
								promise.reject(err);
							});
					});
				},
				activate: function(hashCode) {
					return promiseService.wrap(function(promise) {
						securityApi.activate(hashCode)
							.then(function(res) {
								_lastMessage = {
									type: 'info',
									text: '源艺账户已经激活, 您随时可以通过右下角的菜单进行登录.'
								};
								promise.resolve();
							}, function(err) {
								if(err.status === 400) {
									_lastMessage = {
										type: 'danger',
										text: '您刚刚提交了一个无效的请求, 请点击您的源艺邮件中的链接进行账户激活.'
									}
								}
								else if(err.status === 404){
									_lastMessage = {
										type: 'warning',
										text: '您的激活链接已经过期, 请重新注册并获得新的激活链接.'
									}
								}
								else {
									_lastMessage = {
										type: 'danger',
										text: '账户激活遇到问题, 请您稍后重试或者联系 codecraft_cn@126.com 我们会努力解决您的问题.'
									}
								}
								promise.reject(err);
							});
					});
				},
				findPassword: function(email) {
					return promiseService.wrap(function(promise) {
						securityApi.findPassword(email)
							.then(function(res) {
								if(res.message == 'Email sent.') {
									_lastMessage = {
										type: 'info',
										text: '密码重置链接发送成功, 请登录邮箱并重置您的密码.'
									};
								}
								promise.resolve();
							}, function(err) {
								if(err.status === 404) {
									_lastMessage = {
										type: 'warning',
										text: '该邮箱尚未注册, 请您检查输入的电子邮箱或进行注册.'
									}
								} else {
									_lastMessage = {
										type: 'danger',
										text: '找回密码遇到问题, 请您稍后重试或者联系 codecraft_cn@126.com 我们会努力解决您的问题.'
									}
								}
								promise.reject(err);
							});
					});
				},
				resetPassword: function(hashCode, password) {
					return promiseService.wrap(function(promise) {
						securityApi.resetPassword(hashCode, password)
							.then(function(res) {
								if(res.message == 'Password reset.') {
									_lastMessage = {
										type: 'info',
										text: '您的源艺密码已重置, 可以随时使用新密码进行登录.'
									};
								}
								promise.resolve();
							}, function(err) {
								if(err.status === 404) {
									_lastMessage = {
										type: 'warning',
										text: '您的重置链接已过期, 请在登录页面输入电子邮箱并重新获取密码重置链接, 如有进一步的问题, 请联系 codecraft_cn@126.com ,我们会努力解决您的问题.'
									}
								} else {
									_lastMessage = {
										type: 'danger',
										text: '重置密码遇到问题, 请您稍后重试或者联系 codecraft_cn@126.com 我们会努力解决您的问题.'
									}
								}
								promise.reject(err);
							});
					});
				}
    		}
    	}]
    }
}]);