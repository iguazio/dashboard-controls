(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .config(routes);

    function routes($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.deferIntercept();

        $stateProvider
            .state('app', {
                abstract: true,
                url: '/',
                templateUrl: 'views/app/main.tpl.html'
            })
            .state('app.monaco', {
                url: 'monaco',
                views: {
                    main: {
                        template: '<ncl-monaco></ncl-monaco>'
                    }
                },
                data: {
                    pageTitle: 'common:MONACO'
                }
            })
            .state('app.nuclio-welcome', {
                url: 'welcome',
                views: {
                    main: {
                        template: '<ncl-projects-welcome-page></ncl-projects-welcome-page>'
                    }
                },
                data: {
                    pageTitle: 'common:WELCOME',
                    mainHeaderTitle: 'common:WELCOME'
                }
            })
            .state('app.projects', {
                url: 'projects',
                views: {
                    main: {
                        template: '<ncl-projects></ncl-projects>'
                    }
                },
                data: {
                    pageTitle: 'common:PROJECTS',
                    mainHeaderTitle: 'common:PROJECTS'
                }
            })
            .state('app.project', {
                abstract: true,
                url: 'projects/:projectId',
                views: {
                    main: {
                        template: '<ncl-project></ncl-project>'
                    }
                },
                params: {
                    createCancelled: false
                },
                data: {
                    pageTitle: 'common:FUNCTIONS',
                    mainHeaderTitle: 'common:FUNCTIONS'
                }
            })
            .state('app.project.functions', {
                url: '/functions',
                views: {
                    project: {
                        template: '<ncl-functions></ncl-functions>'
                    }
                },
                data: {
                    pageTitle: 'common:FUNCTIONS',
                    mainHeaderTitle: 'common:FUNCTIONS'
                }
            })
            .state('app.project.create-function', {
                url: '/create-function',
                views: {
                    project: {
                        template: '<ncl-create-function></ncl-create-function>'
                    }
                },
                data: {
                    pageTitle: 'common:CREATE_FUNCTION'
                }
            })
            .state('app.project.function', {
                abstract: true,
                url: '/functions/:functionId',
                views: {
                    project: {
                        template: '<ncl-function></ncl-function>'
                    }
                },
                params: {
                    projectNamespace: 'nuclio',
                    isNewFunction: false,
                    functionData: {}
                },
                data: {
                    pageTitle: 'common:FUNCTIONS',
                    mainHeaderTitle: 'common:FUNCTIONS'
                }
            })
            .state('app.project.function.edit', {
                abstract: true,
                url: '',
                views: {
                    'function': {
                        template: '<ncl-version"></ncl-version>'
                    }
                },
                params: {
                    functionData: {}
                },
                data: {
                    pageTitle: 'common:EDIT_VERSION',
                    mainHeaderTitle: 'common:EDIT_VERSION'
                }
            })
            .state('app.project.function.edit.code', {
                url: '/code',
                views: {
                    version: {
                        template: '<ncl-version-code"></ncl-version-code>'
                    }
                },
                params: {
                    functionData: {}
                },
                data: {
                    pageTitle: 'common:CODE'
                }
            })
            .state('app.project.function.edit.configuration', {
                url: '/configuration',
                views: {
                    version: {
                        template: '<ncl-version-configuration"></ncl-version-configuration>'
                    }
                },
                params: {
                    functionData: {}
                },
                data: {
                    pageTitle: 'common:CONFIGURATION'
                }
            })
            .state('app.project.function.edit.trigger', {
                url: '/trigger',
                views: {
                    version: {
                        template: '<ncl-version-trigger"></ncl-version-trigger>'
                    }
                },
                params: {
                    functionData: {}
                },
                data: {
                    pageTitle: 'common:TRIGGER'
                }
            })
            .state('app.project.function.edit.monitoring', {
                url: '/monitoring',
                views: {
                    version: {
                        template: '<ncl-version-monitoring"></ncl-version-monitoring>'
                    }
                },
                params: {
                    functionData: {}
                },
                data: {
                    pageTitle: 'common:MONITORING'
                }
            });

        $urlRouterProvider
            .when('/projects/:id', '/projects/:id/functions')
            .when('/control-panel', '/control-panel/logs')
            .when('/storage-pools/:id', '/storage-pools/:id/overview')
            .when('/projects/:id', '/projects/:id/functions')
            .when('/projects/:id/functions/:functionId', '/projects/:id/functions/:functionId/code')

            .otherwise(function ($injector) {
                $injector.get('$state').go('app.projects');
            });
    }
}());
