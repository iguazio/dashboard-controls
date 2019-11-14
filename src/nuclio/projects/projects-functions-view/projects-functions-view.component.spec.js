describe('nclProjectsFunctionsView component: ', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var $state;
    var $timeout;
    var ngDialog;
    var ExportService;
    var ProjectsService;
    var ctrl;
    var functions;
    var projects;
    var sortOptions;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _$state_, _$timeout_, _ngDialog_, _ExportService_,
                         _ProjectsService_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            $state = _$state_;
            $timeout = _$timeout_;
            ngDialog = _ngDialog_;
            ExportService = _ExportService_;
            ProjectsService = _ProjectsService_;

            projects = [
                {
                    metadata: {
                        name: 'my-project-1',
                        namespace: 'nuclio'
                    },
                    spec: {
                        description: 'Some description'
                    },
                    ui: {
                        functions: [],
                        checked: false,
                        delete: angular.noop
                    }
                },
                {
                    metadata: {
                        name: 'my-project-2',
                        namespace: 'nuclio'
                    },
                    spec: {
                        description: 'Some description'
                    },
                    ui: {
                        functions: [],
                        checked: false,
                        delete: angular.noop
                    }
                }
            ];
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
                    label: 'Project',
                    value: 'ui.project.metadata.name',
                    visible: false,
                    active: false
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
                projects: projects,
                getProject: $q.when.bind($q),
                getProjects: $q.when.bind($q),
                getFunctions: $q.when.bind($q)
            };
            var element = angular.element('<ncl-projects></ncl-projects>');
            var ImportService = {
                importFile: angular.noop
            };
            ProjectsService.viewMode = 'projects';

            ctrl = $componentController('nclProjectsFunctionsView', {$element: element, ImportService: ImportService}, bindings);
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
        ngDialog = null;
        ExportService = null;
        ProjectsService = null;
        ctrl = null;
        functions = null;
        projects = null;
        sortOptions = null;
    });

    describe('$onInit(): ', function () {
        it('should initialize projects array', function () {
            expect(ctrl.projects).toEqual(projects);
        });

        it('should initialize sort options', function () {
            expect(ctrl.sortOptions).not.toBe([]);
        });

        it('should call onFireAction() method if `action-panel_fire-action` broadcast was sent', function () {
            spyOn(ctrl, 'handleProjectAction');

            var data = {
                action: {
                    label: 'EDIT',
                    id: 'edit',
                    icon: 'igz-icon-properties',
                    active: true
                }
            };
            ctrl.projects[0].ui = {
                checked: true
            };
            projects[0].ui = ctrl.projects[0].ui;
            ProjectsService.checkedItem = 'projects';

            $rootScope.$broadcast('action-panel_fire-action', data);

            $rootScope.$digest();

            expect(ctrl.handleProjectAction).toHaveBeenCalledWith(data.action, [projects[0]]);
        });
    });

    describe('changeView(): ', function () {
        it('should change view to `projects`', function () {
            spyOn(ctrl, 'getProjects').and.returnValue($q.when());
            spyOn(ctrl, 'getFunctions').and.returnValue($q.when(functions));

            ctrl.functions = [];

            ctrl.changeView({id: 'projects'});
            $rootScope.$digest();
            $timeout.flush();

            expect(ctrl.getProjects).toHaveBeenCalled();
            expect(ctrl.getFunctions).toHaveBeenCalled();
            expect(ctrl.functions).toEqual(functions);
            expect(ProjectsService.viewMode).toEqual('projects');
            expect(ctrl.projects[0].ui.functions).not.toBe([]);
        });

        it('should change view to `functions`', function () {
            spyOn(ctrl, 'getFunctions').and.returnValue($q.when(functions));

            ctrl.functions = [];

            ctrl.changeView({id: 'functions'});
            $rootScope.$digest();
            $timeout.flush();

            expect(ctrl.getFunctions).toHaveBeenCalled();
            expect(ctrl.functions).toEqual(functions);
            expect(ProjectsService.viewMode).toEqual('functions');
            expect(ctrl.projects[0].ui.functions).not.toBe([]);
        });
    });

    describe('collapseAllRows(): ', function () {
        it('should send `collapse-all-rows` broadcast', function () {
            spyOn($rootScope, '$broadcast');

            ctrl.collapseAllRows();

            expect($rootScope.$broadcast).toHaveBeenCalledWith('collapse-all-rows', {
                rowsType: 'projects'
            })
        });
    });

    describe('expandAllRows(): ', function () {
        it('should send `expand-all-rows` broadcast', function () {
            spyOn($rootScope, '$broadcast');

            ctrl.expandAllRows();

            expect($rootScope.$broadcast).toHaveBeenCalledWith('expand-all-rows', {
                rowsType: 'projects'
            })
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

    describe('handleProjectAction(): ', function () {
        it('should call action\'s handlers for all checked projects', function () {
            var mockedValue = {
                then: function () {
                    return {
                        'catch': angular.noop
                    }
                }
            };
            ctrl.projects[1].ui.checked = true;
            projects[1].ui = ctrl.projects[1].ui;

            spyOn(ctrl.projects[0].ui, 'delete').and.returnValue(mockedValue);
            spyOn(ctrl.projects[1].ui, 'delete').and.returnValue(mockedValue);

            ctrl.handleProjectAction('delete', [ctrl.projects[0], ctrl.projects[1]]);

            expect(ctrl.projects[0].ui.delete).toHaveBeenCalled();
            expect(ctrl.projects[1].ui.delete).toHaveBeenCalled();
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

    describe('isProjectsListEmpty(): ', function () {
        it('should return true if projects list in empty', function () {
            ctrl.projects = [];

            expect(ctrl.isProjectsListEmpty()).toBeTruthy();
        });

        it('should return false if projects list in not empty', function () {
            ctrl.projects = projects;

            expect(ctrl.isProjectsListEmpty()).toBeFalsy();
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

    describe('onSelectDropdownAction(): ', function () {
        it('should call `onSelectDropdown` function', function () {
            spyOn(ctrl, 'onSelectDropdownAction');

            ctrl.onSelectDropdownAction({id: 'exportProjects'});

            expect(ctrl.onSelectDropdownAction).toHaveBeenCalled();
        });

        it('should call `exportProject` handler', function () {
            spyOn(ExportService, 'exportProjects');

            ctrl.onSelectDropdownAction({id: 'exportProjects'});

            expect(ExportService.exportProjects).toHaveBeenCalledWith(jasmine.arrayContaining([jasmine.objectContaining({
                metadata: jasmine.objectContaining({
                    name: jasmine.any(String)
                })
            })]), jasmine.any(Function));
        });
    });

    describe('onSortOptionsChange(): ', function () {
        it('should call `sortTableByColumn` function', function () {
            spyOn(ctrl, 'sortTableByColumn');

            ctrl.sortOptions = sortOptions;

            ctrl.onSortOptionsChange(ctrl.sortOptions[0]);

            expect(ctrl.sortedColumnName).toEqual('metadata.name');
            expect(ctrl.sortTableByColumn).toHaveBeenCalledWith('metadata.name');
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

            ProjectsService.viewMode = 'projects';

            ctrl.openNewFunctionScreen();

            expect($state.go).toHaveBeenCalledWith('app.create-function', {
                navigatedFrom: 'projects'
            });
        });
    });

    describe('openNewProjectDialog(): ', function () {
        it('should open ngDialog and get project list', function () {
            spyOn(ctrl, 'getProjects').and.callThrough();
            spyOn(ngDialog, 'open').and.returnValue({
                closePromise: $q.when({
                    value: 'some-value'
                })
            });

            ctrl.openNewProjectDialog();
            $rootScope.$digest();

            expect(ngDialog.open).toHaveBeenCalled();
            expect(ctrl.getProjects).toHaveBeenCalled();
        });
    });

    describe('refreshFunctions(): ', function () {
        it('should initialize functions list', function () {
            spyOn(ctrl, 'getFunctions').and.returnValue($q.when(functions));
            ctrl.projects = projects;
            ctrl.functions = [];

            ctrl.refreshFunctions();

            $rootScope.$digest();
            $timeout.flush();

            expect(ctrl.getFunctions).toHaveBeenCalled();
            expect(ctrl.functions).toEqual(functions);
            expect(ctrl.projects[0].ui.functions).not.toBe([]);
        });
    });

    describe('refreshProjects(): ', function () {
        it('should change value of `ctrl.isFiltersShowed` and call `ctrl.getProjects()`', function () {
            spyOn(ctrl, 'getProjects').and.callThrough();

            ctrl.refreshProjects();
            $rootScope.$digest();

            expect(ctrl.getProjects).toHaveBeenCalled();
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
