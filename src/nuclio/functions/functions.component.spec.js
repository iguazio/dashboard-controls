describe('nclFunctions component: ', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var $state;
    var $timeout;
    var ctrl;
    var functions;
    var project;
    var sortOptions;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _$state_, _$timeout_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $state = _$state_;
            $timeout = _$timeout_;

            project = {
                metadata: {
                    name: 'my-project-1',
                    namespace: 'nuclio'
                },
                spec: {
                    description: 'Some description'
                },
                ui: {
                    functions: [functions],
                    checked: false,
                    delete: angular.noop
                }
            };
            functions = [
                {
                    metadata: {
                        name: 'functionName',
                        namespace: 'nuclio'
                    },
                    spec: {
                        description: 'Some description',
                        runtime: 'golang',
                        replicas: 1,
                        build: {},
                        runRegistry: 'localhost:5000'
                    }
                }
            ];
            sortOptions = [
                {
                    label: 'Name',
                    value: 'metadata.name',
                    active: true
                },
                {
                    label: 'Status',
                    value: 'status.state',
                    active: false
                },
                {
                    label: 'Replicas',
                    value: 'spec.replicas',
                    active: false
                },
                {
                    label: 'Runtime',
                    value: 'spec.runtime',
                    active: false
                }
            ];

            var bindings = {
                getProject: $q.when.bind($q),
                getFunctions: $q.when.bind($q),
            };
            var element = angular.element('<ncl-functions></ncl-functions>');
            var ImportService = {
                importFile: angular.noop
            };
            ctrl = $componentController('nclFunctions', {$element: element, ImportService: ImportService}, bindings);
            ctrl.$onInit();
            $rootScope.$digest();
        });
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        $state = null;
        $timeout = null;
        ctrl = null;
        functions = null;
        project = null;
        sortOptions = null;
    });

    describe('$onInit(): ', function () {
        it('should initialize functions array', function () {
            spyOn(ctrl, 'getProject').and.returnValue($q.when(project));
            spyOn(ctrl, 'refreshFunctions').and.callThrough();
            spyOn(ctrl, 'getFunctions').and.returnValue($q.when(functions));

            ctrl.project = project;
            ctrl.functions = [];

            ctrl.$onInit();
            $rootScope.$digest();
            $timeout.flush();

            expect(ctrl.getProject).toHaveBeenCalled();
            expect(ctrl.project).toEqual(project);
            expect(ctrl.refreshFunctions).toHaveBeenCalled();
            expect(ctrl.getFunctions).toHaveBeenCalled();
            expect(ctrl.functions).toEqual(functions);
        });

        it('should initialize sort options', function () {
            expect(ctrl.sortOptions).not.toBe([]);
        });


    });

    describe('handleFunctionVersionAction(): ', function () {
        it('should call action`s handlers for all checked functions', function () {
            ctrl.functions.push({
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
                }
            });
            ctrl.functions[0].ui = {
                checked: true,
                delete: angular.noop
            };

            spyOn(ctrl.functions[0].ui, 'delete');

            ctrl.handleFunctionVersionAction('delete', [ctrl.functions[0]]);

            expect(ctrl.functions[0].ui.delete).toHaveBeenCalled();
        });
    });

    describe('isFunctionsListEmpty(): ', function () {
        it('should return true if functions list in empty', function () {
            ctrl.functions = [];

            expect(ctrl.isFunctionsListEmpty()).toBeTruthy();
        });

        it('should return false if functions list in not empty', function () {
            ctrl.functions = functions;

            expect(ctrl.isFunctionsListEmpty()).toBeFalsy();
        });
    });

    describe('onApplyFilters(): ', function () {
        it('should call `search-input_refresh-search` broadcast', function () {
            spyOn($rootScope, '$broadcast').and.callThrough();

            ctrl.onApplyFilters();

            expect($rootScope.$broadcast).toHaveBeenCalledWith('search-input_refresh-search');
        });
    });

    describe('onResetFilters(): ', function () {
        it('should call `search-input_reset` broadcast', function () {
            spyOn($rootScope, '$broadcast').and.callThrough();
            ctrl.filtersCounter = 1;

            ctrl.onResetFilters();

            expect($rootScope.$broadcast).toHaveBeenCalledWith('search-input_reset');
            expect(ctrl.filtersCounter).toEqual(0)
        });
    });

    describe('onSortOptionsChange(): ', function () {
        it('should set `sortedColumnName` and `isReverseSorting` according to selected option, and sort functions', function () {
            var option = {
                value: 'metadata.name',
                desc: true
            };
            ctrl.functions = ctrl.sortedFunctions = [
                {
                    metadata: {
                        name: 'name1'
                    }
                },
                {
                    metadata: {
                        name: 'name2'
                    }
                }
            ];

            ctrl.onSortOptionsChange(option);

            expect(ctrl.sortedColumnName).toEqual('metadata.name');
            expect(ctrl.isReverseSorting).toEqual(true);
            expect(ctrl.sortedFunctions).toEqual([
                {
                    metadata: {
                        name: 'name2'
                    }
                },
                {
                    metadata: {
                        name: 'name1'
                    }
                }
            ]);
        });
    });

    describe('onUpdateFiltersCounter(): ', function () {
        it('should set `filterCounter` to 0 if `filterQuery` is empty', function () {
            ctrl.onUpdateFiltersCounter();

            expect(ctrl.filtersCounter).toEqual(0);
        });

        it('should set `filterCounter` to 1 if `filterQuery` is not empty', function () {
            ctrl.onUpdateFiltersCounter('filter query');

            expect(ctrl.filtersCounter).toEqual(1);
        });
    });

    describe('openNewFunctionScreen(): ', function () {
        it('should call `$state.go` method', function () {
            spyOn($state, 'go').and.callThrough();

            ctrl.openNewFunctionScreen();

            expect($state.go).toHaveBeenCalledWith('app.project.create-function');
        });
    });

    describe('refreshFunctions(): ', function () {
        it('should initialize functions list', function () {
            spyOn(ctrl, 'getFunctions').and.returnValue($q.when(functions));
            ctrl.project = project;
            ctrl.functions = [];

            ctrl.refreshFunctions();

            $rootScope.$digest();
            $timeout.flush();

            expect(ctrl.getFunctions).toHaveBeenCalled();
            expect(ctrl.functions).toEqual(functions);
        });
    });

    describe('sortTableByColumn(): ', function () {
        it('should set reverse sorting for the same column', function () {
            ctrl.sortedColumnName = 'some-test-column';
            ctrl.isReverseSorting = false;

            ctrl.sortTableByColumn('some-test-column');

            expect(ctrl.sortedColumnName).toBe('some-test-column');
            expect(ctrl.isReverseSorting).toBeTruthy();

            ctrl.sortTableByColumn('some-test-column');

            expect(ctrl.sortedColumnName).toBe('some-test-column');
            expect(ctrl.isReverseSorting).toBeFalsy();
        });

        it('should set sorting for the new column', function () {
            ctrl.sortedColumnName = 'some-test-column';
            ctrl.isReverseSorting = true;

            ctrl.sortTableByColumn('new-column');

            expect(ctrl.sortedColumnName).toBe('new-column');
            expect(ctrl.isReverseSorting).toBeFalsy();
        });
    });

    describe('toggleFilters(): ', function () {
        it('should change value of `ctrl.isFiltersShowed`', function () {
            ctrl.isFiltersShowed.value = false;

            ctrl.toggleFilters();

            expect(ctrl.isFiltersShowed.value).toBeTruthy();

            ctrl.toggleFilters();

            expect(ctrl.isFiltersShowed.value).toBeFalsy();
        });
    });
});
