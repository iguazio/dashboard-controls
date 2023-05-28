/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
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
    var ElementLoadingStatusService;


    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _$state_, _$timeout_, _ElementLoadingStatusService_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $state = _$state_;
            $timeout = _$timeout_;
            ElementLoadingStatusService = _ElementLoadingStatusService_;

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
                project: project,
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
        ElementLoadingStatusService = null;
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
        it('should initialize pagination and  functions array', function () {
            spyOn(ctrl, 'refreshFunctions').and.callThrough();
            spyOn(ctrl, 'getFunctions').and.returnValue($q.when(functions));

            ctrl.functions = [];
            ctrl.page = {};

            ctrl.$onInit();
            $rootScope.$digest();
            $timeout.flush();

            expect(ctrl.refreshFunctions).toHaveBeenCalled();
            expect(ctrl.getFunctions).toHaveBeenCalledWith({ id: 'my-project-1', enrichApiGateways: true });
            expect(ctrl.functions).toEqual(functions);
            expect(ctrl.page).toEqual({
                number: 0,
                size: 10
            })
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

    describe('paginationCallback(): ', function () {
        beforeEach(function () {
            ctrl.page = {
                number: 0,
                size: 5,
                total: 2
            }
        });

        it('should change pagination page number and pagination size', function () {
            ctrl.paginationCallback(2, 10);

            expect(ctrl.page.number).toEqual(2);
            expect(ctrl.page.size).toEqual(10);
        });

        it('should show only first 5 functions from list and change total pages number', function () {
            ctrl.visibleFunctions = [];
            ctrl.originalSortedFunctions = Array(8).fill(functions[0]);

            ctrl.paginationCallback(0, 5);

            expect(ctrl.page.total).toEqual(2);
            expect(ctrl.visibleFunctions.length).toEqual(ctrl.page.size);
        });

        it('should change page number if its value >= total', function () {
            ctrl.visibleFunctions = [];
            ctrl.originalSortedFunctions = Array(8).fill(functions[0]);

            ctrl.paginationCallback(5, 5);

            expect(ctrl.page.number).toEqual(1);
        });

        it('should hide spinners by calling hideSpinnerGroup method', function () {
            spyOn(ElementLoadingStatusService, 'hideSpinnerGroup');
            ctrl.visibleFunctions = [];
            ctrl.originalSortedFunctions = Array(8).fill(functions[0]);

            ctrl.paginationCallback(1, 5);
            $timeout.flush();

            expect(ElementLoadingStatusService.hideSpinnerGroup).toHaveBeenCalledTimes(4);
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
            ctrl.functions = ctrl.originalSortedFunctions = [
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
            expect(ctrl.originalSortedFunctions).toEqual([
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
            ctrl.functions = [];

            ctrl.refreshFunctions();

            $rootScope.$digest();
            $timeout.flush();

            expect(ctrl.getFunctions).toHaveBeenCalledWith({ id: 'my-project-1', enrichApiGateways: true });
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
