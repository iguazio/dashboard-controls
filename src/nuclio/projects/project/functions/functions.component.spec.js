describe('nclFunctions component:', function () {
    var $componentController;
    var $rootScope;
    var $stateParams;
    var $q;
    var ctrl;
    var project;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$stateParams_, _$q_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $stateParams = _$stateParams_;
            $q = _$q_;
        });

        project = {
            'metadata': {
                'name': 'my-project-1',
                'namespace': 'nuclio'
            },
            'spec': {
                'displayName': 'My project #1',
                'description': 'Some description'
            }
        };

        var bindings = {
            getExternalIpAddresses: $q.when.bind($q),
            getFunctions: function () {
                return $q.when({
                    data: {
                        myFunction1: {
                            metadata: {
                                name: 'functionName1',
                                namespace: 'nuclio'
                            },
                            spec: {
                                description: 'Some description',
                                runtime: 'golang',
                                replicas: 1,
                                build: {},
                                runRegistry: 'localhost:5000'
                            },
                            version: -1
                        }
                    }
                });
            },
            getProject: $q.when.bind($q, project)
        };

        ctrl = $componentController('nclFunctions', null, bindings);
        $stateParams.projectId = '18663872';

        ctrl.$onInit();
        $rootScope.$digest();
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $stateParams = null;
        $q = null;
        ctrl = null;
        project = null;
    });

    describe('$onInit(): ', function () {
        it('should set initial values for actions and delete function method', function () {
            expect(ctrl.actions).not.toBe([]);
        });
    });

    describe('refreshFunctions(): ', function () {
        it('should update function list', function () {
            ctrl.refreshFunctions();
        });
    });

    describe('isFunctionsListEmpty(): ', function () {
        it('should return true if functions list in empty', function () {
            ctrl.functions = [];

            expect(ctrl.isFunctionsListEmpty()).toBeTruthy();
        });

        it('should return false if functions list in not empty', function () {
            ctrl.functions = [
                {
                    'metadata': {
                        'name': 'functionName',
                        'namespace': 'nuclio'
                    },
                    'spec': {
                        'description': 'Some description',
                        'runtime': 'golang',
                        'replicas': 1,
                        'build': {},
                        'runRegistry': 'localhost:5000'
                    }
                }
            ];

            expect(ctrl.isFunctionsListEmpty()).toBeFalsy();
        });
    });

    describe('handleAction(): ', function () {
        it('should call action`s handlers for all checked functions', function () {
            ctrl.functions[0].ui = {
                checked: true,
                delete: angular.noop
            };

            spyOn(ctrl.functions[0].ui, 'delete');

            ctrl.handleAction('delete', [ctrl.functions[0]]);

            expect(ctrl.functions[0].ui.delete).toHaveBeenCalled();
        });
    });

    describe('toggleFilters(): ', function () {
        it('should toggle state of boolean variable "isFiltersShowed"', function () {
            expect(ctrl.isFiltersShowed.value).toBeFalsy();

            ctrl.toggleFilters();

            expect(ctrl.isFiltersShowed.value).toBeTruthy();

            ctrl.toggleFilters();

            expect(ctrl.isFiltersShowed.value).toBeFalsy();
        });
    });
});